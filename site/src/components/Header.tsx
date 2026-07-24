'use client';

import Link from 'next/link';
import { useState } from 'react';
import BookButton from './BookButton';
import ClinicLogo from './ClinicLogo';
import { PhoneIcon } from './icons';
import { CLINIC } from '@/lib/content';

const NAV = [
  { href: '/', label: 'Domů' },
  { href: '/o-nas', label: 'O nás' },
  { href: '/sluzby-a-ceny', label: 'Služby a ceník' },
  { href: '/o-zakladateli', label: 'MDDr. Galaktionov' },
  { href: '/kontakty', label: 'Kontakty' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        {/* The logo artwork already contains the wordmark, so a separate
            "Galactic Dent" text next to it just repeated itself. */}
        <Link href="/" className="logo-link" onClick={() => setMenuOpen(false)}>
          <ClinicLogo width={96} className="logo-img" />
          <span className="sr-only">Galactic Dent — domů</span>
        </Link>

        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <a className="header-phone" href={`tel:${CLINIC.phoneHref}`}>
            <PhoneIcon size={18} />
            <span>{CLINIC.phone}</span>
          </a>
          <BookButton>Objednat se</BookButton>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
