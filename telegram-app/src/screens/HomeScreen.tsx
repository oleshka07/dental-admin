import { Patient } from '../lib/api';
import { Screen } from '../types';

export default function HomeScreen({ patient, onNavigate }: { patient: Patient | null; onNavigate: (s: Screen) => void }) {
  return (
    <div className="screen">
      <div className="app-header">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
        <h1>Galactic Dent</h1>
      </div>
      <h2 className="screen-title">Ahoj{patient ? `, ${patient.fullName.split(' ')[0]}` : ''} 👋</h2>
      <p className="screen-subtitle">Co pro vás můžeme udělat?</p>

      <div className="menu-grid">
        <button className="menu-tile" onClick={() => onNavigate({ name: 'chooseVisitType' })}>
          <span className="icon">📅</span>
          <span>
            <div className="title">Objednat se</div>
            <div className="sub">Vyberte typ návštěvy a volný termín</div>
          </span>
        </button>

        <button className="menu-tile acute" onClick={() => onNavigate({ name: 'acuteSymptom' })}>
          <span className="icon">🔴</span>
          <span>
            <div className="title">Akutní bolest</div>
            <div className="sub">Nejbližší volný termín nebo zavolání zpět</div>
          </span>
        </button>

        <button className="menu-tile" onClick={() => onNavigate({ name: 'myAppointments' })}>
          <span className="icon">🗓</span>
          <span>
            <div className="title">Moje návštěvy</div>
            <div className="sub">Přehled a rušení rezervací</div>
          </span>
        </button>

        <button className="menu-tile" onClick={() => onNavigate({ name: 'assistant' })}>
          <span className="icon">💬</span>
          <span>
            <div className="title">Zeptat se</div>
            <div className="sub">Adresa, ceny, pojišťovny a další dotazy</div>
          </span>
        </button>
      </div>
    </div>
  );
}
