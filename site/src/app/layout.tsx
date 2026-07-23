import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Galactic Dent — zubní ordinace Karlovy Vary',
  description:
    'Moderní zubní klinika Galactic Dent v Karlových Varech. MDDr. Dmytro Galaktionov a tým — bezbolestné ošetření, rychlá protetika, online objednání.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
