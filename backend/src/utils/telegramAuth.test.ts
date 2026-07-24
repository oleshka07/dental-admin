/**
 * Regression tests for Telegram Mini App initData verification.
 *
 * These exist because of a real outage: `signature` was excluded from the
 * data-check-string on an assumption, which rejected every genuine Telegram
 * payload. The test suite at the time could not catch it, because its fixture
 * generator signed payloads the same wrong way the code verified them.
 *
 * So the rule for this file: build the check string the way TELEGRAM builds it
 * (everything except `hash`, sorted by key), never the way our code happens to.
 *
 * Run with: npm test
 */
import crypto from 'crypto';
import { verifyInitData } from './telegramAuth';

const BOT_TOKEN = '7000000000:AAFakeTokenForTestsOnlyNotARealBot';
const OTHER_TOKEN = '8000000000:AAADifferentBotEntirelyXXXXXXXXXXXXX';

const USER = { id: 4242, first_name: 'Jana', last_name: 'Nováková', language_code: 'cs' };

function signedHash(fields: Record<string, string>, token = BOT_TOKEN): string {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  return crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
}

/** Percent-encodes the way Telegram's clients do — '+' stays literal-encoded. */
function encodeQuery(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

function realisticFields(overrides: Partial<Record<string, string>> = {}) {
  return {
    // Real query_id values are base64 and routinely contain '+' and '/'.
    query_id: 'AAH+abc/def=',
    user: JSON.stringify(USER),
    auth_date: String(Math.floor(Date.now() / 1000)),
    signature: crypto.randomBytes(64).toString('base64url'),
    ...overrides,
  } as Record<string, string>;
}

let failures = 0;

function check(name: string, ok: boolean) {
  if (ok) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}`);
  }
}

// --- Accepts what Telegram actually sends -----------------------------------

{
  const fields = realisticFields();
  const initData = encodeQuery({ ...fields, hash: signedHash(fields) });
  const result = verifyInitData(initData, BOT_TOKEN);
  check('real Telegram shape: `signature` IS part of the check string', result?.user.id === USER.id);
}

{
  // Older clients send no `signature` field at all.
  const { signature, ...fields } = realisticFields();
  void signature;
  const initData = encodeQuery({ ...fields, hash: signedHash(fields) });
  check('payload without a signature field still verifies', verifyInitData(initData, BOT_TOKEN)?.user.id === USER.id);
}

{
  // A '+' left literal in the query string is the form-urlencoded encoding of a
  // space. Telegram signed the '+', so a naive URLSearchParams parse breaks it.
  const fields = realisticFields({ query_id: 'AAH+abc/def=' });
  const hash = signedHash(fields);
  const raw = `query_id=AAH+abc%2Fdef%3D&user=${encodeURIComponent(fields.user)}&auth_date=${fields.auth_date}&signature=${fields.signature}&hash=${hash}`;
  check("query_id with a literal '+' verifies", verifyInitData(raw, BOT_TOKEN)?.user.id === USER.id);
}

{
  const fields = realisticFields({ query_id: 'AAH abc def' });
  const initData = encodeQuery({ ...fields, hash: signedHash(fields) });
  check('value containing a real space verifies', verifyInitData(initData, BOT_TOKEN)?.user.id === USER.id);
}

{
  // The token reaches the process via an .env written from a CI secret; a
  // trailing newline there silently changes the HMAC key.
  const fields = realisticFields();
  const initData = encodeQuery({ ...fields, hash: signedHash(fields) });
  check('token with surrounding whitespace still verifies', verifyInitData(initData, `  ${BOT_TOKEN}\n`)?.user.id === USER.id);
}

// --- Rejects everything else ------------------------------------------------

{
  const fields = realisticFields();
  const initData = encodeQuery({ ...fields, hash: signedHash(fields, OTHER_TOKEN) });
  check('signature from a different bot is rejected', verifyInitData(initData, BOT_TOKEN) === null);
}

{
  const fields = realisticFields();
  const hash = signedHash(fields);
  const tampered = { ...fields, user: JSON.stringify({ ...USER, id: 999999 }) };
  check('tampered user id is rejected', verifyInitData(encodeQuery({ ...tampered, hash }), BOT_TOKEN) === null);
}

{
  // Guards the exact regression: if `signature` were dropped from the check
  // string, changing it would NOT invalidate the payload and this would pass
  // a forged value through.
  const fields = realisticFields();
  const hash = signedHash(fields);
  const tampered = { ...fields, signature: crypto.randomBytes(64).toString('base64url') };
  check('tampered signature field is rejected', verifyInitData(encodeQuery({ ...tampered, hash }), BOT_TOKEN) === null);
}

{
  const stale = String(Math.floor(Date.now() / 1000) - 25 * 60 * 60);
  const fields = realisticFields({ auth_date: stale });
  const initData = encodeQuery({ ...fields, hash: signedHash(fields) });
  check('auth_date older than 24h is rejected', verifyInitData(initData, BOT_TOKEN) === null);
}

{
  const fields = realisticFields();
  check('missing hash is rejected', verifyInitData(encodeQuery(fields), BOT_TOKEN) === null);
}

check('empty initData is rejected', verifyInitData('', BOT_TOKEN) === null);
check('empty bot token is rejected', verifyInitData('auth_date=1&hash=abc', '') === null);

if (failures > 0) {
  console.error(`\n${failures} test(s) failed.`);
  process.exit(1);
}
console.log('\nAll telegramAuth tests passed.');
