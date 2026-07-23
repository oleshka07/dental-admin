#!/usr/bin/env node
// Generates a genuinely HMAC-signed Telegram Mini App initData string for
// local testing outside real Telegram. Run with the SAME TELEGRAM_BOT_TOKEN
// value configured in backend/.env, e.g.:
//
//   TELEGRAM_BOT_TOKEN=test-token node scripts/generate-test-init-data.mjs
//
// Then open the app with:
//   http://localhost:5174/?devInitData=<printed string, URL-encoded once more if pasted into a browser address bar>

import crypto from 'node:crypto';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error('Set TELEGRAM_BOT_TOKEN (must match backend/.env) before running this script.');
  process.exit(1);
}

const user = {
  id: Number(process.env.DEV_USER_ID ?? 999001),
  first_name: process.env.DEV_USER_FIRST_NAME ?? 'Jana',
  last_name: process.env.DEV_USER_LAST_NAME ?? 'Testovací',
  language_code: 'cs',
};

const params = {
  query_id: 'AAHdevtest',
  user: JSON.stringify(user),
  auth_date: String(Math.floor(Date.now() / 1000)),
};

const dataCheckString = Object.keys(params)
  .sort()
  .map((k) => `${k}=${params[k]}`)
  .join('\n');

const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

const initData = new URLSearchParams({ ...params, hash }).toString();
console.log(initData);
