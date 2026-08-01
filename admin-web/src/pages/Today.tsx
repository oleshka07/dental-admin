import { useEffect, useState } from 'react';
import { api, Appointment } from '../api';

/**
 * The assistant's screen.
 *
 * The calendar answers "what is booked"; the appointment list answers "show me
 * everything". Neither answers the only question an assistant actually has at
 * 8am: what do I have to deal with right now, and what did the system already
 * handle without me. That is what this page is for.
 */

const NEEDS_ATTENTION = ['NEEDS_CALL', 'PENDING_CONFIRMATION'];

/** Bookings that arrived through a channel where nobody on staff typed them in. */
const SELF_SERVICE_CHANNELS = ['TELEGRAM', 'WEB'];

const STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: 'Čeká na potvrzení',
  CONFIRMED: 'Potvrzeno',
  NEEDS_CALL: 'Zavolat pacientovi',
  CANCELLED: 'Zrušeno',
  NO_SHOW: 'Nedostavil/a se',
  DONE: 'Proběhlo',
};

const CHANNEL_LABELS: Record<string, string> = {
  TELEGRAM: 'Telegram',
  WEB: 'Web',
  PHONE: 'Telefon',
  ADMIN: 'Ručně',
  WHATSAPP: 'WhatsApp',
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export default function Today() {
  const today = new Date();
  const todayISO = toISODate(today);

  const [todays, setTodays] = useState<Appointment[]>([]);
  /** Which day the schedule below is actually showing — today, or the next open one. */
  const [scheduleDate, setScheduleDate] = useState(todayISO);
  const [attention, setAttention] = useState<Appointment[]>([]);
  const [lastMonth, setLastMonth] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [upcoming, history] = await Promise.all([
        // Two weeks ahead: enough to find the next open day and to collect
        // everything still unresolved.
        api.listAppointments({ from: todayISO, to: toISODate(addDays(today, 21)) }),
        api.listAppointments({ from: toISODate(addDays(today, -30)), to: todayISO }),
      ]);

      // The practice is closed at weekends, so on a Saturday "today" is empty
      // and this screen would look broken. Fall back to the next day that has
      // anything scheduled, and say so in the heading.
      const byDate = new Map<string, Appointment[]>();
      for (const a of upcoming) {
        const key = a.date.slice(0, 10);
        byDate.set(key, [...(byDate.get(key) ?? []), a]);
      }
      const firstDayWithWork = [...byDate.keys()].sort()[0];
      const shown = byDate.get(todayISO)?.length ? todayISO : firstDayWithWork ?? todayISO;

      setScheduleDate(shown);
      setTodays(byDate.get(shown) ?? []);
      setAttention(upcoming.filter((a) => NEEDS_ATTENTION.includes(a.status)));
      setLastMonth(history);
    } catch {
      setError('Data se nepodařilo načíst.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: string) {
    await api.updateAppointmentStatus(id, status);
    load();
  }

  const selfServed = lastMonth.filter((a) => SELF_SERVICE_CHANNELS.includes(a.sourceChannel));
  const selfServedPct = lastMonth.length ? Math.round((selfServed.length / lastMonth.length) * 100) : 0;
  const noShows = lastMonth.filter((a) => a.status === 'NO_SHOW').length;

  const sortedToday = [...todays].sort((a, b) => a.timeStart.localeCompare(b.timeStart));

  // If most of what these numbers are computed from is demo data, say so on the
  // screen. Somebody is going to be shown this dashboard and told what the
  // percentages mean; they must not mistake fabricated figures for a forecast.
  const demoShare = lastMonth.length
    ? lastMonth.filter((a) => a.patient.isDemo).length / lastMonth.length
    : 0;
  const showingDemoData = demoShare > 0.5;

  const scheduleHeading =
    scheduleDate === todayISO
      ? 'Dnešní program'
      : `Nejbližší ordinační den — ${scheduleDate}`;

  return (
    <div>
      <div className="stat-row">
        <div className="stat">
          <span className="stat-value">{todays.length}</span>
          <span className="stat-label">
            {scheduleDate === todayISO ? 'Dnes objednáno' : 'Objednáno nejbližší ordinační den'}
          </span>
        </div>
        <div className={`stat ${attention.length ? 'stat-warn' : ''}`}>
          <span className="stat-value">{attention.length}</span>
          <span className="stat-label">Vyžaduje vaši pozornost</span>
        </div>
        <div className="stat stat-good">
          <span className="stat-value">{selfServedPct}&nbsp;%</span>
          <span className="stat-label">
            Rezervací bez zásahu personálu
            <br />
            <small>
              {selfServed.length} z {lastMonth.length} za posledních 30 dní
            </small>
          </span>
        </div>
        <div className="stat">
          <span className="stat-value">{noShows}</span>
          <span className="stat-label">
            Nedostavili se
            <br />
            <small>za posledních 30 dní</small>
          </span>
        </div>
      </div>

      {showingDemoData && (
        <div className="demo-banner">
          <strong>Ukázková data.</strong> Většina návštěv v této databázi je vygenerovaná pro
          předvedení systému. Čísla výše ilustrují, jak bude přehled vypadat v provozu — nejsou to
          skutečné výsledky ordinace ani příslib.
        </div>
      )}

      {error && <div className="card error-text">{error}</div>}
      {loading && <div className="card hint">Načítám…</div>}

      <div className="card">
        <h2 className="section-heading">Vyžaduje vaši pozornost</h2>
        {attention.length === 0 ? (
          <p className="hint">
            Nic nečeká. Všechny nadcházející rezervace jsou potvrzené — systém je vyřídil sám.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Čas</th>
                <th>Pacient</th>
                <th>Telefon</th>
                <th>Důvod</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {attention.map((a) => (
                <tr key={a.id} className={`status-${a.status}`}>
                  <td>{a.date.slice(0, 10)}</td>
                  <td>{a.timeStart}</td>
                  <td>
                    {a.patient.fullName} {a.patient.isDemo && <span className="badge badge-demo">DEMO</span>}
                  </td>
                  <td>
                    <a href={`tel:${a.patient.phone.replace(/\s/g, '')}`}>{a.patient.phone}</a>
                  </td>
                  <td>{STATUS_LABELS[a.status] ?? a.status}</td>
                  <td className="row-actions">
                    <button onClick={() => setStatus(a.id, 'CONFIRMED')}>Potvrdit</button>
                    <button onClick={() => setStatus(a.id, 'CANCELLED')}>Zrušit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 className="section-heading">{scheduleHeading}</h2>
        {sortedToday.length === 0 ? (
          <p className="hint">V nejbližších třech týdnech nejsou žádné objednané návštěvy.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Čas</th>
                <th>Pacient</th>
                <th>Telefon</th>
                <th>Typ návštěvy</th>
                <th>Objednáno přes</th>
                <th>Stav</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {sortedToday.map((a) => (
                <tr key={a.id} className={`status-${a.status}`}>
                  <td>
                    {a.timeStart}–{a.timeEnd}
                  </td>
                  <td>
                    {a.patient.fullName} {a.patient.isDemo && <span className="badge badge-demo">DEMO</span>}
                  </td>
                  <td>
                    <a href={`tel:${a.patient.phone.replace(/\s/g, '')}`}>{a.patient.phone}</a>
                  </td>
                  <td>
                    {a.visitType.name} {a.isAcute && <span className="badge badge-acute">AKUTNÍ</span>}
                  </td>
                  <td>{CHANNEL_LABELS[a.sourceChannel] ?? a.sourceChannel}</td>
                  <td>{STATUS_LABELS[a.status] ?? a.status}</td>
                  <td className="row-actions">
                    <button onClick={() => setStatus(a.id, 'DONE')}>Proběhlo</button>
                    <button onClick={() => setStatus(a.id, 'NO_SHOW')}>Nedostavil se</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
