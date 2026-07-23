import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { api, AvailableSlot, VisitType } from './api';
import { Lang, t } from './i18n';

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not set (see telegram-bot/.env.example)');
}
const STAFF_CHAT_ID = process.env.STAFF_CHAT_ID;
const WEBAPP_URL = process.env.WEBAPP_URL;

const bot = new Telegraf(BOT_TOKEN);

type Step =
  | 'awaiting_language'
  | 'awaiting_name'
  | 'awaiting_phone'
  | 'awaiting_consent'
  | 'main_menu'
  | 'acute_asking_question';

interface Session {
  step: Step;
  lang: Lang;
  fullName?: string;
  phone?: string;
  patientId?: string;
  pendingVisitTypeId?: string;
  pendingIsAcute?: boolean;
  pendingSlots?: AvailableSlot[];
  acuteVisitTypeId?: string;
}

const sessions = new Map<number, Session>();

function getSession(userId: number): Session {
  let s = sessions.get(userId);
  if (!s) {
    s = { step: 'awaiting_language', lang: 'CZ' };
    sessions.set(userId, s);
  }
  return s;
}

function formatSlotLabel(slot: AvailableSlot, lang: Lang): string {
  const date = new Date(`${slot.date}T00:00:00`);
  const locale = lang === 'UA' ? 'uk-UA' : 'cs-CZ';
  const dateLabel = date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'numeric' });
  return `${dateLabel} ${slot.timeStart}`;
}

function mainMenuKeyboard(lang: Lang) {
  const appButtonLabel = lang === 'UA' ? '📱 Відкрити застосунок' : '📱 Otevřít aplikaci';
  return Markup.inlineKeyboard([
    // The Mini App reproduces this whole flow with a richer, native UI
    // (no retyping name/phone every time, native date picker feel, etc.) —
    // offer it first, but keep the classic inline flow working below for
    // Telegram clients that don't support Mini Apps.
    ...(WEBAPP_URL ? [[Markup.button.webApp(appButtonLabel, WEBAPP_URL)]] : []),
    [Markup.button.callback(t('menuBook', lang), 'menu:book')],
    [Markup.button.callback(t('menuAcute', lang), 'menu:acute')],
    [Markup.button.callback(t('menuMy', lang), 'menu:my')],
  ]);
}

async function sendMainMenu(ctx: any, session: Session) {
  session.step = 'main_menu';
  await ctx.reply(t('mainMenu', session.lang), mainMenuKeyboard(session.lang));
}

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const session: Session = { step: 'awaiting_language', lang: 'CZ' };
  sessions.set(userId, session);

  const existing = await api.getPatientByTelegramId(String(userId)).catch(() => null);
  if (existing) {
    session.patientId = existing.id;
    session.lang = existing.language === 'UA' ? 'UA' : 'CZ';
    await sendMainMenu(ctx, session);
    return;
  }

  await ctx.reply(
    t('chooseLanguage', 'CZ'),
    Markup.inlineKeyboard([
      [Markup.button.callback('🇨🇿 Čeština', 'lang:CZ'), Markup.button.callback('🇺🇦 Українська', 'lang:UA')],
    ]),
  );
});

bot.action(/^lang:(CZ|UA)$/, async (ctx) => {
  const session = getSession(ctx.from.id);
  session.lang = ctx.match[1] as Lang;
  session.step = 'awaiting_name';
  await ctx.answerCbQuery();
  await ctx.reply(t('askName', session.lang));
});

bot.action(/^consent:(yes|no)$/, async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();
  if (ctx.match[1] === 'no') {
    await ctx.reply(t('needConsent', session.lang));
    return;
  }
  const patient = await api.findOrCreatePatient({
    fullName: session.fullName!,
    phone: session.phone!,
    telegramId: String(ctx.from.id),
    language: session.lang,
  });
  session.patientId = patient.id;
  await fetch(`${process.env.BACKEND_URL ?? 'http://localhost:3000'}/api/patients/${patient.id}/consent`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataProcessing: true }),
  });
  await sendMainMenu(ctx, session);
});

bot.action('menu:book', async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();
  const visitTypes = await api.listVisitTypes();
  const bookable = visitTypes.filter((v) => !v.isAcute);
  await ctx.reply(
    t('chooseVisitType', session.lang),
    Markup.inlineKeyboard(bookable.map((v) => [Markup.button.callback(v.name, `vt:${v.id}`)])),
  );
});

bot.action('menu:my', async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();
  if (!session.patientId) return;
  const appointments = await api.listMyAppointments(session.patientId);
  const upcoming = appointments.filter((a) => !['CANCELLED', 'DONE', 'NO_SHOW'].includes(a.status));
  if (upcoming.length === 0) {
    await ctx.reply(t('myAppointmentsEmpty', session.lang));
    return;
  }
  for (const a of upcoming) {
    const label = `${a.date.slice(0, 10)} ${a.timeStart} — ${a.visitType?.name ?? ''} [${a.status}]`;
    await ctx.reply(label, Markup.inlineKeyboard([[Markup.button.callback(t('cancelButton', session.lang), `cancel:${a.id}`)]]));
  }
});

bot.action(/^cancel:(.+)$/, async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();
  await api.updateAppointmentStatus(ctx.match[1], 'CANCELLED');
  await ctx.reply(t('cancelled', session.lang));
});

bot.action('menu:acute', async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();
  const visitTypes = await api.listVisitTypes();
  const acute = visitTypes.find((v) => v.isAcute);
  if (!acute) return;
  session.acuteVisitTypeId = acute.id;
  session.step = 'acute_asking_question';
  await ctx.reply(t('acuteAskPain', session.lang));
});

async function offerSlots(ctx: any, session: Session, visitTypeId: string, isAcute: boolean, horizonDays: number) {
  const from = new Date();
  const to = new Date(Date.now() + horizonDays * 24 * 60 * 60 * 1000);
  const slots = await api.getAvailability(visitTypeId, from.toISOString(), to.toISOString());
  if (slots.length === 0) {
    return false;
  }
  const offered = slots.slice(0, 6);
  session.pendingSlots = offered;
  session.pendingVisitTypeId = visitTypeId;
  session.pendingIsAcute = isAcute;
  await ctx.reply(
    t(isAcute ? 'acuteFoundSlot' : 'chooseSlot', session.lang),
    Markup.inlineKeyboard(
      offered.map((s, i) => [Markup.button.callback(formatSlotLabel(s, session.lang), `slot:${i}`)]),
    ),
  );
  return true;
}

bot.action(/^vt:(.+)$/, async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();
  const visitTypeId = ctx.match[1];
  const found = await offerSlots(ctx, session, visitTypeId, false, 21);
  if (!found) {
    await ctx.reply(t('noSlots', session.lang));
  }
});

bot.action(/^slot:(\d+)$/, async (ctx) => {
  const session = getSession(ctx.from.id);
  await ctx.answerCbQuery();
  const idx = Number(ctx.match[1]);
  const slot = session.pendingSlots?.[idx];
  if (!slot || !session.pendingVisitTypeId || !session.patientId) return;

  const result = await api.createAppointment({
    patientId: session.patientId,
    visitTypeId: session.pendingVisitTypeId,
    date: slot.date,
    timeStart: slot.timeStart,
    timeEnd: slot.timeEnd,
    sourceChannel: 'TELEGRAM',
    isAcute: session.pendingIsAcute,
  });

  if ('error' in result) {
    await ctx.reply(t('slotTaken', session.lang));
    await offerSlots(ctx, session, session.pendingVisitTypeId, session.pendingIsAcute ?? false, 21);
    return;
  }

  await api.updateAppointmentStatus(result.id, 'CONFIRMED');
  await ctx.reply(t('booked', session.lang));
  await sendMainMenu(ctx, session);
});

bot.on('text', async (ctx) => {
  const session = getSession(ctx.from.id);
  const text = ctx.message.text.trim();

  if (session.step === 'awaiting_name') {
    session.fullName = text;
    session.step = 'awaiting_phone';
    await ctx.reply(t('askPhone', session.lang));
    return;
  }

  if (session.step === 'awaiting_phone') {
    session.phone = text;
    session.step = 'awaiting_consent';
    await ctx.reply(
      t('consentPrompt', session.lang),
      Markup.inlineKeyboard([
        [Markup.button.callback(t('yes', session.lang), 'consent:yes'), Markup.button.callback(t('no', session.lang), 'consent:no')],
      ]),
    );
    return;
  }

  if (session.step === 'acute_asking_question' && session.acuteVisitTypeId && session.patientId) {
    const triageAnswers = { description: text };
    const found = await offerSlots(ctx, session, session.acuteVisitTypeId, true, 3);
    if (!found) {
      await api.createUrgentRequest({
        patientId: session.patientId,
        visitTypeId: session.acuteVisitTypeId,
        sourceChannel: 'TELEGRAM',
        triageAnswers,
      });
      await ctx.reply(t('acuteEscalated', session.lang));
      if (STAFF_CHAT_ID) {
        await bot.telegram.sendMessage(
          STAFF_CHAT_ID,
          `🔴 Akutní bolest / Гострий біль\nPacient: ${session.fullName} (${session.phone})\nPopis: ${text}`,
        );
      }
      await sendMainMenu(ctx, session);
    }
    return;
  }

  // Unrecognized free text outside a known step: nudge back to the menu
  // rather than silently doing nothing.
  await sendMainMenu(ctx, session);
});

bot.launch().then(async () => {
  console.log('Telegram bot started');
  if (WEBAPP_URL) {
    // Sets Telegram's persistent menu button (bottom-left of the chat input)
    // to open the Mini App directly, in addition to the inline button above.
    await bot.telegram.setChatMenuButton({
      menuButton: { type: 'web_app', text: 'Objednat se', web_app: { url: WEBAPP_URL } },
    });
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
