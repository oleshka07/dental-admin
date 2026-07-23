import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

const createSchema = z.object({
  patientId: z.string(),
  visitTypeId: z.string(),
  desiredDateFrom: z.string(),
  desiredDateUntil: z.string(),
});

export default async function waitlistRoutes(app: FastifyInstance) {
  app.get('/api/waitlist', async (req) => {
    const { status } = req.query as { status?: string };
    return prisma.waitlistEntry.findMany({
      where: status ? { status: status as any } : { status: 'ACTIVE' },
      include: { patient: true, visitType: true },
      orderBy: { createdAt: 'asc' },
    });
  });

  app.post('/api/waitlist', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const created = await prisma.waitlistEntry.create({
      data: {
        ...body,
        desiredDateFrom: new Date(body.desiredDateFrom),
        desiredDateUntil: new Date(body.desiredDateUntil),
      },
    });
    reply.code(201);
    return created;
  });

  app.patch('/api/waitlist/:id/status', async (req) => {
    const { id } = req.params as { id: string };
    const { status } = z
      .object({ status: z.enum(['ACTIVE', 'OFFERED', 'BOOKED', 'EXPIRED']) })
      .parse(req.body);
    return prisma.waitlistEntry.update({ where: { id }, data: { status } });
  });
}
