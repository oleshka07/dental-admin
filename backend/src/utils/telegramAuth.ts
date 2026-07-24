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

type Field = [key: string, value: string];

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // Malformed percent-sequence — keep the raw text rather than throwing, so
    // a bad field can still fail the HMAC check instead of crashing the route.
    return value;
  }
}

/** Splits a query string into raw (still-encoded) key/value pairs. */
function splitPairs(query: string): Field[] {
  return query
    .split('&')
    .filter(Boolean)
    .map((pair) => {
      const eq = pair.indexOf('=');
      return eq === -1 ? ([pair, ''] as Field) : ([pair.slice(0, eq), pair.slice(eq + 1)] as Field);
    });
}

/** Telegram sorts by key; use codepoint order, not locale-dependent collation. */
function buildDataCheckString(fields: Field[]): string {
  return [...fields]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

function hashesMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

/**
 * Runs after a verification failure to find out *why*. It re-checks the same
 * payload against every plausible construction of the data-check-string and
 * reports the name of whichever one Telegram actually used.
 *
 * This runs on the server rather than in CI on purpose: the repository is
 * public, so CI logs are public, and the raw initData contains the user's
 * Telegram profile plus a signature that stays replayable for 24h. Here it
 * never leaves the box, and only the winning strategy's name is logged.
 */
function diagnoseMismatch(initData: string, botToken: string, expectedHash: string): string {
  const pairs = splitPairs(initData);
  const withoutHash = pairs.filter(([key]) => key !== 'hash');
  const withoutHashOrSignature = withoutHash.filter(([key]) => key !== 'signature');

  const decoders: Record<string, (value: string) => string> = {
    rfc3986: (value) => safeDecode(value),
    form: (value) => safeDecode(value.replace(/\+/g, ' ')),
    raw: (value) => value,
  };

  const fieldSets: Record<string, Field[]> = {
    'signature-excluded': withoutHashOrSignature,
    'signature-included': withoutHash,
  };

  const tokens: Record<string, string> = {
    trimmed: botToken.trim(),
    untrimmed: botToken,
  };

  const sorters: Record<string, (a: string, b: string) => number> = {
    codepoint: (a, b) => (a < b ? -1 : a > b ? 1 : 0),
    locale: (a, b) => a.localeCompare(b),
  };

  for (const [tokenName, token] of Object.entries(tokens)) {
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    // Telegram's documented scheme uses HMAC(key="WebAppData"); the older Login
    // Widget scheme uses SHA256(token) directly. Check both.
    const loginWidgetKey = crypto.createHash('sha256').update(token).digest();

    for (const [keyName, key] of Object.entries({ webapp: secretKey, 'login-widget': loginWidgetKey })) {
      for (const [setName, fields] of Object.entries(fieldSets)) {
        for (const [decoderName, decode] of Object.entries(decoders)) {
          for (const [sorterName, sorter] of Object.entries(sorters)) {
            const dcs = fields
              .map(([k, v]) => [safeDecode(k), decode(v)] as Field)
              .sort(([a], [b]) => sorter(a, b))
              .map(([k, v]) => `${k}=${v}`)
              .join('\n');
            const computed = crypto.createHmac('sha256', key).update(dcs).digest('hex');
            if (computed.toLowerCase() === expectedHash.toLowerCase()) {
              return `token=${tokenName} secret=${keyName} fields=${setName} decode=${decoderName} sort=${sorterName}`;
            }
          }
        }
      }
    }
  }

  return 'NONE — no construction reproduced the signature (token likely belongs to a different bot)';
}

/**
 * Verifies a Telegram Mini App `initData` string per Telegram's documented
 * algorithm (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
 * Returns the verified user only if the HMAC signature matches AND the
 * payload isn't stale — never trust a client-supplied telegram id without this.
 */
export function verifyInitData(initData: string, botToken: string): VerifiedInitData | null {
  if (!initData || !botToken) return null;

  // The token arrives via an .env file written from a CI secret. A stray
  // trailing space or newline in that secret silently changes the HMAC key and
  // makes every real signature fail, so normalise it before use.
  const token = botToken.trim();
  if (!token) return null;

  const pairs = splitPairs(initData);

  const rawHash = pairs.find(([key]) => key === 'hash')?.[1];
  if (!rawHash) return null;
  const hash = safeDecode(rawHash);
  if (!/^[0-9a-f]{64}$/i.test(hash)) return null;

  // `hash` is the signature itself; `signature` is Telegram's separate Ed25519
  // field for third-party verification. Neither belongs in the check string.
  const signed = pairs.filter(([key]) => key !== 'hash' && key !== 'signature');

  // A query string has two legitimate decodings that differ only in how '+' is
  // treated: RFC 3986 percent-decoding keeps it literal, while
  // application/x-www-form-urlencoded turns it into a space. Telegram signs the
  // literal value, and its base64 `query_id` can genuinely contain '+', so
  // decoding it the form-urlencoded way (what URLSearchParams does) corrupts
  // the value and breaks the HMAC. Try both and accept whichever reproduces
  // Telegram's signature — the HMAC is still what proves authenticity.
  const candidates: Field[][] = [
    signed.map(([key, value]) => [safeDecode(key), safeDecode(value)] as Field),
    signed.map(([key, value]) => [safeDecode(key), safeDecode(value.replace(/\+/g, ' '))] as Field),
  ];

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();

  for (const fields of candidates) {
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(buildDataCheckString(fields))
      .digest('hex');

    if (!hashesMatch(computedHash, hash)) continue;

    // Only read the payload out of the candidate that actually verified, so the
    // data we trust is exactly the data the signature covers.
    const byKey = new Map(fields);

    const authDate = Number(byKey.get('auth_date'));
    if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) return null;

    const userJson = byKey.get('user');
    if (!userJson) return null;
    try {
      const user = JSON.parse(userJson) as TelegramUser;
      if (!user.id) return null;
      return { user, authDate };
    } catch {
      return null;
    }
  }

  // Neither decoding reproduced Telegram's signature. Record just enough to
  // tell the known failure modes apart on a real device — no token, no hash,
  // no user data, so this is safe to leave enabled in production.
  console.error('[verifyInitData] signature mismatch', {
    fieldKeys: signed.map(([key]) => key),
    containedLiteralPlus: signed.some(([, value]) => value.includes('+')),
    botTokenHadSurroundingWhitespace: botToken !== botToken.trim(),
    botTokenLength: token.length,
    matchingStrategy: diagnoseMismatch(initData, botToken, hash),
  });

  return null;
}
