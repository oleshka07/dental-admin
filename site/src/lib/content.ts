export const CLINIC = {
  name: 'Galactic Dent',
  legalName: 'GalaClinic, s.r.o.',
  ico: '23647124',
  address: 'Dr. Přemysla Jeřábka 1093/13, Rybáře, 360 05 Karlovy Vary',
  hours: [
    { day: 'Pondělí – Čtvrtek', time: '8:00 – 17:00' },
    { day: 'Pátek', time: '8:00 – 14:00' },
  ],
  phone: '+420 XXX XXX XXX',
  email: 'info@galacticdent.cz',
};

export const FOUNDER = {
  name: 'MDDr. Dmytro Galaktionov',
  title: 'Zakladatel a hlavní stomatolog',
  bio: `Dlouhodobě působil v ordinaci Léčebně preventivní zařízení s.r.o. v Sokolově, kde si
  vybudoval rozsáhlou a velmi loajální pacientskou základnu. Je členem České stomatologické
  komory (ČSK) a pravidelně se vzdělává v oblasti gnatologie, estetické stomatologie
  a implantologie pod vedením předních evropských lektorů.`,
  highlights: [
    'Zcela bezbolestné ošetření a extrakce i u komplikovaných případů',
    'Individuální, lidský přístup — čas na vysvětlení a klid pro pacienta',
    'Rychlá protetika — zhotovení náhrady i do 24 hodin díky vlastní laboratoři',
  ],
};

export const TEAM = [
  {
    name: 'MDDr. Dmytro Galaktionov',
    role: 'Zakladatel, hlavní stomatolog',
  },
  {
    name: 'Anděla',
    role: 'Zubní asistentka',
    note: 'Pacienti ji dlouhodobě chválí za péči, trpělivost a profesionalitu u křesla.',
  },
];

export interface ServiceItem {
  slug: string;
  name: string;
  description: string;
  insuranceKids: string;
  insuranceAdults: string;
}

export const SERVICES: ServiceItem[] = [
  {
    slug: 'prevence',
    name: 'Preventivní prohlídka',
    description: 'Pravidelná kontrola chrupu, prevence kazu a onemocnění dásní.',
    insuranceKids: 'Plně hrazeno, 2× ročně',
    insuranceAdults: 'Plně hrazeno, 1× za 6 měsíců',
  },
  {
    slug: 'plomby',
    name: 'Fotokompozitní výplně',
    description: 'Moderní bílé výplně v estetické i funkční kvalitě.',
    insuranceKids: 'Plně hrazeno',
    insuranceAdults: 'Hrazena základní jednovrstvá výplň, doplatek za estetickou rekonstrukci',
  },
  {
    slug: 'endodoncie',
    name: 'Endodoncie (kořenové kanálky)',
    description: 'Ošetření zubní dřeně, záchrana zubu i u komplikovanějších případů.',
    insuranceKids: 'Plně hrazeny všechny metody',
    insuranceAdults: 'Hrazena centrální výplň kanálku (mimo moláry), mikroskop u molárů samoplátcem',
  },
  {
    slug: 'protetika',
    name: 'Protetika a implantologie',
    description: 'Korunky, můstky, exprese protetika do 24 hodin díky vlastní laboratoři, implantáty.',
    insuranceKids: '—',
    insuranceAdults: 'Základní plastová korunka 1× za 4 roky, nadstandard a implantáty samoplátcem',
  },
  {
    slug: 'akutni-bolest',
    name: 'Akutní bolest',
    description: 'Přednostní ošetření při silné bolesti, otoku nebo úrazu zubu.',
    insuranceKids: 'Dle rozsahu výkonu',
    insuranceAdults: 'Dle rozsahu výkonu',
  },
];

export const SOKOLOV_BRIDGE = {
  heading: 'Pro pacienty ze Sokolova',
  text: `Pokud jste byli dosud pacienty MDDr. Galaktionova v ordinaci Léčebně preventivní
  zařízení s.r.o. v Sokolově, pokračujeme ve stejné péči v nové klinice Galactic Dent
  v Karlových Varech — jen pár minut jízdy od Sokolova. Vaše dosavadní vztah s lékařem
  i jeho přístup k léčbě zůstávají stejné.`,
};

export const PAGE_CONTEXT = {
  home: 'home',
  about: 'about',
  services: 'services',
  founder: 'founder',
  contact: 'contact',
} as const;
