import Image from 'next/image';
import Link from 'next/link';
import BookButton from '@/components/BookButton';
import { SERVICES, FOUNDER } from '@/lib/content';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <h1>Moderní zubní péče v Karlových Varech — bez bolesti a beze stresu</h1>
            <p className="lead">
              Klinika Galactic Dent navazuje na dlouholetou praxi MDDr. Dmytra Galaktionova ze Sokolova.
              Stejný lékař, stejný přístup — nyní v nové, moderně vybavené ordinaci.
            </p>
            <div className="hero-actions">
              <BookButton>📅 Objednat se online</BookButton>
              <BookButton acute variant="ghost">
                🔴 Mám akutní bolest
              </BookButton>
            </div>
          </div>
          <div className="hero-logo-wrap">
            <Image src="/logo.png" alt="Galactic Dent" width={340} height={340} priority />
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title">Proč si pacienti vybírají Galactic Dent</h2>
        <p className="section-subtitle">
          Vycházíme z toho, co si na dosavadní péči MDDr. Galaktionova pacienti nejvíce cení.
        </p>
        <div className="card-grid">
          <div className="card">
            <h3>😌 Zcela bez bolesti</h3>
            <p>Moderní anestezie a šetrné postupy i u komplikovaných extrakcí.</p>
          </div>
          <div className="card">
            <h3>🤝 Lidský přístup</h3>
            <p>Čas na vysvětlení, klid pro pacienta a podpora i pro ty, kdo měnil lékaře.</p>
          </div>
          <div className="card">
            <h3>⚡ Protetika do 24 hodin</h3>
            <p>Vlastní laboratoř umožňuje expresní zhotovení náhrad a korunek.</p>
          </div>
          <div className="card">
            <h3>👩‍⚕️ Zkušený tým</h3>
            <p>Lékař a asistentka, kteří spolu léta pracují v naprosté souhře.</p>
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title">Naše služby</h2>
        <p className="section-subtitle">Kompletní péče o chrup pro celou rodinu — od prevence po protetiku.</p>
        <div className="card-grid">
          {SERVICES.map((s) => (
            <div className={`card ${s.slug === 'akutni-bolest' ? 'acute' : ''}`} key={s.slug}>
              <h3>{s.name}</h3>
              <p>{s.description}</p>
              {s.slug === 'akutni-bolest' ? (
                <BookButton acute variant="ghost">
                  Řešit akutní bolest
                </BookButton>
              ) : (
                <Link href="/sluzby-a-ceny" className="btn btn-secondary">
                  Zjistit více
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="callout" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: 8 }}>
              {FOUNDER.name}
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 560 }}>{FOUNDER.bio}</p>
          </div>
          <Link href="/o-zakladateli" className="btn btn-primary">
            Více o zakladateli
          </Link>
        </div>
      </section>
    </>
  );
}
