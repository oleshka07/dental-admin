import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getAvailability } from '../services/availability';

const querySchema = z.object({
  from: z.string(),
  to: z.string(),
  visitTypeId: z.string().optional(),
});

export default async function availabilityRoutes(app: FastifyInstance) {
  app.get('/api/availability', async (req) => {
    const { from, to, visitTypeId } = querySchema.parse(req.query);
    return getAvailability({ from: new Date(from), to: new Date(to), visitTypeId });
  });
}
