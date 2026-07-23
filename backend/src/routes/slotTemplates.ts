import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

const createSchema = z.object({
  weekday: z.number().int().min(1).max(7),
  timeStart: z.string().regex(/^\d{2}:\d{2}$/),
  timeEnd: z.string().regex(/^\d{2}:\d{2}$/),
  slotLengthMinutes: z.number().int().positive(),
  capacityPerSlot: z.number().int().positive().default(1),
  visitTypeIds: z.array(z.string()).min(1),
  activeFrom: z.string().datetime().optional(),
  activeUntil: z.string().datetime().optional(),
});

export default async function slotTemplatesRoutes(app: FastifyInstance) {
  app.get('/api/slot-templates', async () => {
    return prisma.slotTemplate.findMany({
      include: { visitTypes: { include: { visitType: true } } },
      orderBy: [{ weekday: 'asc' }, { timeStart: 'asc' }],
    });
  });

  app.post('/api/slot-templates', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const created = await prisma.slotTemplate.create({
      data: {
        weekday: body.weekday,
        timeStart: body.timeStart,
        timeEnd: body.timeEnd,
        slotLengthMinutes: body.slotLengthMinutes,
        capacityPerSlot: body.capacityPerSlot,
        activeFrom: body.activeFrom ? new Date(body.activeFrom) : undefined,
        activeUntil: body.activeUntil ? new Date(body.activeUntil) : undefined,
        visitTypes: { create: body.visitTypeIds.map((visitTypeId) => ({ visitTypeId })) },
      },
      include: { visitTypes: { include: { visitType: true } } },
    });
    reply.code(201);
    return created;
  });

  app.patch('/api/slot-templates/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = createSchema.partial().parse(req.body);
    const { visitTypeIds, activeFrom, activeUntil, ...rest } = body;

    if (visitTypeIds) {
      await prisma.slotTemplateVisitType.deleteMany({ where: { slotTemplateId: id } });
    }

    return prisma.slotTemplate.update({
      where: { id },
      data: {
        ...rest,
        activeFrom: activeFrom ? new Date(activeFrom) : undefined,
        activeUntil: activeUntil ? new Date(activeUntil) : undefined,
        visitTypes: visitTypeIds ? { create: visitTypeIds.map((visitTypeId) => ({ visitTypeId })) } : undefined,
      },
      include: { visitTypes: { include: { visitType: true } } },
    });
  });

  app.delete('/api/slot-templates/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.slotTemplate.delete({ where: { id } });
    reply.code(204);
  });
}
