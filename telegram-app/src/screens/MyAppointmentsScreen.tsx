import { useEffect, useState } from 'react';
import { api, Appointment } from '../lib/api';

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Potvrzeno',
  PENDING_CONFIRMATION: 'Čeká na potvrzení',
  NEEDS_CALL: 'Zavoláme vám',
  CANCELLED: 'Zrušeno',
  NO_SHOW: 'Nedostavil/a se',
  DONE: 'Proběhlo',
};

const CANCELLABLE = ['CONFIRMED', 'PENDING_CONFIRMATION'];

export default function MyAppointmentsScreen({ initData }: { initData: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setAppointments(await api.myAppointments(initData));
    } catch {
      setError('Návštěvy se nepodařilo načíst. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cancel(id: string) {
    try {
      await api.cancelAppointment(id, initData);
    } catch {
      setError('Návštěvu se nepodařilo zrušit. Zkuste to prosím znovu.');
      return;
    }
    load();
  }

  return (
    <div className="screen">
      <h2 className="screen-title">Moje návštěvy</h2>

      {loading && <p className="spinner-text">Načítám…</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && appointments.length === 0 && <p>Nemáte žádné návštěvy.</p>}

      {appointments.map((a) => (
        <div key={a.id} className="tg-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>
              {a.date.slice(0, 10)} · {a.timeStart}
            </strong>
            <span className={`status-badge status-${a.status}`}>{STATUS_LABELS[a.status] ?? a.status}</span>
          </div>
          <div className="tg-list-item-sub" style={{ marginTop: 4 }}>
            {a.visitType?.name}
          </div>
          {CANCELLABLE.includes(a.status) && (
            <button
              className="tg-list-item"
              style={{ marginTop: 10, marginBottom: 0, color: 'var(--acute-red)', textAlign: 'center' }}
              onClick={() => cancel(a.id)}
            >
              Zrušit návštěvu
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
