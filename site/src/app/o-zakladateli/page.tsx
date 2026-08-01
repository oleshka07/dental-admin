import BookButton from '@/components/BookButton';
import { CLINIC, FOUNDER } from '@/lib/content';

export const metadata = {
  title: `Dr. Dmytro Galaktionov | ${CLINIC.name} Karlovy Vary`,
  description: `Zakladatel a hlavní stomatolog ${CLINIC.name}. Dlouholetá praxe v Sokolově, člen České stomatologické komory, gnatologie a implantologie.`,
};

export default function FounderPage() {
  return (
    <div className="section container">
      <div className="founder-band">
        <div className="founder-portrait" aria-hidden="true">
          DG
        </div>
        <div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>
            {FOUNDER.name}
          </h1>
          <p className="founder-role">{FOUNDER.title}</p>
          <p>{FOUNDER.short}</p>
        </div>
      </div>

      <section className="section">
        <div className="prose">
          {FOUNDER.bio.map((para) => (
            <p key={para.slice(0, 40)}>{para}</p>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Co pacienti zmiňují nejčastěji</h2>
        <div className="card-grid cols-3">
          {FOUNDER.highlights.map((h) => (
            <div className="card" key={h.title}>
              <h3>{h.title}</h3>
              <p>{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Odbornost a vzdělávání</h2>
        <ul className="reason-list">
          <li>Člen České stomatologické komory (ČSK)</li>
          <li>Gnatologie a okluze — pravidelné kurzy, protože na skusu stojí životnost každé náhrady</li>
          <li>Estetická stomatologie a implantologie u předních evropských lektorů</li>
          <li>Dlouholetá praxe v ordinaci Léčebně preventivní zařízení s.r.o. v Sokolově</li>
        </ul>
      </section>

      <div className="callout sokolov-callout">
        <div>
          <h2 className="section-title" style={{ marginBottom: 8 }}>
            Objednat se k Dr. Galaktionovovi
          </h2>
          <p>
            Online kdykoli, telefonicky v ordinačních hodinách na{' '}
            <a className="inline-link" href={`tel:${CLINIC.phoneHref}`}>
              {CLINIC.phone}
            </a>
            .
          </p>
        </div>
        <BookButton>Objednat se online</BookButton>
      </div>
    </div>
  );
}
