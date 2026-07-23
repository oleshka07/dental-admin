import { SERVICES } from '@/lib/content';
import BookButton from '@/components/BookButton';

export const metadata = { title: 'Služby a ceník — Galactic Dent' };

export default function ServicesPage() {
  return (
    <div className="container section">
      <h1 className="section-title">Služby a ceník</h1>
      <p className="section-subtitle">
        Ceny výkonů jsou stanoveny transparentně na základě časové náročnosti ošetření a použitého
        materiálu, v souladu s Cenovým výměrem MZ ČR. U výkonů hrazených pojišťovnou vždy jasně
        rozlišujeme, co je hrazeno a kde je případný doplatek.
      </p>

      <div className="card-grid" style={{ marginBottom: 40 }}>
        {SERVICES.map((s) => (
          <div className={`card ${s.slug === 'akutni-bolest' ? 'acute' : ''}`} key={s.slug}>
            <h3>{s.name}</h3>
            <p>{s.description}</p>
            <BookButton acute={s.slug === 'akutni-bolest'}>Objednat se</BookButton>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 22 }}>Pokrytí zdravotní pojišťovnou (2026)</h2>
      <p className="section-subtitle">Spolupracujeme s VZP, OZP, ZP MV ČR a dalšími pojišťovnami.</p>
      <div style={{ overflowX: 'auto' }}>
        <table className="price-table">
          <thead>
            <tr>
              <th>Kategorie služeb</th>
              <th>Děti do 18 let</th>
              <th>Dospělí</th>
            </tr>
          </thead>
          <tbody>
            {SERVICES.filter((s) => s.slug !== 'akutni-bolest').map((s) => (
              <tr key={s.slug}>
                <td>{s.name}</td>
                <td>{s.insuranceKids}</td>
                <td>{s.insuranceAdults}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="callout" style={{ marginTop: 32 }}>
        <h3 style={{ marginTop: 0 }}>Jak počítáme cenu ošetření</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Základem kalkulace je hodinová/minutová sazba kliniky, která zohledňuje čas lékaře, provozní
          náklady a použité vybavení. Standardní materiály jsou zahrnuty v ceně výkonu hrazeného
          pojišťovnou, nadstandardní materiály (např. estetické kompozity, nadstandardní protetika)
          jsou účtovány zvlášť a vždy vám je před ošetřením sdělíme.
        </p>
      </div>
    </div>
  );
}
