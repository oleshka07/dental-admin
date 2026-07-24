'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { HomeIcon, ServicesIcon, PersonIcon, MapPinIcon, CalendarPlusIcon } from './icons';
import ActionSheet from './ActionSheet';
import { useBooking } from './BookingContext';
import { CLINIC } from '@/lib/content';

const TABS = [
  { href: '/', label: 'Domů', Icon: HomeIcon },
  { href: '/sluzby-a-ceny', label: 'Služby', Icon: ServicesIcon },
] as const;

const TABS_RIGHT = [
  { href: '/o-zakladateli', label: 'Lékař', Icon: PersonIcon },
  { href: '/kontakty', label: 'Kontakty', Icon: MapPinIcon },
] as const;

export default function MobileTabBar() {
  const pathname = usePathname() ?? '/';
  const { openBooking } = useBooking();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <nav className="tab-bar" aria-label="Hlavní navigace">
        {TABS.map((tab) => (
          <TabLink key={tab.href} {...tab} active={pathname === tab.href} />
        ))}

        <button className="tab-bar-center" onClick={() => setSheetOpen(true)} aria-label="Objednat se">
          <span className="tab-bar-center-button">
            <CalendarPlusIcon />
          </span>
          <span className="tab-bar-center-label">Objednat</span>
        </button>

        {TABS_RIGHT.map((tab) => (
          <TabLink key={tab.href} {...tab} active={pathname === tab.href} />
        ))}
      </nav>

      <ActionSheet
        open={sheetOpen}
        title="Jak vám můžeme pomoct?"
        onClose={() => setSheetOpen(false)}
        options={[
          { label: 'Objednat se online', tone: 'accent', onClick: () => openBooking() },
          { label: 'Mám akutní bolest', tone: 'destructive', onClick: () => openBooking({ acute: true }) },
          // On a phone the fastest path is often just calling — desktop has the
          // number in the header, mobile had no way to reach it without
          // scrolling to the footer.
          { label: `Zavolat ${CLINIC.phone}`, onClick: () => { window.location.href = `tel:${CLINIC.phoneHref}`; } },
        ]}
      />
    </>
  );
}

function TabLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: (props: { filled?: boolean }) => JSX.Element;
  active: boolean;
}) {
  return (
    <Link href={href} className={`tab-item ${active ? 'active' : ''}`}>
      <Icon filled={active} />
      <span>{label}</span>
    </Link>
  );
}
