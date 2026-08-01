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

  // In production every browser client (site/admin/Mini App) is served from
  // the same domain via nginx path routing, so same-origin requests aren't
  // even subject to CORS — this only needs to admit the handful of origins
  // that legitimately call the API cross-origin (local dev on other ports).
  const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? true;
  await app.register(cors, { origin: corsOrigin });

  // `assistant` reports whether ANTHROPIC_API_KEY reached the process. Without
  // it the chat still answers, but from the canned rule-based replies — which
  // looks identical from outside, so there would otherwise be no way to tell a
  // configured key from a missing one short of reading the replies.
  const health = async () => ({
    status: 'ok',
    assistant: process.env.ANTHROPIC_API_KEY ? 'llm' : 'rule-based-fallback',
  });

  app.get('/health', health);
  // nginx proxies /api/ verbatim to this backend, so the externally-visible
  // health check needs to exist at this exact path too, not just /health.
  app.get('/api/health', health);

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
