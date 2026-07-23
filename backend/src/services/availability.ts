import { prisma } from '../db';
import { eachDate, isoWeekday, minutesToTime, rangesOverlap, timeToMinutes, toDateOnly } from '../utils/time';

export interface AvailableSlot {
  date: string; // YYYY-MM-DD
  timeStart: string;
  timeEnd: string;
  remainingCapacity: number;
  visitTypeIds: string[];
  fromOverride: boolean;
}

/**
 * Core rule-engine: computes bookable slots for a date range, optionally
 * filtered to a single visit type. Priority, matching the spec:
 *   1. Existing (non-cancelled) appointments always reduce capacity.
 *   2. SlotException CLOSED always removes a slot, even if a SlotTemplate allows it.
 *   3. SlotException OPEN_OVERRIDE adds a slot outside the weekly templates.
 */
export async function getAvailability(params: {
  from: Date;
  to: Date;
  visitTypeId?: string;
}): Promise<AvailableSlot[]> {
  const { from, to, visitTypeId } = params;
  const dates = eachDate(from, to);

  const [templates, exceptions, appointments] = await Promise.all([
    prisma.slotTemplate.findMany({ include: { visitTypes: true } }),
    prisma.slotException.findMany({
      where: { date: { gte: toDateOnly(from), lte: toDateOnly(to) } },
    }),
    prisma.appointment.findMany({
      where: {
        date: { gte: toDateOnly(from), lte: toDateOnly(to) },
        status: { not: 'CANCELLED' },
      },
    }),
  ]);

  const result: AvailableSlot[] = [];

  for (const date of dates) {
    const weekday = isoWeekday(date);
    const dateKey = date.toISOString().slice(0, 10);

    const exceptionsForDay = exceptions.filter((e) => e.date.toISOString().slice(0, 10) === dateKey);
    const closedExceptions = exceptionsForDay.filter((e) => e.type === 'CLOSED');
    const openOverrides = exceptionsForDay.filter((e) => e.type === 'OPEN_OVERRIDE');
    const appointmentsForDay = appointments.filter((a) => a.date.toISOString().slice(0, 10) === dateKey);

    const templatesForDay = templates.filter((t) => {
      if (t.weekday !== weekday) return false;
      if (t.activeFrom && toDateOnly(t.activeFrom).getTime() > date.getTime()) return false;
      if (t.activeUntil && toDateOnly(t.activeUntil).getTime() < date.getTime()) return false;
      return true;
    });

    const daySlots = new Map<string, AvailableSlot>();

    for (const template of templatesForDay) {
      const allowedVisitTypeIds = template.visitTypes.map((v) => v.visitTypeId);
      if (visitTypeId && allowedVisitTypeIds.length > 0 && !allowedVisitTypeIds.includes(visitTypeId)) {
        continue;
      }

      const startMin = timeToMinutes(template.timeStart);
      const endMin = timeToMinutes(template.timeEnd);
      for (let t = startMin; t + template.slotLengthMinutes <= endMin; t += template.slotLengthMinutes) {
        const slotStart = minutesToTime(t);
        const slotEnd = minutesToTime(t + template.slotLengthMinutes);
        const key = `${slotStart}-${slotEnd}`;

        const isClosed = closedExceptions.some((e) => rangesOverlap(e.timeStart, e.timeEnd, slotStart, slotEnd));
        if (isClosed) continue;

        const bookedCount = appointmentsForDay.filter(
          (a) => a.timeStart === slotStart && a.timeEnd === slotEnd,
        ).length;
        const remaining = template.capacityPerSlot - bookedCount;
        if (remaining <= 0) continue;

        const existing = daySlots.get(key);
        if (existing) {
          existing.visitTypeIds = Array.from(new Set([...existing.visitTypeIds, ...allowedVisitTypeIds]));
          existing.remainingCapacity = Math.max(existing.remainingCapacity, remaining);
        } else {
          daySlots.set(key, {
            date: dateKey,
            timeStart: slotStart,
            timeEnd: slotEnd,
            remainingCapacity: remaining,
            visitTypeIds: allowedVisitTypeIds,
            fromOverride: false,
          });
        }
      }
    }

    for (const override of openOverrides) {
      const key = `${override.timeStart}-${override.timeEnd}`;
      const bookedCount = appointmentsForDay.filter(
        (a) => a.timeStart === override.timeStart && a.timeEnd === override.timeEnd,
      ).length;
      const remaining = 1 - bookedCount;
      if (remaining <= 0) continue;
      if (!daySlots.has(key)) {
        daySlots.set(key, {
          date: dateKey,
          timeStart: override.timeStart,
          timeEnd: override.timeEnd,
          remainingCapacity: remaining,
          visitTypeIds: visitTypeId ? [visitTypeId] : [],
          fromOverride: true,
        });
      }
    }

    result.push(...Array.from(daySlots.values()).sort((a, b) => a.timeStart.localeCompare(b.timeStart)));
  }

  return result;
}
