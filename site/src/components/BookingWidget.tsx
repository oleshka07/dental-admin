'use client';

import { useEffect, useState } from 'react';
import { useBooking } from './BookingContext';
import { api, AvailableSlot, VisitType } from '@/lib/api';

type Step = 'visitType' | 'symptom' | 'slots' | 'details' | 'submitting' | 'done' | 'escalated' | 'error';

function formatSlotLabel(slot: AvailableSlot): string {
  const date = new Date(`${slot.date}T00:00:00`);
  const label = date.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' });
  return `${label} ${slot.timeStart}`;
}

export default function BookingWidget() {
  const { isOpen, acute, closeBooking } = useBooking();
  const [step, setStep] = useState<Step>('visitType');
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([]);
  const [selectedVisitType, setSelectedVisitType] = useState<VisitType | null>(null);
  const [symptomText, setSymptomText] = useState('');
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<'CZ' | 'UA'>('CZ');
  const [consent, setConsent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    setSelectedSlot(null);
    setSymptomText('');
    api.listVisitTypes().then((types) => {
      setVisitTypes(types);
      if (acute) {
        const acuteType = types.find((t) => t.isAcute) ?? null;
        setSelectedVisitType(acuteType);
        setStep('symptom');
      } else {
        setSelectedVisitType(null);
        setStep('visitType');
      }
    });
  }, [isOpen, acute]);

  if (!isOpen) return null;

  async function chooseVisitType(vt: VisitType) {
    setSelectedVisitType(vt);
    await loadSlots(vt, 21);
  }

  async function loadSlots(vt: VisitType, horizonDays: number) {
    const from = new Date();
    const to = new Date(Date.now() + horizonDays * 24 * 60 * 60 * 1000);
    const found = await api.getAvailability(vt.id, from.toISOString(), to.toISOString());
    if (found.length === 0) {
      if (acute) {
        // No acute slot nearby: still collect contact details, but for an urgent call-back, not a real slot.
        setSlots([]);
        setStep('details');
      } else {
        setSlots([]);
        setStep('slots');
      }
      return;
    }
    setSlots(found.slice(0, 8));
    setStep('slots');
  }

  async function submitSymptom() {
    if (!selectedVisitType) return;
    await loadSlots(selectedVisitType, 3);
  }

  function chooseSlot(slot: AvailableSlot) {
    setSelectedSlot(slot);
    setStep('details');
  }

  async function submitDetails() {
    if (!fullName || !phone || !consent || !selectedVisitType) return;
    setStep('submitting');
    try {
      const patient = await api.findOrCreatePatient({ fullName, phone, language });
      await api.setConsent(patient.id);

      if (selectedSlot) {
        const result = await api.createAppointment({
          patientId: patient.id,
          visitTypeId: selectedVisitType.id,
          date: selectedSlot.date,
          timeStart: selectedSlot.timeStart,
          timeEnd: selectedSlot.timeEnd,
          sourceChannel: 'WEB',
          isAcute: acute,
          triageAnswers: acute ? { description: symptomText } : undefined,
        });
        if ('error' in result) {
          setErrorMessage('Omlouváme se, tento termín byl právě obsazen. Zkuste to prosím znovu.');
          await loadSlots(selectedVisitType, acute ? 3 : 21);
          return;
        }
        setStep('done');
      } else {
        await api.createUrgentRequest({
          patientId: patient.id,
          visitTypeId: selectedVisitType.id,
          sourceChannel: 'WEB',
          triageAnswers: { description: symptomText },
        });
        setStep('escalated');
      }
    } catch (err) {
      setErrorMessage('Něco se nepovedlo. Zkuste to prosím znovu, nebo nám zavolejte.');
      setStep('error');
    }
  }

  function reset() {
    closeBooking();
    // Reset synchronously: a delayed reset can fire after the widget has
    // already been reopened for a new flow, clobbering its fresh step.
    setStep('visitType');
    setFullName('');
    setPhone('');
    setConsent(false);
  }

  return (
    <div className="widget-overlay" role="dialog" aria-modal="true">
      <div className="widget-panel">
        <button className="widget-close" onClick={reset} aria-label="Zavřít">
          ✕
        </button>

        {acute && <div className="widget-badge widget-badge-acute">🔴 Akutní bolest</div>}

        {step === 'visitType' && (
          <>
            <h3>Vyberte typ návštěvy</h3>
            <div className="widget-options">
              {visitTypes
                .filter((v) => !v.isAcute)
                .map((vt) => (
                  <button key={vt.id} className="widget-option" onClick={() => chooseVisitType(vt)}>
                    {vt.name}
                  </button>
                ))}
            </div>
          </>
        )}

        {step === 'symptom' && (
          <>
            <h3>Co vás bolí?</h3>
            <p className="widget-hint">Popište prosím krátce, kde to bolí, jak dlouho a zda je přítomen otok nebo horečka.</p>
            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              rows={4}
              placeholder="Např. bolí mě horní zub vpravo od včerejška, je tam otok..."
            />
            <button className="widget-primary" disabled={!symptomText.trim()} onClick={submitSymptom}>
              Pokračovat
            </button>
          </>
        )}

        {step === 'slots' && (
          <>
            <h3>{acute ? 'Nejbližší volné termíny' : 'Vyberte volný termín'}</h3>
            {slots.length === 0 && <p>V nejbližší době bohužel nemáme volný termín na tento typ návštěvy.</p>}
            <div className="widget-options">
              {slots.map((s, i) => (
                <button key={i} className="widget-option" onClick={() => chooseSlot(s)}>
                  {formatSlotLabel(s)}
                </button>
              ))}
            </div>
            {slots.length === 0 && (
              <button className="widget-primary" onClick={() => setStep('details')}>
                Nechat si zavolat
              </button>
            )}
          </>
        )}

        {step === 'details' && (
          <>
            <h3>Vaše kontaktní údaje</h3>
            {errorMessage && <p className="widget-error">{errorMessage}</p>}
            <input placeholder="Jméno a příjmení" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input placeholder="Telefon (např. +420...)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <select value={language} onChange={(e) => setLanguage(e.target.value as 'CZ' | 'UA')}>
              <option value="CZ">Čeština</option>
              <option value="UA">Українська</option>
            </select>
            <label className="widget-consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              Souhlasím se zpracováním osobních údajů pro účely rezervace.
            </label>
            <button className="widget-primary" disabled={!fullName || !phone || !consent} onClick={submitDetails}>
              {selectedSlot ? 'Potvrdit rezervaci' : 'Odeslat žádost o zavolání'}
            </button>
          </>
        )}

        {step === 'submitting' && <p>Odesíláme…</p>}

        {step === 'done' && (
          <>
            <h3>Návštěva byla zarezervována ✅</h3>
            <p>Těšíme se na vás! Potvrzení obdržíte brzy SMS zprávou, případně vás budeme kontaktovat telefonicky.</p>
            <button className="widget-primary" onClick={reset}>
              Zavřít
            </button>
          </>
        )}

        {step === 'escalated' && (
          <>
            <h3>Váš požadavek jsme přijali</h3>
            <p>Naše asistentka se vám ozve co nejdříve. Při silné bolesti nebo otoku prosím rovnou zavolejte do ordinace.</p>
            <button className="widget-primary" onClick={reset}>
              Zavřít
            </button>
          </>
        )}

        {step === 'error' && (
          <>
            <p className="widget-error">{errorMessage}</p>
            <button className="widget-primary" onClick={reset}>
              Zavřít
            </button>
          </>
        )}
      </div>
    </div>
  );
}
