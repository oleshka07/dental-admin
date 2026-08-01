import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileTabBar from '@/components/MobileTabBar';
import Providers from '@/components/Providers';
import { CLINIC } from '@/lib/content';

export const metadata: Metadata = {
  title: `${CLINIC.name} — zubní ordinace Karlovy Vary`,
  description: `Moderní zubní klinika ${CLINIC.name} v Karlových Varech. MDDr. Dmytro Galaktionov a tým — bezbolestné ošetření, rychlá protetika, online objednání.`,
};

// viewportFit: 'cover' lets safe-area-inset-* resolve on notched iPhones so
// the fixed bottom tab bar and sheets clear the home indicator correctly.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
          <MobileTabBar />
        </Providers>
      </body>
    </html>
  );
}
