import { useEffect, useState } from 'react';
import { api, Appointment, AvailableSlot } from '../api';

const WEEKDAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type CellItem =
  | { kind: 'appointment'; appointment: Appointment }
  | { kind: 'free'; slot: AvailableSlot };

export default function Calendar() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [freeSlots, setFreeSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const from = toISODate(days[0]);
  const to = toISODate(days[6]);

  async function load() {
    setLoading(true);
    try {
      const [appts, slots] = await Promise.all([
        api.listAppointments({ from, to }),
        api.getAvailability(from, to),
      ]);
      setAppointments(appts);
      setFreeSlots(slots);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  async function closeSlot(slot: AvailableSlot) {
    const reason = window.prompt('Důvod uzavření (nepovinné):') ?? undefined;
    await api.closeSlot({ date: slot.date, timeStart: slot.timeStart, timeEnd: slot.timeEnd, reason });
    load();
  }

  async function setStatus(appointment: Appointment, status: string) {
    await api.updateAppointmentStatus(appointment.id, status);
    load();
  }

  return (
    <div>
      <div className="week-nav">
        <button onClick={() => setWeekStart((w) => new Date(w.getTime() - 7 * 86400000))}>← Předchozí týden</button>
        <strong>
          {from} — {to}
        </strong>
        <button onClick={() => setWeekStart((w) => new Date(w.getTime() + 7 * 86400000))}>Další týden →</button>
        {loading && <span>Načítám…</span>}
      </div>

      <div className="legend">
        <span className="status-CONFIRMED">Potvrzeno</span>
        <span className="status-PENDING_CONFIRMATION">Čeká na potvrzení</span>
        <span className="status-NEEDS_CALL">Nutno zavolat</span>
        <span className="status-FREE">Volný termín</span>
        <span className="status-CANCELLED">Zrušeno</span>
        <span className="status-NO_SHOW">Nedostavil se</span>
      </div>

      <div className="week-grid">
        {days.map((day) => {
          const dateKey = toISODate(day);
          const dayAppointments = appointments.filter((a) => a.date.slice(0, 10) === dateKey);
          const daySlots = freeSlots.filter((s) => s.date === dateKey);

          const items: CellItem[] = [
            ...dayAppointments.map((a): CellItem => ({ kind: 'appointment', appointment: a })),
            ...daySlots.map((s): CellItem => ({ kind: 'free', slot: s })),
          ].sort((a, b) => {
            const ta = a.kind === 'appointment' ? a.appointment.timeStart : a.slot.timeStart;
            const tb = b.kind === 'appointment' ? b.appointment.timeStart : b.slot.timeStart;
            return ta.localeCompare(tb);
          });

          return (
            <div className="day-column card" key={dateKey}>
              <h3>
                {WEEKDAY_NAMES[day.getDay() === 0 ? 6 : day.getDay() - 1]} {dateKey.slice(5)}
              </h3>
              {items.length === 0 && <div style={{ fontSize: 12, color: '#999' }}>—</div>}
              {items.map((item, i) =>
                item.kind === 'appointment' ? (
                  <div className={`slot-row status-${item.appointment.status}`} key={`a-${i}`}>
                    <span>
                      {item.appointment.timeStart} {item.appointment.patient.fullName} — {item.appointment.visitType.name}
                    </span>
                    <span>
                      {item.appointment.status === 'PENDING_CONFIRMATION' && (
                        <button onClick={() => setStatus(item.appointment, 'CONFIRMED')}>✓</button>
                      )}
                      {item.appointment.status !== 'CANCELLED' && (
                        <button onClick={() => setStatus(item.appointment, 'CANCELLED')}>✕</button>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="slot-row status-FREE" key={`f-${i}`}>
                    <span>
                      {item.slot.timeStart}–{item.slot.timeEnd} volno
                    </span>
                    <button onClick={() => closeSlot(item.slot)}>Zavřít</button>
                  </div>
                ),
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
