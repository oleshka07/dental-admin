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

const DAY_NAMES = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
const MONTHS_GENITIVE = [
  'ledna', 'února', 'března', 'dubna', 'května', 'června',
  'července', 'srpna', 'září', 'října', 'listopadu', 'prosince',
];

/** Lowercase and strip diacritics, so "Akutní" matches "akutni". */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** "pondělí 3. srpna v 9:20" — what the agent should actually say. */
function describe(date: Date, timeStart: string): string {
  const day = DAY_NAMES[date.getUTCDay()];
  const spokenTime = timeStart.replace(/^0/, '');
  return `${day} ${date.getUTCDate()}. ${MONTHS_GENITIVE[date.getUTCMonth()]} v ${spokenTime}`;
}

const MAX_OFFERS = 6;
const DEFAULT_DAYS = 14;
const MAX_DAYS = 60;

export default async function voiceSlotsRoutes(app: FastifyInstance) {
  app.get('/api/voice/slots', async (req) => {
    const query = req.query as { sluzba?: string; dny?: string; akutni?: string };
    const wanted = query.sluzba?.trim();
    const acuteOnly = query.akutni === 'true' || query.akutni === '1';

    const parsedDays = Number(query.dny);
    const days = Number.isFinite(parsedDays)
      ? Math.min(Math.max(Math.trunc(parsedDays), 1), MAX_DAYS)
      : DEFAULT_DAYS;

    const visitTypes = await prisma.visitType.findMany({ where: { active: true } });
    if (visitTypes.length === 0) {
      return { dnes: toDateOnly(new Date()).toISOString().slice(0, 10), volneTerminy: [], celkemVolnych: 0 };
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
      typNavstevy: { id: chosen.id, nazev: chosen.name },
      celkemVolnych: bookable.length,
      volneTerminy: offered.slice(0, MAX_OFFERS).map((s) => ({
        // Phrased for speech…
        popis: describe(new Date(`${s.date}T00:00:00Z`), s.timeStart),
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
