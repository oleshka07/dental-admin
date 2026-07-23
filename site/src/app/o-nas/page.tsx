import { TEAM, FOUNDER } from '@/lib/content';

export const metadata = { title: 'O nás — Galactic Dent' };

export default function AboutPage() {
  return (
    <div className="container section">
      <h1 className="section-title">O nás</h1>
      <p className="section-subtitle">
        Galactic Dent je moderní zubní klinika, kde vysoké standardy péče MDDr. Dmytra Galaktionova
        platí pro celý tým a všechny procesy — od objednání po ošetření.
      </p>

      <h2 style={{ fontSize: 22, marginTop: 40 }}>Náš tým</h2>
      <div className="team-grid">
        {TEAM.map((member) => (
          <div className="card" key={member.name}>
            <div className="avatar-circle">
              {member.name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </div>
            <h3>{member.name}</h3>
            <p style={{ fontWeight: 600, color: 'var(--navy)' }}>{member.role}</p>
            {member.note && <p>{member.note}</p>}
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 22, marginTop: 40 }}>Naše filozofie</h2>
      <div className="card-grid">
        {FOUNDER.highlights.map((h) => (
          <div className="card" key={h}>
            <p style={{ margin: 0 }}>{h}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
