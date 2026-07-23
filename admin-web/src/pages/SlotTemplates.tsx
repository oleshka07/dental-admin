import { useEffect, useState } from 'react';
import { api, SlotTemplate, VisitType } from '../api';

const WEEKDAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];

export default function SlotTemplates() {
  const [templates, setTemplates] = useState<SlotTemplate[]>([]);
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([]);
  const [form, setForm] = useState({
    weekday: 1,
    timeStart: '09:00',
    timeEnd: '12:00',
    slotLengthMinutes: 20,
    capacityPerSlot: 1,
    visitTypeIds: [] as string[],
  });

  async function load() {
    const [t, v] = await Promise.all([api.listSlotTemplates(), api.listVisitTypes()]);
    setTemplates(t);
    setVisitTypes(v);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.visitTypeIds.length === 0) {
      alert('Vyberte alespoň jeden typ návštěvy.');
      return;
    }
    await api.createSlotTemplate(form);
    setForm({ ...form, visitTypeIds: [] });
    load();
  }

  async function remove(id: string) {
    if (!window.confirm('Opravdu smazat toto pravidlo rozvrhu?')) return;
    await api.deleteSlotTemplate(id);
    load();
  }

  return (
    <div>
      <div className="card">
        <h3>Nové pravidlo rozvrhu</h3>
        <form className="inline-form" onSubmit={submit}>
          <select value={form.weekday} onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}>
            {WEEKDAY_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={form.timeStart}
            onChange={(e) => setForm({ ...form, timeStart: e.target.value })}
          />
          <span>—</span>
          <input type="time" value={form.timeEnd} onChange={(e) => setForm({ ...form, timeEnd: e.target.value })} />
          <input
            type="number"
            min={5}
            step={5}
            value={form.slotLengthMinutes}
            onChange={(e) => setForm({ ...form, slotLengthMinutes: Number(e.target.value) })}
            title="Délka jednoho slotu (min)"
            style={{ width: 70 }}
          />
          <span>min/slot</span>
          <input
            type="number"
            min={1}
            value={form.capacityPerSlot}
            onChange={(e) => setForm({ ...form, capacityPerSlot: Number(e.target.value) })}
            title="Kapacita na slot"
            style={{ width: 60 }}
          />
          {visitTypes.map((vt) => (
            <label key={vt.id} style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={form.visitTypeIds.includes(vt.id)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    visitTypeIds: e.target.checked
                      ? [...form.visitTypeIds, vt.id]
                      : form.visitTypeIds.filter((id) => id !== vt.id),
                  })
                }
              />
              {vt.name}
            </label>
          ))}
          <button type="submit">Přidat pravidlo</button>
        </form>
      </div>

      <div className="card">
        <h3>Aktivní pravidla</h3>
        <table>
          <thead>
            <tr>
              <th>Den</th>
              <th>Čas</th>
              <th>Délka slotu</th>
              <th>Kapacita</th>
              <th>Typy návštěv</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {templates.map((tpl) => (
              <tr key={tpl.id}>
                <td>{WEEKDAY_NAMES[tpl.weekday - 1]}</td>
                <td>
                  {tpl.timeStart}–{tpl.timeEnd}
                </td>
                <td>{tpl.slotLengthMinutes} min</td>
                <td>{tpl.capacityPerSlot}</td>
                <td>{tpl.visitTypes.map((v) => v.visitType.name).join(', ')}</td>
                <td>
                  <button onClick={() => remove(tpl.id)}>Smazat</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
