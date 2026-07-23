import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { createAppointment, SlotUnavailableError } from '../services/booking';
import { toDateOnly } from '../utils/time';

const createSchema = z.object({
  patientId: z.string(),
  visitTypeId: z.string(),
  date: z.string(),
  timeStart: z.string().regex(/^\d{2}:\d{2}$/),
  timeEnd: z.string().regex(/^\d{2}:\d{2}$/),
  sourceChannel: z.enum(['TELEGRAM', 'WEB', 'WHATSAPP', 'PHONE', 'ADMIN']),
  isAcute: z.boolean().optional(),
  triageAnswers: z.record(z.any()).optional(),
});

const statusSchema = z.object({
  status: z.enum(['PENDING_CONFIRMATION', 'CONFIRMED', 'NEEDS_CALL', 'CANCELLED', 'NO_SHOW', 'DONE']),
});

const urgentSchema = z.object({
  patientId: z.string(),
  visitTypeId: z.string(),
  sourceChannel: z.enum(['TELEGRAM', 'WEB', 'WHATSAPP', 'PHONE', 'ADMIN']),
  triageAnswers: z.record(z.any()).optional(),
});

export default async function appointmentsRoutes(app: FastifyInstance) {
  app.get('/api/appointments', async (req) => {
    const { from, to, status, visitTypeId, patientId } = req.query as {
      from?: string;
      to?: string;
      status?: string;
      visitTypeId?: string;
      patientId?: string;
    };
    return prisma.appointment.findMany({
      where: {
        ...(from && to ? { date: { gte: toDateOnly(new Date(from)), lte: toDateOnly(new Date(to)) } } : {}),
        ...(status ? { status: status as any } : {}),
        ...(visitTypeId ? { visitTypeId } : {}),
        ...(patientId ? { patientId } : {}),
      },
      include: { patient: true, visitType: true },
      orderBy: [{ date: 'asc' }, { timeStart: 'asc' }],
    });
  });

  app.post('/api/appointments', async (req, reply) => {
    const body = createSchema.parse(req.body);
    try {
      const appointment = await createAppointment({
        ...body,
        date: new Date(body.date),
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

  // No matching slot for an acute case, or the triage flow couldn't resolve it:
  // records a call-back request for the assistant instead of a real time slot.
  app.post('/api/appointments/urgent', async (req, reply) => {
    const body = urgentSchema.parse(req.body);
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const created = await prisma.appointment.create({
      data: {
        patientId: body.patientId,
        visitTypeId: body.visitTypeId,
        date: toDateOnly(now),
        timeStart: `${hh}:${mm}`,
        timeEnd: `${hh}:${mm}`,
        status: 'NEEDS_CALL',
        isAcute: true,
        sourceChannel: body.sourceChannel,
        triageAnswers: body.triageAnswers,
      },
      include: { patient: true, visitType: true },
    });
    reply.code(201);
    return created;
  });

  app.patch('/api/appointments/:id/status', async (req) => {
    const { id } = req.params as { id: string };
    const { status } = statusSchema.parse(req.body);
    return prisma.appointment.update({
      where: { id },
      data: {
        status,
        confirmedAt: status === 'CONFIRMED' ? new Date() : undefined,
      },
    });
  });
}
