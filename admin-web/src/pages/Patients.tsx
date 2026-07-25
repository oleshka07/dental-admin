import { useEffect, useState } from 'react';
import { api, Appointment, Patient } from '../api';

const LANGUAGE_LABELS: Record<string, string> = { CZ: 'Čeština', UA: 'Українська', EN: 'English' };

const STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: 'Čeká na potvrzení',
  CONFIRMED: 'Potvrzeno',
  NEEDS_CALL: 'Zavolat',
  CANCELLED: 'Zrušeno',
  NO_SHOW: 'Nedostavil/a se',
  DONE: 'Proběhlo',
};

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [hideDemo, setHideDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<(Patient & { appointments: Appointment[] }) | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setPatients(await api.listPatients(search.trim() || undefined));
    } catch {
      setError('Pacienty se nepodařilo načíst.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function open(id: string) {
    try {
      setSelected(await api.getPatient(id));
    } catch {
      setError('Detail pacienta se nepodařilo načíst.');
    }
  }

  const visible = hideDemo ? patients.filter((p) => !p.isDemo) : patients;
  const demoCount = patients.filter((p) => p.isDemo).length;

  return (
    <div>
      <div className="card">
        <div className="filters">
          <input
            type="search"
            placeholder="Hledat podle jména nebo telefonu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="checkbox">
            <input type="checkbox" checked={hideDemo} onChange={(e) => setHideDemo(e.target.checked)} />
            Skrýt demo data
          </label>
          {demoCount > 0 && (
            <span className="hint">
              {demoCount} z {patients.length} záznamů je demo
            </span>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}
        {loading && <p className="hint">Načítám…</p>}
        {!loading && !error && visible.length === 0 && <p className="hint">Žádní pacienti neodpovídají filtru.</p>}

        {visible.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Jméno</th>
                <th>Telefon</th>
                <th>Jazyk</th>
                <th>Pojišťovna</th>
                <th>Telegram</th>
                <th>Nedostavil se</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.fullName} {p.isDemo && <span className="badge badge-demo">DEMO</span>}
                  </td>
                  <td>{p.phone}</td>
                  <td>{LANGUAGE_LABELS[p.language] ?? p.language}</td>
                  <td>{p.insuranceProvider === 'NONE' ? '—' : p.insuranceProvider}</td>
                  <td>{p.telegramId ? 'ano' : '—'}</td>
                  <td>{p.noShowCount ? p.noShowCount : '—'}</td>
                  <td>
                    <button onClick={() => open(p.id)}>Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="card">
          <div className="filters" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>
              {selected.fullName} {selected.isDemo && <span className="badge badge-demo">DEMO</span>}
            </h2>
            <button onClick={() => setSelected(null)}>Zavřít</button>
          </div>
          <p className="hint">
            {selected.phone}
            {selected.email ? ` · ${selected.email}` : ''} · {LANGUAGE_LABELS[selected.language] ?? selected.language}
            {selected.insuranceProvider && selected.insuranceProvider !== 'NONE' ? ` · ${selected.insuranceProvider}` : ''}
          </p>
          {selected.notes && <p>{selected.notes}</p>}

          <h3 style={{ fontSize: 15 }}>Návštěvy ({selected.appointments.length})</h3>
          {selected.appointments.length === 0 ? (
            <p className="hint">Zatím žádné návštěvy.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Čas</th>
                  <th>Stav</th>
                  <th>Zdroj</th>
                </tr>
              </thead>
              <tbody>
                {selected.appointments.map((a) => (
                  <tr key={a.id} className={`status-${a.status}`}>
                    <td>{a.date.slice(0, 10)}</td>
                    <td>{a.timeStart}</td>
                    <td>{STATUS_LABELS[a.status] ?? a.status}</td>
                    <td>{a.sourceChannel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
