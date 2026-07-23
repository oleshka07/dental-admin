import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { toDateOnly } from '../utils/time';

const createSchema = z.object({
  date: z.string().datetime(),
  timeStart: z.string().regex(/^\d{2}:\d{2}$/),
  timeEnd: z.string().regex(/^\d{2}:\d{2}$/),
  type: z.enum(['CLOSED', 'OPEN_OVERRIDE']),
  reason: z.string().optional(),
  createdBy: z.string().optional(),
});

export default async function slotExceptionsRoutes(app: FastifyInstance) {
  app.get('/api/slot-exceptions', async (req) => {
    const { from, to } = req.query as { from?: string; to?: string };
    return prisma.slotException.findMany({
      where:
        from && to
          ? { date: { gte: toDateOnly(new Date(from)), lte: toDateOnly(new Date(to)) } }
          : undefined,
      orderBy: [{ date: 'asc' }, { timeStart: 'asc' }],
    });
  });

  // Closing a slot after a phone call, or opening an ad-hoc extra slot, is one action.
  app.post('/api/slot-exceptions', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const created = await prisma.slotException.create({
      data: { ...body, date: toDateOnly(new Date(body.date)) },
    });
    reply.code(201);
    return created;
  });

  app.delete('/api/slot-exceptions/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.slotException.delete({ where: { id } });
    reply.code(204);
  });
}
