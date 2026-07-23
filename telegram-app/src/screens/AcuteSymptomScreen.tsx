import { useEffect, useState } from 'react';
import { useMainButton } from '../telegram/hooks';
import { api, VisitType } from '../lib/api';

export default function AcuteSymptomScreen({ onSubmit }: { onSubmit: (vt: VisitType, symptom: string) => void }) {
  const [acuteType, setAcuteType] = useState<VisitType | null>(null);
  const [symptom, setSymptom] = useState('');

  useEffect(() => {
    api.listVisitTypes().then((types) => setAcuteType(types.find((t) => t.isAcute) ?? null));
  }, []);

  useMainButton({
    text: 'Pokračovat',
    onClick: () => acuteType && onSubmit(acuteType, symptom.trim()),
    enabled: Boolean(symptom.trim() && acuteType),
  });

  return (
    <div className="screen">
      <div className="acute-banner">🔴 Akutní bolest</div>
      <h2 className="screen-title">Co vás bolí?</h2>
      <p className="screen-subtitle">Popište prosím krátce, kde to bolí, jak dlouho a zda je přítomen otok nebo horečka.</p>
      <textarea
        className="tg-textarea"
        rows={5}
        placeholder="Např. bolí mě horní zub vpravo od včerejška, je tam otok..."
        value={symptom}
        onChange={(e) => setSymptom(e.target.value)}
      />
    </div>
  );
}
