import Link from 'next/link';
import BookButton from '@/components/BookButton';
import ClinicLogo from '@/components/ClinicLogo';
import { ShieldIcon, HeartHandIcon, BoltIcon, TeamIcon, ClockIcon, MapPinIcon, PhoneIcon } from '@/components/icons';
import { SERVICES, FOUNDER, CLINIC, FIRST_VISIT, FAQ, SOKOLOV_BRIDGE } from '@/lib/content';

const REASONS = [
  {
    Icon: ShieldIcon,
    title: 'Ošetření bez bolesti',
    text: 'Včetně extrakcí a komplikovaných případů. Anestezii dávkujeme podle výkonu, ne podle rutiny.',
  },
  {
    Icon: HeartHandIcon,
    title: 'Čas na vysvětlení',
    text: 'Než sáhneme po nástrojích, víte, co se s vaším zubem děje a jaké máte možnosti.',
  },
  {
    Icon: BoltIcon,
    title: 'Protetika do 24 hodin',
    text: 'Vlastní laboratoř u ordinace. Na korunku se nečeká týdny s provizoriem v puse.',
  },
  {
    Icon: TeamIcon,
    title: 'Sehraná dvojice',
    text: 'Lékař a asistentka, kteří spolu pracují roky. U křesla je to znát na tempu i na klidu.',
  },
];

export default function HomePage() {
  const nonAcute = SERVICES.filter((s) => s.slug !== 'akutni-bolest');
  const acute = SERVICES.find((s) => s.slug === 'akutni-bolest');

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>Zubní ordinace v Karlových Varech, kde se ošetření nebojíte</h1>
            <p className="lead">
              Galactic Dent navazuje na praxi MDDr. Dmytra Galaktionova ze Sokolova. Stejný lékař,
              stejná asistentka, stejný způsob práce. Jen v nové ordinaci v Rybářích.
            </p>
            <div className="hero-actions">
              <BookButton>Objednat se online</BookButton>
              <BookButton acute variant="ghost">
                Mám akutní bolest
              </BookButton>
            </div>
            <ul className="hero-facts">
              <li>
                <ClockIcon size={18} />
                <span>Po–Čt 8:00–17:00, Pá 8:00–14:00</span>
              </li>
              <li>
                <MapPinIcon size={18} />
                <span>{CLINIC.addressShort}</span>
              </li>
              <li>
                <PhoneIcon size={18} />
                <a href={`tel:${CLINIC.phoneHref}`}>{CLINIC.phone}</a>
              </li>
            </ul>
          </div>
          <div className="hero-logo-wrap">
            <ClinicLogo width={380} priority className="hero-logo" />
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title">Proč k nám pacienti jezdí i ze Sokolova</h2>
        <p className="section-subtitle">
          Vycházíme z toho, co na dosavadní péči MDDr. Galaktionova pacienti zmiňují nejčastěji.
        </p>
        <div className="card-grid cols-4">
          {REASONS.map(({ Icon, title, text }) => (
            <div className="card feature-card" key={title}>
              <span className="feature-icon">
                <Icon size={22} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title">Co u nás vyřešíte</h2>
        <p className="section-subtitle">Péče o chrup pro celou rodinu, od prevence po implantáty.</p>
        <div className="card-grid cols-4">
          {nonAcute.map((s) => (
            <div className="card service-card" key={s.slug}>
              <div>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
              </div>
              <Link href={`/sluzby-a-ceny#${s.slug}`} className="btn btn-secondary">
                Detail a pojišťovna
              </Link>
            </div>
          ))}
        </div>

        {acute && (
          <div className="acute-band">
            <div>
              <h3>{acute.name}</h3>
              <p>{acute.detail}</p>
            </div>
            <div className="acute-band-actions">
              <BookButton acute variant="ghost">
                Řešit akutní bolest
              </BookButton>
              <a href={`tel:${CLINIC.phoneHref}`} className="acute-band-phone">
                nebo volejte {CLINIC.phone}
              </a>
            </div>
          </div>
        )}
      </section>

      <section className="section container">
        <h2 className="section-title">{FIRST_VISIT.heading}</h2>
        <p className="section-subtitle">Žádné překvapení na konci. Cenu znáte dřív, než začneme.</p>
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

      <section className="section container">
        <div className="founder-band">
          <div className="founder-portrait" aria-hidden="true">
            DG
          </div>
          <div>
            <h2 className="section-title" style={{ marginBottom: 6 }}>
              {FOUNDER.name}
            </h2>
            <p className="founder-role">{FOUNDER.title}</p>
            <p>{FOUNDER.short}</p>
            <Link href="/o-zakladateli" className="btn btn-primary">
              Více o zakladateli
            </Link>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="callout sokolov-callout">
          <div>
            <h2 className="section-title" style={{ marginBottom: 8 }}>
              {SOKOLOV_BRIDGE.heading}
            </h2>
            <p>{SOKOLOV_BRIDGE.text}</p>
          </div>
          <BookButton>{SOKOLOV_BRIDGE.cta}</BookButton>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title">Časté dotazy</h2>
        <div className="faq">
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
