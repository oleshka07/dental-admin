import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import visitTypesRoutes from './routes/visitTypes';
import slotTemplatesRoutes from './routes/slotTemplates';
import slotExceptionsRoutes from './routes/slotExceptions';
import availabilityRoutes from './routes/availability';
import appointmentsRoutes from './routes/appointments';
import patientsRoutes from './routes/patients';
import waitlistRoutes from './routes/waitlist';
import assistantRoutes from './routes/assistant';
import telegramAppRoutes from './routes/telegramApp';

async function main() {
  const app = Fastify({
    logger: {
      transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
    },
  });

  await app.register(cors, { origin: true });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(visitTypesRoutes);
  await app.register(slotTemplatesRoutes);
  await app.register(slotExceptionsRoutes);
  await app.register(availabilityRoutes);
  await app.register(appointmentsRoutes);
  await app.register(patientsRoutes);
  await app.register(waitlistRoutes);
  await app.register(assistantRoutes);
  await app.register(telegramAppRoutes);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ port, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
