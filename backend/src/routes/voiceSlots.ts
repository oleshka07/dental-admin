import { FastifyInstance } from 'fastify';
import { getAvailability } from '../services/availability';
import { prisma } from '../db';
import { toDateOnly } from '../utils/time';

/**
 * Free slots, shaped for a voice agent rather than for a UI.
 *
 * `/api/availability` is the right endpoint for the calendar and the booking
 * widget, but a speaking agent cannot use it:
 *   - it returns every slot in the range (56 over a fortnight), which is
 *     unreadable aloud and pointless to put in a model's context;
 *   - it takes a cuid for the visit type, so the agent would first have to
 *     fetch the list and then copy a 25-character opaque string correctly;
 *   - it has no notion of "today", and models are unreliable about the current
 *     date, so the caller cannot compute the range itself.
 *
 * This endpoint takes a plain word ("prohlídka", "akutní"), defaults the range,
 * returns a handful of offers already phrased in Czech, and includes today's
 * date so the agent can say "tomorrow" without guessing.
 */

/**
 * Spoken date parts per language.
 *
 * The agent switches language mid-call, and a Ukrainian-speaking patient must
 * hear "понеділок 3 серпня", not "pondělí 3. srpna". Asking the model to
 * translate these on the fly is the single worst place to rely on it: a
 * mistranslated weekday or month is a patient who arrives on the wrong day.
 * Return the phrase already in the right language and there is nothing to get
 * wrong.
 */
type SpokenLang = 'cs' | 'uk' | 'ru';

const DATE_WORDS: Record<SpokenLang, { days: string[]; months: string[]; at: string; dayOrdinalDot: boolean }> = {
  cs: {
    days: ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'],
    months: ['ledna', 'února', 'března', 'dubna', 'května', 'června',
             'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'],
    at: 'v',
    dayOrdinalDot: true,
  },
  uk: {
    days: ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота'],
    months: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
             'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
    at: 'о',
    dayOrdinalDot: false,
  },
  ru: {
    days: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
    months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
             'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    at: 'в',
    dayOrdinalDot: false,
  },
};

function parseLang(raw: string | undefined): SpokenLang {
  const value = (raw ?? '').trim().toLowerCase();
  if (value.startsWith('uk') || value === 'ua') return 'uk';
  if (value.startsWith('ru')) return 'ru';
  return 'cs';
}

/** Lowercase and strip diacritics, so "Akutní" matches "akutni". */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** "pondělí 3. srpna v 9:20" / "понеділок 3 серпня о 9:20". */
function describe(date: Date, timeStart: string, lang: SpokenLang): string {
  const w = DATE_WORDS[lang];
  const day = w.days[date.getUTCDay()];
  const dayNumber = `${date.getUTCDate()}${w.dayOrdinalDot ? '.' : ''}`;
  const spokenTime = timeStart.replace(/^0/, '');
  return `${day} ${dayNumber} ${w.months[date.getUTCMonth()]} ${w.at} ${spokenTime}`;
}

const MAX_OFFERS = 6;
const DEFAULT_DAYS = 14;
const MAX_DAYS = 60;

export default async function voiceSlotsRoutes(app: FastifyInstance) {
  app.get('/api/voice/slots', async (req) => {
    const query = req.query as { sluzba?: string; dny?: string; akutni?: string; jazyk?: string };
    const lang = parseLang(query.jazyk);
    const wanted = query.sluzba?.trim();
    const acuteOnly = query.akutni === 'true' || query.akutni === '1';

    const parsedDays = Number(query.dny);
    const days = Number.isFinite(parsedDays)
      ? Math.min(Math.max(Math.trunc(parsedDays), 1), MAX_DAYS)
      : DEFAULT_DAYS;

    const visitTypes = await prisma.visitType.findMany({ where: { active: true } });
    if (visitTypes.length === 0) {
      return { dnes: toDateOnly(new Date()).toISOString().slice(0, 10), jazyk: lang, volneTerminy: [], celkemVolnych: 0 };
    }

    // Match on a word the caller would actually say, not on an id.
    let chosen = acuteOnly ? visitTypes.find((v) => v.isAcute) : undefined;
    if (!chosen && wanted) {
      const needle = normalise(wanted);
      chosen =
        visitTypes.find((v) => normalise(v.name).includes(needle)) ??
        visitTypes.find((v) => needle.split(/\s+/).some((word) => word.length > 3 && normalise(v.name).includes(word)));
    }
    if (!chosen && !acuteOnly) chosen = visitTypes.find((v) => !v.isAcute) ?? visitTypes[0];
    if (!chosen) chosen = visitTypes[0];

    const from = toDateOnly(new Date());
    const to = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);

    const slots = await getAvailability({ from, to, visitTypeId: chosen.id });
    const bookable = slots.filter((s) => s.remainingCapacity > 0);

    /**
     * Acute callers want the soonest thing available, so offer them in order.
     * Everyone else is choosing, and the six earliest slots are all the same
     * Monday morning — useless as a choice. Take one per day instead, so the
     * agent can offer a spread across the week.
     */
    let offered = bookable;
    if (!acuteOnly) {
      const seenDays = new Set<string>();
      offered = bookable.filter((s) => {
        if (seenDays.has(s.date)) return false;
        seenDays.add(s.date);
        return true;
      });
    }

    return {
      dnes: from.toISOString().slice(0, 10),
      jazyk: lang,
      typNavstevy: { id: chosen.id, nazev: chosen.name },
      celkemVolnych: bookable.length,
      volneTerminy: offered.slice(0, MAX_OFFERS).map((s) => ({
        // Phrased for speech…
        popis: describe(new Date(`${s.date}T00:00:00Z`), s.timeStart, lang),
        // …and the exact fields the booking call needs, so the agent can pass
        // them straight through without reformatting anything.
        visitTypeId: chosen!.id,
        date: s.date,
        timeStart: s.timeStart,
        timeEnd: s.timeEnd,
      })),
    };
  });
}
