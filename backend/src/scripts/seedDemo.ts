/**
 * Fills the database with a believable demo practice so the clinic can be shown
 * end to end — admin calendar, appointment list, Telegram Mini App.
 *
 * Run with: npm run demo:seed              (source checkout)
 *           node dist/scripts/seedDemo.js  (on the server)
 *
 * Every patient it creates carries `isDemo: true`; `npm run demo:purge` removes
 * exactly that set. The script purges before seeding, so running it twice
 * leaves one dataset rather than two.
 *
 * Optional environment:
 *   DEMO_PATIENTS      how many patients to create (default 40, max = list size)
 *   DEMO_TELEGRAM_ID   bind the first demo patient to this real Telegram id, so
 *                      opening the Mini App from that account shows a populated
 *                      visit history instead of an empty one
 */
import type { Patient } from '@prisma/client';
import { prisma } from '../db';
import { isoWeekday, minutesToTime, timeToMinutes, toDateOnly } from '../utils/time';
import { purgeDemo } from './purgeDemo';
import {
  DEMO_INSURERS,
  DEMO_NOTES,
  DEMO_NOTE_PREFIX,
  DEMO_PEOPLE,
  DEMO_PHONE_PREFIX,
  DEMO_TELEGRAM_PREFIX,
  DEMO_TRIAGE,
} from './demoConstants';

/**
 * Deterministic PRNG. The demo set must be reproducible: the same command
 * should produce the same calendar every time, or "the 14:00 slot on Thursday"
 * stops meaning anything between one run and the next.
 */
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260725);
const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
const chance = (p: number) => rand() < p;

const DAY_MS = 24 * 60 * 60 * 1000;

interface SlotRef {
  date: Date;
  timeStart: string;
  timeEnd: string;
  visitTypeIds: string[];
  capacity: number;
}

/**
 * The demo is worthless if the practice has no visit types or opening hours to
 * book against, and a fresh production database has neither — `prisma migrate
 * deploy` runs on every release but the seed never does. Create the baseline
 * only when it is missing; an existing configuration is never overwritten.
 *
 * These rows are deliberately NOT flagged as demo: they are real clinic
 * configuration and must survive `demo:purge`.
 */
async function ensureBaseline() {
  const existingTypes = await prisma.visitType.findMany();
  let acute = existingTypes.find((v) => v.isAcute);
  let checkup = existingTypes.find((v) => /prohlídk/i.test(v.name));
  let procedure = existingTypes.find((v) => !v.isAcute && v.id !== checkup?.id);

  const createdTypes: string[] = [];
  if (!acute) {
    acute = await prisma.visitType.create({
      data: { name: 'Akutní bolest', durationMinutes: 20, colorTag: '#e5484d', isAcute: true },
    });
    createdTypes.push(acute.name);
  }
  if (!checkup) {
    checkup = await prisma.visitType.create({
      data: { name: 'Preventivní prohlídka', durationMinutes: 20, colorTag: '#43a047', isAcute: false },
    });
    createdTypes.push(checkup.name);
  }
  if (!procedure) {
    procedure = await prisma.visitType.create({
      data: { name: 'Zákrok (plomba, endodoncie, protetika)', durationMinutes: 45, colorTag: '#1e88e5', isAcute: false },
    });
    createdTypes.push(procedure.name);
  }

  const templateCount = await prisma.slotTemplate.count();
  let createdTemplates = 0;
  if (templateCount === 0) {
    // Mirrors the opening hours published on the website: Po–Čt 8:00–17:00,
    // Pá 8:00–14:00, with the first hour of each day held for acute cases.
    const plan: { weekdays: number[]; timeStart: string; timeEnd: string; length: number; visitTypeId: string }[] = [
      { weekdays: [1, 2, 3, 4, 5], timeStart: '08:00', timeEnd: '09:00', length: 20, visitTypeId: acute.id },
      { weekdays: [1, 2, 3, 4, 5], timeStart: '09:00', timeEnd: '12:00', length: 20, visitTypeId: checkup.id },
      { weekdays: [1, 2, 3, 4], timeStart: '13:00', timeEnd: '17:00', length: 45, visitTypeId: procedure.id },
      { weekdays: [5], timeStart: '12:00', timeEnd: '14:00', length: 45, visitTypeId: procedure.id },
    ];
    for (const row of plan) {
      for (const weekday of row.weekdays) {
        await prisma.slotTemplate.create({
          data: {
            weekday,
            timeStart: row.timeStart,
            timeEnd: row.timeEnd,
            slotLengthMinutes: row.length,
            capacityPerSlot: 1,
            visitTypes: { create: [{ visitTypeId: row.visitTypeId }] },
          },
        });
        createdTemplates += 1;
      }
    }
  }

  return { acute, checkup, procedure, createdTypes, createdTemplates };
}

/** Expands the weekly templates into concrete slots across a date range. */
async function expandSlots(from: Date, to: Date): Promise<SlotRef[]> {
  const templates = await prisma.slotTemplate.findMany({ include: { visitTypes: true } });
  const slots: SlotRef[] = [];

  for (let d = toDateOnly(from).getTime(); d <= toDateOnly(to).getTime(); d += DAY_MS) {
    const date = new Date(d);
    const weekday = isoWeekday(date);
    for (const template of templates.filter((t) => t.weekday === weekday)) {
      const start = timeToMinutes(template.timeStart);
      const end = timeToMinutes(template.timeEnd);
      for (let t = start; t + template.slotLengthMinutes <= end; t += template.slotLengthMinutes) {
        slots.push({
          date,
          timeStart: minutesToTime(t),
          timeEnd: minutesToTime(t + template.slotLengthMinutes),
          visitTypeIds: template.visitTypes.map((v) => v.visitTypeId),
          capacity: template.capacityPerSlot,
        });
      }
    }
  }
  return slots;
}

async function main() {
  const removed = await purgeDemo();
  if (removed.patients > 0) {
    console.log('Removed the previous demo set first:', removed);
  }

  const baseline = await ensureBaseline();
  if (baseline.createdTypes.length) console.log('Created visit types:', baseline.createdTypes.join(', '));
  if (baseline.createdTemplates) console.log(`Created ${baseline.createdTemplates} slot templates from the published opening hours.`);

  const requested = Number(process.env.DEMO_PATIENTS ?? 40);
  const count = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 40, DEMO_PEOPLE.length));
  const boundTelegramId = process.env.DEMO_TELEGRAM_ID?.trim();

  // --- Patients ------------------------------------------------------------
  const patients: Patient[] = [];
  for (let i = 0; i < count; i++) {
    const person = DEMO_PEOPLE[i];
    // Most patients reach us through Telegram; the rest are phone/walk-in.
    const hasTelegram = chance(0.6);
    const noShowCount = chance(0.12) ? 1 + Math.floor(rand() * 2) : 0;

    const patient = await prisma.patient.create({
      data: {
        fullName: person.name,
        phone: `${DEMO_PHONE_PREFIX}${String(100000 + i).slice(-6)}`,
        telegramId: hasTelegram ? `${DEMO_TELEGRAM_PREFIX}${i}` : null,
        email: chance(0.3) ? `demo${i}@example.invalid` : null,
        language: person.language,
        insuranceProvider: pick(DEMO_INSURERS),
        consentDataProcessing: true,
        consentDataAt: new Date(Date.now() - Math.floor(rand() * 120) * DAY_MS),
        consentHealthData: chance(0.7),
        notes: chance(0.45) ? `${DEMO_NOTE_PREFIX} ${pick(DEMO_NOTES)}` : DEMO_NOTE_PREFIX,
        noShowCount,
        isDemo: true,
      },
    });
    patients.push(patient);
  }

  /**
   * The account that will be used to demonstrate the Mini App.
   *
   * If DEMO_TELEGRAM_ID already belongs to somebody — which it usually does,
   * because whoever runs the demo registered through the Mini App at some
   * point — we do NOT take the id away from them. Their real record stays
   * exactly as it is and simply receives the demo visit history, which is
   * flagged on the appointments themselves so `demo:purge` can take it back
   * out without touching the patient.
   *
   * Only when the id is unknown do we hand it to a generated patient.
   */
  let showcase = patients[0];
  if (boundTelegramId) {
    const existing = await prisma.patient.findUnique({ where: { telegramId: boundTelegramId } });
    if (existing) {
      showcase = existing;
      console.log(
        `Telegram id ${boundTelegramId} already belongs to "${existing.fullName}"` +
          `${existing.isDemo ? ' (demo)' : ' (real patient — record left untouched)'}; ` +
          'giving that account the demo visit history.',
      );
    } else {
      await prisma.patient.update({ where: { id: showcase.id }, data: { telegramId: boundTelegramId } });
      console.log(`Bound demo patient "${showcase.fullName}" to Telegram id ${boundTelegramId}.`);
    }
  }

  // --- Appointments --------------------------------------------------------
  const today = toDateOnly(new Date());
  const past = await expandSlots(new Date(today.getTime() - 56 * DAY_MS), new Date(today.getTime() - DAY_MS));
  const future = await expandSlots(today, new Date(today.getTime() + 28 * DAY_MS));

  const acuteId = baseline.acute.id;
  const created: { status: string }[] = [];

  async function book(slot: SlotRef, when: 'past' | 'future', forPatient?: Patient) {
    const visitTypeId = pick(slot.visitTypeIds.length ? slot.visitTypeIds : [baseline.checkup.id]);
    const isAcute = visitTypeId === acuteId;
    const patient = forPatient ?? pick(patients);

    const status = when === 'past'
      ? (chance(0.82) ? 'DONE' : chance(0.5) ? 'NO_SHOW' : 'CANCELLED')
      : (chance(0.62) ? 'CONFIRMED' : chance(0.7) ? 'PENDING_CONFIRMATION' : 'NEEDS_CALL');

    const sourceChannel = isAcute
      ? pick(['TELEGRAM', 'PHONE', 'PHONE'] as const)
      : pick(['TELEGRAM', 'TELEGRAM', 'WEB', 'PHONE', 'ADMIN'] as const);

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        visitTypeId,
        date: slot.date,
        timeStart: slot.timeStart,
        timeEnd: slot.timeEnd,
        status: status as never,
        isAcute,
        sourceChannel,
        // Flagged on the row itself, not just inferred from the patient: the
        // showcase history below may belong to a real patient.
        isDemo: true,
        triageAnswers: isAcute ? pick(DEMO_TRIAGE) : undefined,
        createdAt: new Date(slot.date.getTime() - (1 + Math.floor(rand() * 10)) * DAY_MS),
        confirmedAt: status === 'CONFIRMED' || status === 'DONE' ? new Date(slot.date.getTime() - DAY_MS) : null,
      },
    });
    created.push({ status });
  }

  // Reserve the showcase account's own history first, so it is guaranteed to
  // have something to show rather than depending on a random draw. Taken off
  // the front of each pool so the slots cannot then be double-booked below.
  const showcasePast = past.splice(past.length - 4, 4); // the four most recent past slots
  const showcaseFuture = future.splice(2, 2); // two upcoming ones
  for (const slot of showcasePast) await book(slot, 'past', showcase);
  for (const slot of showcaseFuture) await book(slot, 'future', showcase);
  console.log(`Showcase account "${showcase.fullName}" got ${showcasePast.length + showcaseFuture.length} visits.`);

  // A finished week looks busy; roughly four visits in five actually happened.
  for (const slot of past) {
    if (chance(0.78)) await book(slot, 'past');
  }

  // The future is deliberately left mostly open — a demo where every slot is
  // taken cannot show the booking flow working.
  for (const slot of future) {
    if (chance(0.35)) await book(slot, 'future');
  }

  // --- Waitlist ------------------------------------------------------------
  let waitlist = 0;
  for (const patient of patients.slice(0, 6)) {
    await prisma.waitlistEntry.create({
      data: {
        patientId: patient.id,
        visitTypeId: baseline.checkup.id,
        desiredDateFrom: new Date(today.getTime() + 2 * DAY_MS),
        desiredDateUntil: new Date(today.getTime() + 21 * DAY_MS),
        status: 'ACTIVE',
      },
    });
    waitlist += 1;
  }

  const byStatus = created.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log('\nDemo data created:');
  console.log(`  patients:      ${patients.length}`);
  console.log(`  appointments:  ${created.length}`, byStatus);
  console.log(`  waitlist:      ${waitlist}`);
  console.log('\nRemove it all again with: npm run demo:purge');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
