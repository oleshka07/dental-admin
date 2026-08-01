import { useState } from 'react';
import Today from './pages/Today';
import Calendar from './pages/Calendar';
import SlotTemplates from './pages/SlotTemplates';
import Appointments from './pages/Appointments';
import Patients from './pages/Patients';

type Tab = 'today' | 'calendar' | 'templates' | 'appointments' | 'patients';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');

  return (
    <div className="app">
      <h1>Zubní ordinace — administrace</h1>
      <div className="tabs">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
          Dnes
        </button>
        <button className={tab === 'calendar' ? 'active' : ''} onClick={() => setTab('calendar')}>
          Kalendář
        </button>
        <button className={tab === 'templates' ? 'active' : ''} onClick={() => setTab('templates')}>
          Šablony rozvrhu
        </button>
        <button className={tab === 'appointments' ? 'active' : ''} onClick={() => setTab('appointments')}>
          Návštěvy
        </button>
        <button className={tab === 'patients' ? 'active' : ''} onClick={() => setTab('patients')}>
          Pacienti
        </button>
      </div>
      {tab === 'today' && <Today />}
      {tab === 'calendar' && <Calendar />}
      {tab === 'templates' && <SlotTemplates />}
      {tab === 'appointments' && <Appointments />}
      {tab === 'patients' && <Patients />}
    </div>
  );
}
