import Link from 'next/link';
import { CLINIC } from '@/lib/content';

const FOOTER_LINKS = [
  { href: '/', label: 'Domů' },
  { href: '/o-nas', label: 'O nás a tým' },
  { href: '/sluzby-a-ceny', label: 'Služby a ceník' },
  { href: '/o-zakladateli', label: 'MDDr. Galaktionov' },
  { href: '/kontakty', label: 'Kontakty' },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="footer-col">
          <strong className="footer-brand">{CLINIC.name}</strong>
          <p>{CLINIC.address}</p>
          <p className="footer-legal">
            {CLINIC.legalName}, IČO: {CLINIC.ico}
          </p>
        </div>

        <div className="footer-col">
          <h3>Spojení</h3>
          <p>
            <a href={`tel:${CLINIC.phoneHref}`}>{CLINIC.phone}</a>
          </p>
          <p>
            <a href={`mailto:${CLINIC.email}`}>{CLINIC.email}</a>
          </p>
        </div>

        <div className="footer-col">
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

        <div className="footer-col">
          <h3>Na webu</h3>
          <nav className="footer-links">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="container">
        {/* Deliberately a literal, not new Date().getFullYear(): this is a static
            export, so the build year would be baked in anyway — a computed value
            only risks a server/client mismatch across a New Year boundary. */}
        <p className="footer-copy">© 2026 {CLINIC.name}. Všechna práva vyhrazena.</p>
      </div>
    </footer>
  );
}
