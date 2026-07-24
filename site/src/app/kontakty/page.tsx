import BookButton from '@/components/BookButton';
import { MapPinIcon, ClockIcon, PhoneIcon } from '@/components/icons';
import { CLINIC, SOKOLOV_BRIDGE } from '@/lib/content';

export const metadata = {
  title: 'Kontakty a ordinační hodiny | Galactic Dent Karlovy Vary',
  description:
    'Adresa, ordinační hodiny a telefon zubní ordinace Galactic Dent, Dr. Přemysla Jeřábka 1093/13, Karlovy Vary — Rybáře.',
};

export default function ContactPage() {
  return (
    <div className="section container">
      <h1 className="page-title">Kontakty</h1>
      <p className="page-lead">
        Ordinace je v Rybářích, pár minut od centra Karlových Varů. {CLINIC.languages}
      </p>

      <div className="card-grid cols-3">
        <div className="card feature-card">
          <span className="feature-icon">
            <MapPinIcon size={22} />
          </span>
          <h3>Adresa</h3>
          <p>{CLINIC.address}</p>
          <a className="inline-link" href={CLINIC.mapsUrl} target="_blank" rel="noopener noreferrer">
            Otevřít v Google Maps
          </a>
        </div>

        <div className="card feature-card">
          <span className="feature-icon">
            <ClockIcon size={22} />
          </span>
          <h3>Ordinační hodiny</h3>
          <dl className="hours-list">
            {CLINIC.hours.map((h) => (
              <div key={h.day}>
                <dt>{h.day}</dt>
                <dd>{h.time}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card feature-card">
          <span className="feature-icon">
            <PhoneIcon size={22} />
          </span>
          <h3>Spojení</h3>
          <p>
            <a className="inline-link" href={`tel:${CLINIC.phoneHref}`}>
              {CLINIC.phone}
            </a>
          </p>
          <p>
            <a className="inline-link" href={`mailto:${CLINIC.email}`}>
              {CLINIC.email}
            </a>
          </p>
          <p className="muted-note">Objednat se můžete i online, kdykoli mimo ordinační hodiny.</p>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">Jak se k nám dostanete</h2>
        <div className="card-grid cols-3">
          <div className="card">
            <h3>Autem ze Sokolova</h3>
            <p>Zhruba 20 minut po silnici 6 směr Karlovy Vary, sjezd na Rybáře.</p>
          </div>
          <div className="card">
            <h3>MHD</h3>
            <p>Rybáře jsou obsloužené několika linkami z terminálu Tržnice, jízda trvá pár minut.</p>
          </div>
          <div className="card">
            <h3>Vlakem a autobusem</h3>
            <p>Ze Sokolova jede spoj několikrát za hodinu, z nádraží je to do ordinace kousek.</p>
          </div>
        </div>
      </section>

      <div className="callout sokolov-callout">
        <div>
          <h2 className="section-title" style={{ marginBottom: 8 }}>
            {SOKOLOV_BRIDGE.heading}
          </h2>
          <p>{SOKOLOV_BRIDGE.text}</p>
        </div>
        <BookButton>{SOKOLOV_BRIDGE.cta}</BookButton>
      </div>

      <p className="legal-line">
        {CLINIC.legalName}, IČO: {CLINIC.ico}
      </p>
    </div>
  );
}
