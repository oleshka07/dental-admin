import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

// Single source of truth for facts the assistant is allowed to state. Keeping
// this here (not invented by the LLM) is what makes the "never hallucinate
// clinic facts" guardrail actually enforceable.
const CLINIC_FACTS = {
  name: 'Galactic Dent',
  address: 'Dr. Přemysla Jeřábka 1093/13, Rybáře, 360 05 Karlovy Vary',
  ico: '23647124',
  hours: 'Po–Čt 8:00–17:00, Pá 8:00–14:00',
  phone: '+420 XXX XXX XXX',
  insurance: 'VZP, OZP, ZP MV ČR a další — dle aktuálních smluv kliniky',
  founder: 'MDDr. Dmytro Galaktionov, člen České stomatologické komory (ČSK)',
};

const PAGE_HINTS: Record<string, string> = {
  home: 'Pacient je na úvodní stránce — pravděpodobně hledá obecné informace nebo se chce objednat.',
  services: 'Pacient je na stránce Služby a ceník — ptá se pravděpodobně na konkrétní zákrok, cenu nebo pojištění.',
  about: 'Pacient je na stránce O nás / tým — zajímá ho pravděpodobně lékař, jeho kvalifikace nebo přístup.',
  founder: 'Pacient je na stránce o zakladateli MDDr. Galaktionovovi — zajímá ho jeho zkušenost a filozofie péče.',
  contact: 'Pacient je na stránce Kontakty — hledá adresu, hodiny nebo chce vědět, jak se objednat ze Sokolova.',
};

const bodySchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1).max(2000),
  page: z.enum(['home', 'services', 'about', 'founder', 'contact']).default('home'),
  language: z.enum(['CZ', 'UA', 'EN']).default('CZ'),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .max(12)
    .optional(),
});

interface AssistantResult {
  reply: string;
  action?: 'open_booking' | 'open_acute_booking';
}

function buildSystemPrompt(page: string, language: string): string {
  const langName = { CZ: 'čeština', UA: 'українська', EN: 'English' }[language] ?? 'čeština';
  return `Jsi asistent webu zubní kliniky ${CLINIC_FACTS.name} v Karlových Varech.
Fakta, která smíš používat (nic jiného si nevymýšlej):
- Adresa: ${CLINIC_FACTS.address}
- IČO: ${CLINIC_FACTS.ico}
- Ordinační hodiny: ${CLINIC_FACTS.hours}
- Telefon: ${CLINIC_FACTS.phone}
- Pojišťovny: ${CLINIC_FACTS.insurance}
- Zakladatel: ${CLINIC_FACTS.founder}

${PAGE_HINTS[page] ?? ''}

Pravidla (nesmí být porušena):
1. Nikdy nestanovuj diagnózu ani nedávej lékařská doporučení k léčbě. Pokud se pacient ptá na bolest nebo příznaky, projev empatii a nasměruj ho k objednání (u akutní bolesti k naléhavému objednání), ale symptomy nehodnoť medicínsky.
2. Pokud pacient chce se objednat, přeobjednat nebo zeptat na volný termín, jasně to řekni a doporuč tlačítko rezervace.
3. Pokud pacient popisuje akutní/silnou bolest, otok nebo úraz, doporuč urgentní objednání nebo přímý telefonát klinice.
4. Odpovídej stručně (2-4 věty), vždy v jazyce: ${langName}.
5. Neznáš-li odpověď na základě uvedených faktů, řekni to a nasměruj na telefonní kontakt kliniky.`;
}

async function callLLM(
  message: string,
  page: string,
  language: string,
  history: { role: 'user' | 'assistant'; content: string }[],
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5',
        max_tokens: 400,
        system: buildSystemPrompt(page, language),
        messages: [...history, { role: 'user', content: message }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === 'text')?.text;
    return text ?? null;
  } catch {
    return null;
  }
}

const ACUTE_KEYWORDS = ['bolí', 'bolest', 'akutní', 'otok', 'oteklý', 'úraz', 'zub vypadl', 'silná bolest', 'болить', 'гострий', 'набряк'];
const BOOKING_KEYWORDS = ['objednat', 'termín', 'rezervac', 'návštěv', 'zapsat', 'записат', 'termin'];

function detectAction(message: string): AssistantResult['action'] {
  const text = message.toLowerCase();
  if (ACUTE_KEYWORDS.some((k) => text.includes(k))) return 'open_acute_booking';
  if (BOOKING_KEYWORDS.some((k) => text.includes(k))) return 'open_booking';
  return undefined;
}

function ruleBasedFallback(message: string, page: string, language: string): AssistantResult {
  const text = message.toLowerCase();
  const action = detectAction(message);

  const replies: Record<string, string> = {
    CZ_acute:
      'Je nám líto, že vás bolí zub. Doporučuji objednat se přes tlačítko "Akutní bolest" níže — najdeme nejbližší volný termín, nebo vás bude kontaktovat naše asistentka. Při silné bolesti nebo otoku volejte prosím přímo do ordinace.',
    CZ_booking: `Rádi vás objednáme. Klikněte na tlačítko "Objednat se" a vyberte typ návštěvy a volný termín. Ordinujeme ${CLINIC_FACTS.hours}.`,
    CZ_address: `Naše ordinace se nachází na adrese ${CLINIC_FACTS.address}. Ordinační hodiny: ${CLINIC_FACTS.hours}.`,
    CZ_insurance: `Spolupracujeme s pojišťovnami: ${CLINIC_FACTS.insurance}. Konkrétní pokrytí výkonu vám rádi upřesníme na místě nebo telefonicky.`,
    CZ_default:
      'Děkuji za dotaz. Pro přesnou odpověď doporučuji objednání na konzultaci, nebo nám zavolejte. Mohu vám rovnou pomoct s objednáním?',
    UA_acute:
      'Шкода, що болить зуб. Рекомендую записатись через кнопку "Гострий біль" нижче — знайдемо найближчий вільний час, або з вами зв\'яжеться асистентка. При сильному болю чи набряку зателефонуйте напряму в клініку.',
    UA_booking: `Радо запишемо вас на прийом. Натисніть "Записатися" і оберіть тип візиту та вільний час. Працюємо: ${CLINIC_FACTS.hours}.`,
    UA_address: `Наша клініка знаходиться за адресою ${CLINIC_FACTS.address}. Години роботи: ${CLINIC_FACTS.hours}.`,
    UA_insurance: `Ми співпрацюємо зі страховими: ${CLINIC_FACTS.insurance}. Точне покриття уточнимо на місці або телефоном.`,
    UA_default: 'Дякую за запитання. Для точної відповіді радимо записатись на консультацію, або зателефонуйте нам. Допомогти із записом?',
  };

  const lang = language === 'UA' ? 'UA' : 'CZ';
  let key = `${lang}_default`;
  if (action === 'open_acute_booking') key = `${lang}_acute`;
  else if (action === 'open_booking') key = `${lang}_booking`;
  else if (text.includes('adres') || text.includes('kde') || text.includes('адрес') || text.includes('де')) key = `${lang}_address`;
  else if (text.includes('pojišť') || text.includes('vzp') || text.includes('страхов')) key = `${lang}_insurance`;

  return { reply: replies[key], action };
}

export default async function assistantRoutes(app: FastifyInstance) {
  app.post('/api/assistant/message', async (req) => {
    const body = bodySchema.parse(req.body);

    const llmReply = await callLLM(body.message, body.page, body.language, body.history ?? []);
    const result: AssistantResult = llmReply
      ? { reply: llmReply, action: detectAction(body.message) }
      : ruleBasedFallback(body.message, body.page, body.language);

    await prisma.conversationLog.create({
      data: {
        channel: 'WEB',
        rawMessages: { sessionId: body.sessionId, page: body.page, message: body.message, reply: result.reply },
        resolvedAction: result.action ?? 'ANSWERED',
      },
    });

    return result;
  });
}
