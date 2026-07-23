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
      <nav className="footer-links">
        {FOOTER_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="site-footer-inner">
        <div>
          <strong>{CLINIC.name}</strong>
          <p>{CLINIC.legalName}, IČO: {CLINIC.ico}</p>
          <p>{CLINIC.address}</p>
        </div>
        <div>
          <p>{CLINIC.phone}</p>
          <p>{CLINIC.email}</p>
        </div>
        <div>
          {CLINIC.hours.map((h) => (
            <p key={h.day}>
              {h.day}: {h.time}
            </p>
          ))}
        </div>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} {CLINIC.name}. Všechna práva vyhrazena.</p>
    </footer>
  );
}
