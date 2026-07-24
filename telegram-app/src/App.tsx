import { useEffect, useState } from 'react';
import { useTelegramWebApp, useBackButton } from './telegram/hooks';
import { api, Patient } from './lib/api';
import { Screen } from './types';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ChooseVisitTypeScreen from './screens/ChooseVisitTypeScreen';
import AcuteSymptomScreen from './screens/AcuteSymptomScreen';
import SlotsScreen from './screens/SlotsScreen';
import MyAppointmentsScreen from './screens/MyAppointmentsScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import AssistantScreen from './screens/AssistantScreen';

export default function App() {
  const { webApp, user } = useTelegramWebApp();
  const initData = webApp?.initData ?? '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [stack, setStack] = useState<Screen[]>([{ name: 'home' }]);

  const push = (screen: Screen) => setStack((s) => [...s, screen]);
  const pop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const reset = (screen: Screen) => setStack([screen]);

  useEffect(() => {
    if (!initData) {
      setLoading(false);
      setError('Aplikaci otevřete prosím z Telegramu — mimo Telegram nelze ověřit vaši identitu.');
      return;
    }
    api
      .session(initData)
      .then((res) => {
        setPatient(res.patient);
        if (!res.patient) setStack([{ name: 'register' }]);
        setLoading(false);
      })
      .catch(() => {
        setError('Nepodařilo se ověřit relaci. Zkuste prosím aplikaci zavřít a otevřít znovu.');
        setLoading(false);
      });
  }, [initData]);

  useBackButton({ visible: stack.length > 1, onClick: pop });

  if (loading) {
    return <div className="screen spinner-text">Načítám…</div>;
  }

  if (error) {
    return (
      <div className="screen center-state">
        <div className="emoji">⚠️</div>
        <p>{error}</p>
      </div>
    );
  }

  const current = stack[stack.length - 1];

  switch (current.name) {
    case 'register':
      return (
        <RegisterScreen
          initData={initData}
          telegramUser={user}
          onDone={(p) => {
            setPatient(p);
            reset({ name: 'home' });
          }}
        />
      );
    case 'home':
      return <HomeScreen patient={patient} onNavigate={push} />;
    case 'chooseVisitType':
      return <ChooseVisitTypeScreen onSelect={(vt) => push({ name: 'slots', visitType: vt, acute: false })} />;
    case 'acuteSymptom':
      return (
        <AcuteSymptomScreen onSubmit={(vt, symptom) => push({ name: 'slots', visitType: vt, acute: true, symptom })} />
      );
    case 'slots':
      return (
        <SlotsScreen
          screen={current}
          initData={initData}
          onBooked={(appointment) => reset({ name: 'confirmation', kind: 'booked', appointment })}
          onEscalated={() => reset({ name: 'confirmation', kind: 'escalated' })}
        />
      );
    case 'myAppointments':
      return <MyAppointmentsScreen initData={initData} />;
    case 'confirmation':
      return <ConfirmationScreen screen={current} onDone={() => reset({ name: 'home' })} webApp={webApp} />;
    case 'assistant':
      return <AssistantScreen language={patient?.language ?? 'CZ'} />;
    default:
      return null;
  }
}
