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
 * Belt and braces before an upstream error body reaches a log. ElevenLabs does
 * not echo the key back, but a log line is forever and this costs nothing.
 */
function redactSecrets(text: string): string {
  return text.replace(/\b(sk_|xi-)[A-Za-z0-9_-]{8,}/g, '$1REDACTED');
}

/**
 * Boil the upstream refusal down to one word the browser can act on.
 *
 * Not for the patient — they get one apology either way. This is so that when
 * the clinic says "the call is broken again", the answer is in front of them in
 * the browser console instead of only in a server log they cannot reach. The
 * distinction that matters most is "we ran out of credit" versus "something is
 * misconfigured", because only one of those is fixed by paying.
 */
function classify(status: number, body: string): string {
  const text = body.toLowerCase();
  if (/quota|credit|exceed|insufficient|limit_reached/.test(text)) return 'QUOTA_EXHAUSTED';
  if (/missing_permission|unauthor|invalid_api_key|forbidden/.test(text)) return 'KEY_REJECTED';
  if (/not_found|does not exist/.test(text) || status === 404) return 'AGENT_NOT_FOUND';
  if (status === 429) return 'UPSTREAM_RATE_LIMITED';
  return `HTTP_${status}`;
}

/**
 * A call button on a public website is a metered expense: ElevenLabs bills per
 * minute, and nothing stops someone from clicking it in a loop. This is a crude
 * per-IP throttle — not a security control, just a cap on how fast a single
 * visitor can start billable conversations.
 *
 * The limit is per IP, and a clinic behind one office connection is a single
 * IP: at five calls the staff testing the button would lock out real patients,
 * and the website would show them the same "could not connect" as a genuine
 * outage. Hence twelve, and hence the client telling 429 apart from failure.
 */
const MAX_CALLS_PER_WINDOW = 12;
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
        // Log WHY, not just that it failed. Logging only the status made a real
        // 502 undiagnosable — "ElevenLabs said no" is not something anyone can
        // act on. The reason ("agent_not_found", "missing_permissions",
        // quota exhausted) is not a secret; the key is, and the key is never in
        // this body. Truncated so an unexpected payload cannot flood the log.
        const detail = await res.text().catch(() => '');
        req.log.error(
          { status: res.status, detail: redactSecrets(detail).slice(0, 300) },
          'ElevenLabs refused to issue a conversation token',
        );
        reply.code(502);
        return { error: 'VOICE_UPSTREAM_FAILED', reason: classify(res.status, detail) };
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
