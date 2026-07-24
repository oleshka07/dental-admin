export const CLINIC = {
  name: 'Galactic Dent',
  legalName: 'GalaClinic, s.r.o.',
  ico: '23647124',
  address: 'Dr. Přemysla Jeřábka 1093/13, Rybáře, 360 05 Karlovy Vary',
  addressShort: 'Dr. Přemysla Jeřábka 1093/13, Karlovy Vary',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dr.+P%C5%99emysla+Je%C5%99%C3%A1bka+1093%2F13%2C+360+05+Karlovy+Vary',
  hours: [
    { day: 'Pondělí – Čtvrtek', time: '8:00 – 17:00' },
    { day: 'Pátek', time: '8:00 – 14:00' },
    { day: 'Sobota, neděle', time: 'Zavřeno' },
  ],
  // Displayed with spaces, dialled without them.
  phone: '+420 352 308 111',
  phoneHref: '+420352308111',
  email: 'info@galacticdent.cz',
  languages: 'Mluvíme česky, ukrajinsky a rusky.',
};

export const FOUNDER = {
  name: 'MDDr. Dmytro Galaktionov',
  title: 'Zakladatel a hlavní stomatolog',
  short:
    'Roky pracoval v ordinaci Léčebně preventivní zařízení s.r.o. v Sokolově. Velká část pacientů, které tam ošetřoval, za ním jezdí dodnes.',
  bio: [
    `Většinu své dosavadní praxe strávil MDDr. Galaktionov v Sokolově, v ordinaci Léčebně
    preventivní zařízení s.r.o. Za tu dobu se kolem něj vytvořila pacientská základna, která
    ho následuje i po přestěhování do Karlových Varů. To o práci lékaře řekne víc než výčet
    kurzů.`,
    `Je členem České stomatologické komory. Pravidelně se školí v gnatologii, estetické
    stomatologii a implantologii u předních evropských lektorů — ne proto, aby měl certifikáty
    na zdi, ale protože materiály i postupy se v oboru mění každých pár let.`,
  ],
  highlights: [
    {
      title: 'Ošetření bez bolesti',
      text: 'Včetně extrakcí a komplikovaných případů. Anestezii dávkujeme podle výkonu, ne podle rutiny.',
    },
    {
      title: 'Čas na vysvětlení',
      text: 'Dozvíte se, co se s vaším zubem děje a jaké máte možnosti, ještě než sáhneme po nástrojích.',
    },
    {
      title: 'Protetika do 24 hodin',
      text: 'Díky vlastní laboratoři nemusíte na korunku čekat týdny a chodit mezitím s provizoriem.',
    },
  ],
};

export const TEAM = [
  {
    initials: 'DG',
    name: 'MDDr. Dmytro Galaktionov',
    role: 'Zakladatel, hlavní stomatolog',
    note: 'Praktická stomatologie, endodoncie, protetika a implantologie. Člen České stomatologické komory.',
  },
  {
    initials: 'A',
    name: 'Anděla',
    role: 'Zubní asistentka',
    note: 'S doktorem pracuje řadu let. Pacienti ji nejčastěji zmiňují ve spojení s trpělivostí — hlavně ti, kdo chodí k zubaři neradi.',
  },
];

export interface ServiceItem {
  slug: string;
  name: string;
  description: string;
  /** What the appointment actually involves — shown on the services page. */
  detail: string;
  insuranceKids: string;
  insuranceAdults: string;
  /**
   * Orientational price floor in Kč for the part the patient pays.
   * `null` means we have not published a number for this procedure yet and the
   * page shows "Na vyžádání" instead — never invent a figure here, it is what a
   * patient will hold us to.
   */
  priceFrom: number | null;
  priceNote?: string;
}

export const SERVICES: ServiceItem[] = [
  {
    slug: 'prevence',
    name: 'Preventivní prohlídka',
    description: 'Kontrola chrupu a dásní dvakrát ročně. Nejlevnější zákrok je ten, který nemusíme dělat.',
    detail:
      'Projdeme chrup, dásně a skus, zkontrolujeme staré výplně a podle potřeby doplníme rentgen. Na konci víte, co je v pořádku a co má smysl řešit teď, aby to za rok nebylo dražší.',
    insuranceKids: 'Plně hrazeno, 2× ročně',
    insuranceAdults: 'Plně hrazeno, 1× za 6 měsíců',
    priceFrom: null,
    priceNote: 'Hrazeno pojišťovnou',
  },
  {
    slug: 'plomby',
    name: 'Fotokompozitní výplně',
    description: 'Bílé výplně, které drží a nejsou na zubu vidět.',
    detail:
      'Odstraníme kaz a zub dostavíme kompozitem ve vrstvách. Odstín ladíme k okolním zubům. Pojišťovna hradí základní jednovrstvou výplň, u větší estetické rekonstrukce se připlácí rozdíl.',
    insuranceKids: 'Plně hrazeno',
    insuranceAdults: 'Hrazena základní jednovrstvá výplň, doplatek za estetickou rekonstrukci',
    priceFrom: null,
    priceNote: 'Doplatek podle rozsahu',
  },
  {
    slug: 'endodoncie',
    name: 'Endodoncie (kořenové kanálky)',
    description: 'Záchrana zubu, který by se jinak musel trhat.',
    detail:
      'Ošetření zanícené zubní dřeně. Kanálky vyčistíme, změříme a zaplníme. U molárů pracujeme pod mikroskopem, protože kanálky bývají zakřivené a bez zvětšení se snadno přehlédnou.',
    insuranceKids: 'Plně hrazeny všechny metody',
    insuranceAdults: 'Hrazena centrální výplň kanálku (mimo moláry), mikroskop u molárů samoplátcem',
    priceFrom: null,
    priceNote: 'Podle počtu kanálků',
  },
  {
    slug: 'protetika',
    name: 'Protetika a implantologie',
    description: 'Korunky, můstky a implantáty. Náhrada obvykle do 24 hodin.',
    detail:
      'Vlastní laboratoř je hned u ordinace, takže zhotovení korunky nebo můstku počítáme na hodiny, ne na týdny. U implantátů nejdřív vyhodnotíme kost a skus a teprve pak navrhneme řešení.',
    insuranceKids: '—',
    insuranceAdults: 'Základní plastová korunka 1× za 4 roky, nadstandard a implantáty samoplátcem',
    priceFrom: null,
    priceNote: 'Podle typu náhrady',
  },
  {
    slug: 'akutni-bolest',
    name: 'Akutní bolest',
    description: 'Silná bolest, otok nebo úraz zubu. Řešíme přednostně.',
    detail:
      'Na akutní stavy držíme kapacitu mimo běžný objednací kalendář. Cílem první návštěvy je zbavit vás bolesti; na zbytek se domluvíme, až budete schopni se soustředit na něco jiného.',
    insuranceKids: 'Dle rozsahu výkonu',
    insuranceAdults: 'Dle rozsahu výkonu',
    priceFrom: null,
    priceNote: 'Dle rozsahu ošetření',
  },
];

/**
 * Wording follows what Czech dental practices conventionally publish: the list
 * is explicitly orientational and the binding number comes from the examination.
 */
export const PRICING = {
  heading: 'Orientační ceník',
  intro:
    'Ceny se řídí Cenovým výměrem MZ ČR a časovou náročností výkonu. U každého ošetření hrazeného pojišťovnou vám předem řekneme, co je hrazené a kolik doplatíte.',
  disclaimer:
    'Uvedené ceny jsou orientační. Závaznou cenu vám sdělíme po vyšetření, kdy je zřejmý rozsah ošetření a použitý materiál — vždy dřív, než začneme.',
  fallback: 'Na vyžádání',
  howWeCalculate: {
    heading: 'Z čeho se cena skládá',
    points: [
      'Čas lékaře a asistentky strávený na výkonu. U delších zákroků je to hlavní položka.',
      'Materiál. Standardní materiály jsou v ceně výkonu hrazeného pojišťovnou, nadstandardní (estetické kompozity, celokeramika) se účtují zvlášť.',
      'Laboratorní práce u protetiky. Máme vlastní laboratoř, takže neplatíte marži externí firmy.',
    ],
  },
};

export const FIRST_VISIT = {
  heading: 'Jak probíhá první návštěva',
  steps: [
    {
      title: 'Objednání',
      text: 'Online přes tenhle web nebo přes Telegram, kdykoli. Telefonicky v ordinačních hodinách.',
    },
    {
      title: 'Vstupní vyšetření',
      text: 'Projdeme chrup, dásně a skus. Pokud je potřeba, doplníme rentgen.',
    },
    {
      title: 'Plán a cena',
      text: 'Řekneme si, co je nutné teď, co může počkat a kolik to bude stát. Souhlas s cenou padne dřív než první zákrok.',
    },
    {
      title: 'Ošetření',
      text: 'Podle domluveného plánu. Termíny skládáme tak, aby jich bylo co nejmíň.',
    },
  ],
};

export const FAQ = [
  {
    q: 'Berete nové pacienty?',
    a: 'Ano. Registrace probíhá při první návštěvě, stačí kartička pojišťovny a doklad totožnosti.',
  },
  {
    q: 'Bolí to?',
    a: 'Bezbolestné ošetření je věc, na které si tahle ordinace postavila jméno — včetně extrakcí. Pokud máte z ošetření strach, řekněte to hned na začátku, dá se s tím pracovat.',
  },
  {
    q: 'Co když mě rozbolí zub mimo ordinační hodiny?',
    a: 'Napište přes online objednání nebo Telegram, ať máme váš požadavek na stole hned ráno. Na akutní stavy držíme volnou kapacitu každý den.',
  },
  {
    q: 'Se kterými pojišťovnami máte smlouvu?',
    a: 'Spolupracujeme s VZP, OZP, ZP MV ČR a dalšími pojišťovnami. Pokud si nejste jistí tou svou, zeptejte se před objednáním.',
  },
  {
    q: 'Jak daleko je to ze Sokolova?',
    a: 'Zhruba 20 minut autem po silnici 6. Vlakem i autobusem jde spojení několikrát za hodinu.',
  },
  {
    q: 'Domluvíme se ukrajinsky?',
    a: 'Ano. V ordinaci mluvíme česky, ukrajinsky a rusky.',
  },
];

export const SOKOLOV_BRIDGE = {
  heading: 'Pro pacienty ze Sokolova',
  text: `Pokud jste chodili k MDDr. Galaktionovovi do ordinace Léčebně preventivní zařízení
  s.r.o. v Sokolově, nic zásadního se pro vás nemění. Stejný lékař, stejná asistentka, stejný
  způsob práce — jen v nové ordinaci v Karlových Varech, zhruba dvacet minut jízdy.`,
  cta: 'Objednat se online',
};

export const PAGE_CONTEXT = {
  home: 'home',
  about: 'about',
  services: 'services',
  founder: 'founder',
  contact: 'contact',
} as const;
