import { FastifyInstance } from 'fastify';

/**
 * Mints a short-lived credential so the browser can open a voice call with the
 * ElevenLabs agent.
 *
 * The API key stays here and is never sent to the client — that is the whole
 * reason this endpoint exists. ElevenLabs issues a per-conversation token which
 * expires on its own, so a leaked token is worth one call, not the account.
 *
 * Requires two environment variables:
 *   ELEVENLABS_API_KEY   account key, from the ElevenLabs profile page
 *   ELEVENLABS_AGENT_ID  the agent created in the ElevenLabs dashboard
 */

const TOKEN_ENDPOINT = 'https://api.elevenlabs.io/v1/convai/conversation/token';

/**
 * A call button on a public website is a metered expense: ElevenLabs bills per
 * minute, and nothing stops someone from clicking it in a loop. This is a crude
 * per-IP throttle — not a security control, just a cap on how fast a single
 * visitor can start billable conversations.
 */
const MAX_CALLS_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;
const recentCalls = new Map<string, number[]>();

function tooManyCalls(ip: string): boolean {
  const now = Date.now();
  const previous = (recentCalls.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (previous.length >= MAX_CALLS_PER_WINDOW) {
    recentCalls.set(ip, previous);
    return true;
  }
  previous.push(now);
  recentCalls.set(ip, previous);

  // The map would otherwise grow for the lifetime of the process.
  if (recentCalls.size > 5000) {
    for (const [key, times] of recentCalls) {
      if (times.every((t) => now - t >= WINDOW_MS)) recentCalls.delete(key);
    }
  }
  return false;
}

export default async function voiceRoutes(app: FastifyInstance) {
  app.get('/api/voice/session', async (req, reply) => {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    const agentId = process.env.ELEVENLABS_AGENT_ID?.trim();

    if (!apiKey || !agentId) {
      // 503 rather than 500: the service is fine, it just has not been given
      // credentials yet. The client uses this to hide the call button.
      reply.code(503);
      return { error: 'VOICE_NOT_CONFIGURED' };
    }

    if (tooManyCalls(req.ip)) {
      reply.code(429);
      return { error: 'TOO_MANY_CALLS' };
    }

    try {
      const res = await fetch(`${TOKEN_ENDPOINT}?agent_id=${encodeURIComponent(agentId)}`, {
        headers: { 'xi-api-key': apiKey },
      });

      if (!res.ok) {
        // Never forward ElevenLabs' body — it can echo account details. Log the
        // status here, hand the client something it can act on.
        req.log.error({ status: res.status }, 'ElevenLabs refused to issue a conversation token');
        reply.code(502);
        return { error: 'VOICE_UPSTREAM_FAILED' };
      }

      const data = (await res.json()) as { token?: string };
      if (!data.token) {
        req.log.error('ElevenLabs returned no token');
        reply.code(502);
        return { error: 'VOICE_UPSTREAM_FAILED' };
      }

      return { conversationToken: data.token };
    } catch (err) {
      req.log.error({ err }, 'Could not reach ElevenLabs');
      reply.code(502);
      return { error: 'VOICE_UPSTREAM_FAILED' };
    }
  });
}
