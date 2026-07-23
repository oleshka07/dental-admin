import { CLINIC, SOKOLOV_BRIDGE } from '@/lib/content';
import BookButton from '@/components/BookButton';

export const metadata = { title: 'Kontakty — Galactic Dent' };

export default function ContactPage() {
  const mapQuery = encodeURIComponent(CLINIC.address);

  return (
    <div className="container section">
      <h1 className="section-title">Kontakty</h1>

      <div className="card-grid" style={{ marginBottom: 32 }}>
        <div className="card">
          <h3>📍 Adresa</h3>
          <p>{CLINIC.address}</p>
        </div>
        <div className="card">
          <h3>🕐 Ordinační hodiny</h3>
          {CLINIC.hours.map((h) => (
            <p key={h.day} style={{ margin: 0 }}>
              {h.day}: {h.time}
            </p>
          ))}
        </div>
        <div className="card">
          <h3>☎️ Spojení</h3>
          <p style={{ margin: 0 }}>{CLINIC.phone}</p>
          <p style={{ margin: 0 }}>{CLINIC.email}</p>
        </div>
      </div>

      <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 8, border: '1px solid var(--border)' }}>
        <iframe
          title="Mapa Galactic Dent"
          width="100%"
          height="320"
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
        />
      </div>
      <p style={{ marginBottom: 32 }}>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--navy)', fontWeight: 600, fontSize: 14 }}
        >
          Otevřít v Google Maps →
        </a>
      </p>

      <div className="callout" style={{ marginBottom: 32 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>{SOKOLOV_BRIDGE.heading}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{SOKOLOV_BRIDGE.text}</p>
        <BookButton>Objednat se online</BookButton>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        {CLINIC.legalName}, IČO: {CLINIC.ico}
      </p>
    </div>
  );
}
