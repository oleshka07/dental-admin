import { useEffect, useState } from 'react';
import { api, Appointment, VisitType } from '../api';

const STATUSES = ['PENDING_CONFIRMATION', 'CONFIRMED', 'NEEDS_CALL', 'CANCELLED', 'NO_SHOW', 'DONE'];

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([]);
  const [status, setStatus] = useState('');
  const [visitTypeId, setVisitTypeId] = useState('');
  const [hideDemo, setHideDemo] = useState(false);
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  async function load() {
    const params: Record<string, string> = { from, to };
    if (status) params.status = status;
    if (visitTypeId) params.visitTypeId = visitTypeId;
    setAppointments(await api.listAppointments(params));
  }

  useEffect(() => {
    api.listVisitTypes().then(setVisitTypes);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, visitTypeId, from, to]);

  async function changeStatus(id: string, newStatus: string) {
    await api.updateAppointmentStatus(id, newStatus);
    load();
  }

  const visible = hideDemo ? appointments.filter((a) => !a.patient.isDemo) : appointments;
  const demoCount = appointments.filter((a) => a.patient.isDemo).length;

  return (
    <div>
      <div className="card">
        <div className="filters">
          <label>
            Od: <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            Do: <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Všechny stavy</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={visitTypeId} onChange={(e) => setVisitTypeId(e.target.value)}>
            <option value="">Všechny typy návštěv</option>
            {visitTypes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <label className="checkbox">
            <input type="checkbox" checked={hideDemo} onChange={(e) => setHideDemo(e.target.checked)} />
            Skrýt demo data
          </label>
          {demoCount > 0 && (
            <span className="hint">
              {demoCount} z {appointments.length} návštěv je demo
            </span>
          )}
        </div>

        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Čas</th>
              <th>Pacient</th>
              <th>Telefon</th>
              <th>Typ návštěvy</th>
              <th>Zdroj</th>
              <th>Stav</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr key={a.id} className={`status-${a.status}`}>
                <td>{a.date.slice(0, 10)}</td>
                <td>{a.timeStart}</td>
                <td>
                  {a.patient.fullName} {a.patient.isDemo && <span className="badge badge-demo">DEMO</span>}
                </td>
                <td>{a.patient.phone}</td>
                <td>{a.visitType.name}</td>
                <td>{a.sourceChannel}</td>
                <td>{a.status}</td>
                <td>
                  <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
