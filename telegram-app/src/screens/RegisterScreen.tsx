import { useState } from 'react';
import { useMainButton } from '../telegram/hooks';
import { api, Patient } from '../lib/api';
import { CLINIC_NAME } from '../lib/clinic';
import { TelegramUser } from '../telegram/webapp';

export default function RegisterScreen({
  initData,
  telegramUser,
  onDone,
}: {
  initData: string;
  telegramUser: TelegramUser | null;
  onDone: (patient: Patient) => void;
}) {
  const prefillName = [telegramUser?.first_name, telegramUser?.last_name].filter(Boolean).join(' ');
  const [fullName, setFullName] = useState(prefillName);
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<'CZ' | 'UA'>(telegramUser?.language_code === 'uk' ? 'UA' : 'CZ');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = Boolean(fullName.trim() && phone.trim() && consent) && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const patient = await api.register({ initData, fullName: fullName.trim(), phone: phone.trim(), language });
      onDone(patient);
    } catch {
      setError('Něco se nepovedlo. Zkuste to prosím znovu.');
    } finally {
      setSubmitting(false);
    }
  }

  useMainButton({ text: submitting ? 'Ukládám…' : 'Pokračovat', onClick: submit, enabled: canSubmit });

  return (
    <div className="screen">
      <div className="app-header">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
        <h1>{CLINIC_NAME}</h1>
      </div>
      <h2 className="screen-title">Vítejte 👋</h2>
      <p className="screen-subtitle">Než se budete moct objednat, potřebujeme vaše jméno a telefon.</p>

      {error && <p className="error-text">{error}</p>}

      <input className="tg-input" placeholder="Jméno a příjmení" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input
        className="tg-input"
        placeholder="Telefon (např. +420...)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <select className="tg-select" value={language} onChange={(e) => setLanguage(e.target.value as 'CZ' | 'UA')}>
        <option value="CZ">Čeština</option>
        <option value="UA">Українська</option>
      </select>

      <label className="tg-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        Souhlasím se zpracováním osobních údajů pro účely rezervace.
      </label>
    </div>
  );
}
