import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { verifyInitData } from '../utils/telegramAuth';
import { createAppointment, SlotUnavailableError } from '../services/booking';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

class UnauthorizedError extends Error {}

function requireUser(initData: string) {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured on the backend — Mini App auth cannot work without it.');
  }
  const verified = verifyInitData(initData, BOT_TOKEN);
  if (!verified) throw new UnauthorizedError();
  return verified.user;
}

async function findPatientByTelegramId(telegramId: string) {
  return prisma.patient.findUnique({ where: { telegramId } });
}

const initDataSchema = z.object({ initData: z.string().min(1) });

const registerSchema = initDataSchema.extend({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  language: z.enum(['CZ', 'UA', 'EN']).default('CZ'),
});

const appointmentSchema = initDataSchema.extend({
  visitTypeId: z.string(),
  date: z.string(),
  timeStart: z.string().regex(/^\d{2}:\d{2}$/),
  timeEnd: z.string().regex(/^\d{2}:\d{2}$/),
  isAcute: z.boolean().optional(),
  triageAnswers: z.record(z.any()).optional(),
});

const urgentSchema = initDataSchema.extend({
  visitTypeId: z.string(),
  triageAnswers: z.record(z.any()).optional(),
});

export default async function telegramAppRoutes(app: FastifyInstance) {
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof UnauthorizedError) {
      reply.code(401).send({ error: 'INVALID_TELEGRAM_SESSION' });
      return;
    }
    reply.send(err);
  });

  // Called on every Mini App open: tells the client whether this Telegram
  // user already has a patient record, or needs to go through /register first.
  app.post('/api/telegram-app/session', async (req) => {
    const { initData } = initDataSchema.parse(req.body);
    const user = requireUser(initData);
    const patient = await findPatientByTelegramId(String(user.id));
    return {
      user: { id: user.id, firstName: user.first_name, lastName: user.last_name ?? null },
      patient,
    };
  });

  app.post('/api/telegram-app/register', async (req) => {
    const body = registerSchema.parse(req.body);
    const user = requireUser(body.initData);
    const telegramId = String(user.id);
    const existing = await findPatientByTelegramId(telegramId);
    const patient =
      existing ??
      (await prisma.patient.create({
        data: { fullName: body.fullName, phone: body.phone, telegramId, language: body.language },
      }));
    await prisma.patient.update({
      where: { id: patient.id },
      data: { consentDataProcessing: true, consentDataAt: new Date() },
    });
    return patient;
  });

  app.get('/api/telegram-app/my-appointments', async (req) => {
    const { initData } = z.object({ initData: z.string().min(1) }).parse(req.query);
    const user = requireUser(initData);
    const patient = await findPatientByTelegramId(String(user.id));
    if (!patient) return [];
    return prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: { visitType: true },
      orderBy: [{ date: 'desc' }, { timeStart: 'desc' }],
    });
  });

  app.post('/api/telegram-app/appointments', async (req, reply) => {
    const body = appointmentSchema.parse(req.body);
    const user = requireUser(body.initData);
    const patient = await findPatientByTelegramId(String(user.id));
    if (!patient) {
      reply.code(400);
      return { error: 'PATIENT_NOT_REGISTERED' };
    }
    try {
      const appointment = await createAppointment({
        patientId: patient.id,
        visitTypeId: body.visitTypeId,
        date: new Date(body.date),
        timeStart: body.timeStart,
        timeEnd: body.timeEnd,
        sourceChannel: 'TELEGRAM',
        isAcute: body.isAcute,
        triageAnswers: body.triageAnswers,
      });
      reply.code(201);
      return appointment;
    } catch (err) {
      if (err instanceof SlotUnavailableError) {
        reply.code(409);
        return { error: 'SLOT_UNAVAILABLE' };
      }
      throw err;
    }
  });

  app.post('/api/telegram-app/urgent', async (req, reply) => {
    const body = urgentSchema.parse(req.body);
    const user = requireUser(body.initData);
    const patient = await findPatientByTelegramId(String(user.id));
    if (!patient) {
      reply.code(400);
      return { error: 'PATIENT_NOT_REGISTERED' };
    }
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        visitTypeId: body.visitTypeId,
        date: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
        timeStart: `${hh}:${mm}`,
        timeEnd: `${hh}:${mm}`,
        status: 'NEEDS_CALL',
        isAcute: true,
        sourceChannel: 'TELEGRAM',
        triageAnswers: body.triageAnswers,
      },
    });
    reply.code(201);
    return appointment;
  });

  // Ownership is enforced server-side against the verified telegram id — a
  // patient can only ever cancel their own appointment, never one guessed by id.
  app.patch('/api/telegram-app/appointments/:id/cancel', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { initData } = initDataSchema.parse(req.body);
    const user = requireUser(initData);
    const appointment = await prisma.appointment.findUnique({ where: { id }, include: { patient: true } });
    if (!appointment || appointment.patient.telegramId !== String(user.id)) {
      reply.code(403);
      return { error: 'NOT_YOUR_APPOINTMENT' };
    }
    return prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
  });
}
