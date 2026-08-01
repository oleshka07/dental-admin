import BookButton from '@/components/BookButton';
import { CLINIC, TEAM, FOUNDER, FIRST_VISIT } from '@/lib/content';

export const metadata = {
  title: `O nás a náš tým | ${CLINIC.name} Karlovy Vary`,
  description: `Kdo je za ${CLINIC.name}, jak pracujeme a co čekat od první návštěvy. Zubní ordinace v Karlových Varech — Rybářích.`,
};

export default function AboutPage() {
  return (
    <div className="section container">
      <h1 className="page-title">O nás</h1>
      <p className="page-lead">
        Malá ordinace v Rybářích, kde vás ošetří stejný lékař pokaždé. Žádné předávání mezi
        směnami, žádné odbývání kvůli přeplněnému kalendáři. {CLINIC.languages}
      </p>

      <section className="section">
        <h2 className="section-title">Náš tým</h2>
        <div className="card-grid cols-2">
          {TEAM.map((member) => (
            <div className="card team-card" key={member.name}>
              <div className="avatar-circle" aria-hidden="true">
                {member.initials}
              </div>
              <div>
                <h3>{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p>{member.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Jak pracujeme</h2>
        <p className="section-subtitle">
          Tři věci, které pacienti zmiňují nejčastěji, když vysvětlují, proč sem jezdí i z jiného
          města.
        </p>
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
        <h2 className="section-title">{FIRST_VISIT.heading}</h2>
        <ol className="steps">
          {FIRST_VISIT.steps.map((step, i) => (
            <li key={step.title}>
              <span className="step-num">{i + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="callout sokolov-callout">
        <div>
          <h2 className="section-title" style={{ marginBottom: 8 }}>
            Přijímáme nové pacienty
          </h2>
          <p>
            Registrace probíhá při první návštěvě. Stačí kartička pojišťovny a doklad totožnosti.
            Objednat se můžete online nebo na {CLINIC.phone}.
          </p>
        </div>
        <BookButton>Objednat se online</BookButton>
      </div>
    </div>
  );
}
