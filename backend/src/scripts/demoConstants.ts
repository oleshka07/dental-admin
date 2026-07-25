/**
 * Shared definitions for the demo dataset.
 *
 * Everything the demo creates hangs off a Patient with `isDemo: true`, so that
 * one flag is the whole contract: purgeDemo deletes exactly the rows reachable
 * from those patients and nothing else. Never set it on a real record.
 */

/** Prefixed onto every demo patient's notes so it is obvious in the admin UI. */
export const DEMO_NOTE_PREFIX = '[DEMO]';

/**
 * +420 999 xxx xxx. The 9xx range is not allocated to Czech mobile operators,
 * so a demo number can never collide with — or accidentally dial — a real
 * person. The phone column is unique, which also makes reseeding detectable.
 */
export const DEMO_PHONE_PREFIX = '+420999';

/**
 * Telegram ids are numeric strings; verifyInitData always writes
 * String(user.id). A "demo-" prefix therefore cannot collide with a real
 * account, so a demo patient can never hijack someone's Mini App session.
 */
export const DEMO_TELEGRAM_PREFIX = 'demo-';

export interface DemoPerson {
  name: string;
  language: 'CZ' | 'UA' | 'EN';
}

/**
 * A believable mix for a Karlovy Vary practice that took over a Sokolov
 * patient base: mostly Czech names, a solid Ukrainian minority.
 */
export const DEMO_PEOPLE: DemoPerson[] = [
  { name: 'Jana Nováková', language: 'CZ' },
  { name: 'Petr Svoboda', language: 'CZ' },
  { name: 'Marie Dvořáková', language: 'CZ' },
  { name: 'Jan Černý', language: 'CZ' },
  { name: 'Eva Procházková', language: 'CZ' },
  { name: 'Tomáš Kučera', language: 'CZ' },
  { name: 'Lucie Veselá', language: 'CZ' },
  { name: 'Martin Horák', language: 'CZ' },
  { name: 'Kateřina Němcová', language: 'CZ' },
  { name: 'Josef Marek', language: 'CZ' },
  { name: 'Hana Pospíšilová', language: 'CZ' },
  { name: 'Pavel Kratochvíl', language: 'CZ' },
  { name: 'Zdeňka Šťastná', language: 'CZ' },
  { name: 'Miroslav Beneš', language: 'CZ' },
  { name: 'Tereza Fialová', language: 'CZ' },
  { name: 'Ondřej Sedláček', language: 'CZ' },
  { name: 'Barbora Růžičková', language: 'CZ' },
  { name: 'Filip Urban', language: 'CZ' },
  { name: 'Veronika Malá', language: 'CZ' },
  { name: 'Radek Kolář', language: 'CZ' },
  { name: 'Alena Vlčková', language: 'CZ' },
  { name: 'Michal Doležal', language: 'CZ' },
  { name: 'Simona Bártová', language: 'CZ' },
  { name: 'Vojtěch Král', language: 'CZ' },
  { name: 'Denisa Hájková', language: 'CZ' },
  { name: 'Oleksandr Kovalenko', language: 'UA' },
  { name: 'Olha Shevchenko', language: 'UA' },
  { name: 'Andrii Bondarenko', language: 'UA' },
  { name: 'Kateryna Tkachenko', language: 'UA' },
  { name: 'Serhii Melnyk', language: 'UA' },
  { name: 'Nataliia Kravchenko', language: 'UA' },
  { name: 'Dmytro Oliinyk', language: 'UA' },
  { name: 'Iryna Marchenko', language: 'UA' },
  { name: 'Volodymyr Lysenko', language: 'UA' },
  { name: 'Yuliia Savchenko', language: 'UA' },
  { name: 'Mykhailo Rudenko', language: 'UA' },
  { name: 'Sofiia Klymenko', language: 'UA' },
  { name: 'Anna Schmidt', language: 'EN' },
  { name: 'David Fischer', language: 'EN' },
  { name: 'Laura Weber', language: 'EN' },
];

export const DEMO_INSURERS = ['VZP', 'VZP', 'VZP', 'OZP', 'ZPMV', 'CPZP', 'RBP', 'VOZP', 'NONE'] as const;

/** Free-text notes a receptionist might actually leave. */
export const DEMO_NOTES = [
  'Bojí se vrtačky, potřebuje víc času na vysvětlení.',
  'Přechází ze Sokolova, karta vyžádána.',
  'Alergie na penicilin.',
  'Preferuje termíny brzy ráno.',
  'Chodí s dcerou, objednávat oba najednou.',
  'Zvýšená citlivost na studené.',
  'Loni dokončena endodoncie 36.',
  'Volat raději odpoledne.',
];

export const DEMO_TRIAGE = [
  { description: 'Silná bolest vlevo dole, hlavně v noci.' },
  { description: 'Ulomený roh předního zubu, bez bolesti.' },
  { description: 'Oteklá dáseň kolem stoličky, bolí při skusu.' },
  { description: 'Vypadla plomba, citlivé na sladké.' },
  { description: 'Bolest po zákroku, přetrvává třetí den.' },
];
