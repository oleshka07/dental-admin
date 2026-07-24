import BookButton from '@/components/BookButton';
import { CLINIC, SERVICES, PRICING } from '@/lib/content';

export const metadata = {
  title: 'Služby a orientační ceník | Galactic Dent Karlovy Vary',
  description:
    'Přehled zubních výkonů, co hradí pojišťovna a kde se doplácí. Orientační ceník zubní ordinace Galactic Dent v Karlových Varech.',
};

function priceLabel(priceFrom: number | null, note?: string) {
  if (priceFrom === null) return note ?? PRICING.fallback;
  return `od ${priceFrom.toLocaleString('cs-CZ')} Kč`;
}

export default function ServicesPage() {
  return (
    <div className="section container">
      <h1 className="page-title">Služby a ceník</h1>
      <p className="page-lead">{PRICING.intro}</p>

      <div className="service-list">
        {SERVICES.map((s) => (
          <article className={`service-row ${s.slug === 'akutni-bolest' ? 'acute' : ''}`} id={s.slug} key={s.slug}>
            <div className="service-row-main">
              <h2>{s.name}</h2>
              <p className="service-row-detail">{s.detail}</p>
              <dl className="insurance-facts">
                <div>
                  <dt>Děti do 18 let</dt>
                  <dd>{s.insuranceKids}</dd>
                </div>
                <div>
                  <dt>Dospělí</dt>
                  <dd>{s.insuranceAdults}</dd>
                </div>
              </dl>
            </div>
            <aside className="service-row-side">
              {/* "Úhrada", not "Doplatek": for prevence the value is "Hrazeno
                  pojišťovnou", which a "Doplatek" label would contradict. */}
              <span className="price-label">Úhrada</span>
              <strong className="price-value">{priceLabel(s.priceFrom, s.priceNote)}</strong>
              {s.slug === 'akutni-bolest' ? (
                <BookButton acute variant="ghost">
                  Řešit akutní bolest
                </BookButton>
              ) : (
                <BookButton>Objednat se</BookButton>
              )}
            </aside>
          </article>
        ))}
      </div>

      <p className="price-disclaimer">{PRICING.disclaimer}</p>

      <section className="section">
        <h2 className="section-title">{PRICING.howWeCalculate.heading}</h2>
        <ul className="reason-list">
          {PRICING.howWeCalculate.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="section">
        <h2 className="section-title">Pokrytí zdravotní pojišťovnou</h2>
        <p className="section-subtitle">
          Spolupracujeme s VZP, OZP, ZP MV ČR a dalšími pojišťovnami. Od 1. 1. 2026 platí nová
          úhradová vyhláška, která u některých výkonů doplatek snižuje.
        </p>
        <div className="table-scroll">
          <table className="price-table">
            <thead>
              <tr>
                <th>Kategorie služeb</th>
                <th>Děti do 18 let</th>
                <th>Dospělí</th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((s) => (
                <tr key={s.slug}>
                  <td>{s.name}</td>
                  <td>{s.insuranceKids}</td>
                  <td>{s.insuranceAdults}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="callout sokolov-callout">
        <div>
          <h2 className="section-title" style={{ marginBottom: 8 }}>
            Nejste si jistí, co potřebujete?
          </h2>
          <p>
            Objednejte se na vstupní vyšetření. Projdeme chrup a řekneme si, co je nutné teď a co
            může počkat, i s cenou. Nebo zavolejte na {CLINIC.phone} a zeptejte se rovnou.
          </p>
        </div>
        <BookButton>Objednat vyšetření</BookButton>
      </div>
    </div>
  );
}
