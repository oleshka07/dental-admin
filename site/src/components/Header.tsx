'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import BookButton from './BookButton';

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
        <Link href="/" className="logo-link">
          <Image src="/logo.png" alt="Galactic Dent" width={44} height={44} className="logo-img" />
          <span className="logo-text">Galactic Dent</span>
        </Link>

        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <BookButton>Objednat se</BookButton>
          <button className="menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
