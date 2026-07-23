import { useEffect, useState } from 'react';
import { api, VisitType } from '../lib/api';

export default function ChooseVisitTypeScreen({ onSelect }: { onSelect: (vt: VisitType) => void }) {
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listVisitTypes().then((types) => {
      setVisitTypes(types.filter((t) => !t.isAcute));
      setLoading(false);
    });
  }, []);

  return (
    <div className="screen">
      <h2 className="screen-title">Vyberte typ návštěvy</h2>
      <p className="screen-subtitle">V dalším kroku vám ukážeme nejbližší volné termíny.</p>

      {loading && <p className="spinner-text">Načítám…</p>}

      {visitTypes.map((vt) => (
        <button key={vt.id} className="tg-list-item" onClick={() => onSelect(vt)}>
          {vt.name}
          <div className="tg-list-item-sub">{vt.durationMinutes} min</div>
        </button>
      ))}
    </div>
  );
}
