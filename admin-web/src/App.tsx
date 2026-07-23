import { useState } from 'react';
import Calendar from './pages/Calendar';
import SlotTemplates from './pages/SlotTemplates';
import Appointments from './pages/Appointments';

type Tab = 'calendar' | 'templates' | 'appointments';

export default function App() {
  const [tab, setTab] = useState<Tab>('calendar');

  return (
    <div className="app">
      <h1>Zubní ordinace — administrace</h1>
      <div className="tabs">
        <button className={tab === 'calendar' ? 'active' : ''} onClick={() => setTab('calendar')}>
          Kalendář
        </button>
        <button className={tab === 'templates' ? 'active' : ''} onClick={() => setTab('templates')}>
          Šablony rozvrhu
        </button>
        <button className={tab === 'appointments' ? 'active' : ''} onClick={() => setTab('appointments')}>
          Návštěvy
        </button>
      </div>
      {tab === 'calendar' && <Calendar />}
      {tab === 'templates' && <SlotTemplates />}
      {tab === 'appointments' && <Appointments />}
    </div>
  );
}
