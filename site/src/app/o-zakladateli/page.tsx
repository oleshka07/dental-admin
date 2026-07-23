import { FOUNDER } from '@/lib/content';
import BookButton from '@/components/BookButton';

export const metadata = { title: 'MDDr. Dmytro Galaktionov — Galactic Dent' };

export default function FounderPage() {
  return (
    <div className="container section">
      <h1 className="section-title">{FOUNDER.name}</h1>
      <p className="section-subtitle">{FOUNDER.title}</p>

      <div className="callout" style={{ marginBottom: 32 }}>
        <p style={{ margin: 0, fontSize: 16 }}>{FOUNDER.bio}</p>
      </div>

      <h2 style={{ fontSize: 22 }}>Co pacienti oceňují nejvíce</h2>
      <div className="card-grid" style={{ marginBottom: 32 }}>
        {FOUNDER.highlights.map((h) => (
          <div className="card" key={h}>
            <p style={{ margin: 0 }}>{h}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 22 }}>Odbornost a vzdělávání</h2>
      <div className="card">
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-muted)' }}>
          <li>Člen České stomatologické komory (ČSK)</li>
          <li>Pravidelné vzdělávání v gnatologii a okluzi</li>
          <li>Kurzy estetické stomatologie a implantologie u předních evropských lektorů</li>
          <li>Dlouholetá praxe v ordinaci v Sokolově před založením Galactic Dent</li>
        </ul>
      </div>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <BookButton>Objednat se k MDDr. Galaktionovovi</BookButton>
      </div>
    </div>
  );
}
