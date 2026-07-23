import { useEffect, useState } from 'react';
import { useMainButton } from '../telegram/hooks';
import { api, AvailableSlot, Appointment } from '../lib/api';
import { Screen } from '../types';

function formatSlotLabel(slot: AvailableSlot): string {
  const date = new Date(`${slot.date}T00:00:00`);
  const label = date.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' });
  return `${label} · ${slot.timeStart}`;
}

export default function SlotsScreen({
  screen,
  initData,
  onBooked,
  onEscalated,
}: {
  screen: Extract<Screen, { name: 'slots' }>;
  initData: string;
  onBooked: (appointment: Appointment) => void;
  onEscalated: () => void;
}) {
  const { visitType, acute, symptom } = screen;
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const from = new Date();
    const to = new Date(Date.now() + (acute ? 3 : 21) * 24 * 60 * 60 * 1000);
    const found = await api.getAvailability(visitType.id, from.toISOString(), to.toISOString());
    setSlots(found.slice(0, 10));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function book(slot: AvailableSlot) {
    setBooking(true);
    setError('');
    const result = await api.createAppointment({
      initData,
      visitTypeId: visitType.id,
      date: slot.date,
      timeStart: slot.timeStart,
      timeEnd: slot.timeEnd,
      isAcute: acute,
      triageAnswers: acute ? { description: symptom } : undefined,
    });
    if ('error' in result) {
      setError('Tento termín byl právě obsazen. Zkuste prosím jiný.');
      setBooking(false);
      load();
      return;
    }
    onBooked(result);
  }

  async function requestCallback() {
    setBooking(true);
    await api.createUrgentRequest({ initData, visitTypeId: visitType.id, triageAnswers: { description: symptom } });
    onEscalated();
  }

  useMainButton({
    text: 'Nechat si zavolat',
    onClick: requestCallback,
    visible: acute && !loading && slots.length === 0,
    enabled: !booking,
  });

  return (
    <div className="screen">
      {acute && <div className="acute-banner">🔴 Akutní bolest</div>}
      <h2 className="screen-title">{acute ? 'Nejbližší volné termíny' : 'Vyberte volný termín'}</h2>
      <p className="screen-subtitle">{visitType.name}</p>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="spinner-text">Hledám volné termíny…</p>}

      {!loading && slots.length === 0 && !acute && (
        <p>V nejbližší době bohužel nemáme volný termín na tento typ návštěvy. Zkuste to prosím později, nebo nám zavolejte.</p>
      )}

      {!loading && slots.length === 0 && acute && (
        <p>V nejbližší době nemáme volný akutní termín. Necháme vám zavolat asistentku — použijte tlačítko níže.</p>
      )}

      {slots.map((slot, i) => (
        <button key={i} className="tg-list-item" disabled={booking} onClick={() => book(slot)}>
          {formatSlotLabel(slot)}
        </button>
      ))}
    </div>
  );
}
