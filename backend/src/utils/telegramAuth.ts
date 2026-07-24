import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface VerifiedInitData {
  user: TelegramUser;
  authDate: number;
}

// Bounds how long a captured initData string can be replayed against the API.
const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

/**
 * Verifies a Telegram Mini App `initData` string per Telegram's documented
 * algorithm (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
 * Returns the verified user only if the HMAC signature matches AND the
 * payload isn't stale — never trust a client-supplied telegram id without this.
 */
export function verifyInitData(initData: string, botToken: string): VerifiedInitData | null {
  // TEMPORARY diagnostic logging — pinpointing why real Telegram-issued
  // initData is being rejected in production. Logs no secrets (not the bot
  // token, not the full hash) — only which check failed and non-sensitive
  // context. Remove once the real cause is confirmed.
  const log = (reason: string, extra?: Record<string, unknown>) =>
    console.error(`[verifyInitData] rejected: ${reason}`, extra ?? {});

  if (!initData || !botToken) {
    log(!initData ? 'empty initData' : 'missing botToken');
    return null;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) {
    log('missing/malformed hash', { hasHash: Boolean(hash), hashLength: hash?.length ?? 0 });
    return null;
  }
  params.delete('hash');
  // Newer clients also send `signature` (Ed25519, third-party verification) —
  // it's never part of the HMAC data-check-string, same as `hash` itself.
  params.delete('signature');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const isValid = crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
  if (!isValid) {
    log('hash mismatch', {
      receivedHashPrefix: hash.slice(0, 8),
      computedHashPrefix: computedHash.slice(0, 8),
      dataCheckStringKeys: Array.from(params.keys()),
      dataCheckStringLength: dataCheckString.length,
    });
    return null;
  }

  const authDate = Number(params.get('auth_date'));
  const ageSeconds = Date.now() / 1000 - authDate;
  if (!authDate || ageSeconds > MAX_AUTH_AGE_SECONDS) {
    log('stale or missing auth_date', { authDate, ageSeconds });
    return null;
  }

  const userJson = params.get('user');
  if (!userJson) {
    log('missing user field');
    return null;
  }
  try {
    const user = JSON.parse(userJson) as TelegramUser;
    if (!user.id) {
      log('user JSON missing id');
      return null;
    }
    return { user, authDate };
  } catch {
    log('user JSON parse failure');
    return null;
  }
}
