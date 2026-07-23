import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

const findOrCreateSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  telegramId: z.string().optional(),
  language: z.enum(['CZ', 'UA', 'EN']).default('CZ'),
});

export default async function patientsRoutes(app: FastifyInstance) {
  app.get('/api/patients', async (req) => {
    const { phone, telegramId, search } = req.query as {
      phone?: string;
      telegramId?: string;
      search?: string;
    };
    if (phone) return prisma.patient.findUnique({ where: { phone } });
    if (telegramId) return prisma.patient.findUnique({ where: { telegramId } });
    if (search) {
      return prisma.patient.findMany({
        where: {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        },
        take: 20,
      });
    }
    return prisma.patient.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
  });

  app.get('/api/patients/:id', async (req) => {
    const { id } = req.params as { id: string };
    return prisma.patient.findUnique({
      where: { id },
      include: { appointments: { orderBy: { date: 'desc' } } },
    });
  });

  // Used by the Telegram bot / web widget on first contact: create the patient
  // record if it doesn't exist yet, otherwise return the existing one.
  app.post('/api/patients/find-or-create', async (req) => {
    const body = findOrCreateSchema.parse(req.body);
    const existing = await prisma.patient.findUnique({ where: { phone: body.phone } });
    if (existing) {
      if (body.telegramId && existing.telegramId !== body.telegramId) {
        return prisma.patient.update({ where: { id: existing.id }, data: { telegramId: body.telegramId } });
      }
      return existing;
    }
    return prisma.patient.create({ data: body });
  });

  app.patch('/api/patients/:id/consent', async (req) => {
    const { id } = req.params as { id: string };
    const body = z
      .object({ dataProcessing: z.boolean().optional(), healthData: z.boolean().optional() })
      .parse(req.body);
    const now = new Date();
    return prisma.patient.update({
      where: { id },
      data: {
        ...(body.dataProcessing !== undefined
          ? { consentDataProcessing: body.dataProcessing, consentDataAt: now }
          : {}),
        ...(body.healthData !== undefined
          ? { consentHealthData: body.healthData, consentHealthDataAt: now }
          : {}),
      },
    });
  });
}
