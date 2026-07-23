import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

const createSchema = z.object({
  name: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  colorTag: z.string().min(1),
  isAcute: z.boolean().optional(),
  requiresInsurance: z
    .enum(['VZP', 'OZP', 'CPZP', 'RBP', 'VOZP', 'ZPS', 'ZPMV', 'NONE'])
    .optional(),
});

export default async function visitTypesRoutes(app: FastifyInstance) {
  app.get('/api/visit-types', async () => {
    return prisma.visitType.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  });

  app.post('/api/visit-types', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const created = await prisma.visitType.create({ data: body });
    reply.code(201);
    return created;
  });

  app.patch('/api/visit-types/:id', async (req) => {
    const { id } = req.params as { id: string };
    const body = createSchema.partial().parse(req.body);
    return prisma.visitType.update({ where: { id }, data: body });
  });

  app.delete('/api/visit-types/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await prisma.visitType.update({ where: { id }, data: { active: false } });
    reply.code(204);
  });
}
