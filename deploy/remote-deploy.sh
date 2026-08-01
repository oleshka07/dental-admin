#!/usr/bin/env bash
# Runs ON the server (as root), invoked over SSH by .github/workflows/deploy.yml
# after it has rsynced fresh build output + this deploy/ folder into
# /opt/galactic-dent/. Idempotent: safe to run on every push — first run
# bootstraps the box (packages, user dirs, DB, systemd units, nginx, TLS),
# every run after that just installs deps, migrates, and restarts services.
#
# Required environment variables (passed inline by the CI step):
#   DOMAIN               e.g. galactic.swipescape.eu
#   POSTGRES_PASSWORD    password for the local 'dental' Postgres role
#   TELEGRAM_BOT_TOKEN   same token used by both backend verification and the bot itself
#   LETSENCRYPT_EMAIL    contact email for the TLS certificate
# Optional:
#   ANTHROPIC_API_KEY, ANTHROPIC_MODEL, STAFF_CHAT_ID
#   ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID  (voice calls from the website)

set -euo pipefail

APP_ROOT=/opt/galactic-dent
: "${DOMAIN:?DOMAIN is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL is required}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"
ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-claude-sonnet-5}"
STAFF_CHAT_ID="${STAFF_CHAT_ID:-}"
ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY:-}"
ELEVENLABS_AGENT_ID="${ELEVENLABS_AGENT_ID:-}"

# The bot token is the HMAC key for Telegram Mini App signature checks, so a
# stray space/newline picked up when the CI secret was pasted would silently
# invalidate every real signature. Strip surrounding whitespace before it ever
# reaches the .env files.
TELEGRAM_BOT_TOKEN="$(printf '%s' "${TELEGRAM_BOT_TOKEN}" | tr -d '[:space:]')"

log() { echo "==> $*"; }

log "Installing system packages (skipped for anything already present)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq

if ! command -v node >/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

apt-get install -y -qq postgresql nginx certbot python3-certbot-nginx rsync

log "Ensuring PostgreSQL role and database exist..."
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='dental'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER dental WITH PASSWORD '${POSTGRES_PASSWORD}';"
sudo -u postgres psql -c "ALTER USER dental WITH PASSWORD '${POSTGRES_PASSWORD}';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='dental_admin'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE dental_admin OWNER dental;"

DATABASE_URL="postgresql://dental:${POSTGRES_PASSWORD}@localhost:5432/dental_admin?schema=public"

log "Writing environment files..."
cat > "${APP_ROOT}/backend/.env" <<EOF
DATABASE_URL="${DATABASE_URL}"
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://${DOMAIN}
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
ANTHROPIC_MODEL=${ANTHROPIC_MODEL}
ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
ELEVENLABS_AGENT_ID=${ELEVENLABS_AGENT_ID}
EOF

cat > "${APP_ROOT}/telegram-bot/.env" <<EOF
BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
BACKEND_URL=http://127.0.0.1:3000
STAFF_CHAT_ID=${STAFF_CHAT_ID}
WEBAPP_URL=https://${DOMAIN}/app/
EOF

chmod 600 "${APP_ROOT}/backend/.env" "${APP_ROOT}/telegram-bot/.env"

log "Installing backend dependencies + running migrations..."
cd "${APP_ROOT}/backend"
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy

log "Installing telegram-bot dependencies..."
cd "${APP_ROOT}/telegram-bot"
npm ci --omit=dev

log "Ensuring nginx (www-data) can traverse and read the static builds..."
chmod 755 /opt /opt/galactic-dent
for d in site/out admin-web/dist telegram-app/dist; do
  find "${APP_ROOT}/${d}" -type d -exec chmod 755 {} \;
  find "${APP_ROOT}/${d}" -type f -exec chmod 644 {} \;
done

log "Installing systemd units..."
cp "${APP_ROOT}/deploy/systemd/galactic-backend.service" /etc/systemd/system/
cp "${APP_ROOT}/deploy/systemd/galactic-telegram-bot.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable galactic-backend galactic-telegram-bot >/dev/null

log "Configuring nginx (first run only — see deploy/nginx/galactic-dent.conf header)..."
mkdir -p /var/www/certbot
if [ ! -f /etc/nginx/sites-available/galactic-dent.conf ]; then
  cp "${APP_ROOT}/deploy/nginx/galactic-dent.conf" /etc/nginx/sites-available/galactic-dent.conf
  ln -sf /etc/nginx/sites-available/galactic-dent.conf /etc/nginx/sites-enabled/galactic-dent.conf
  rm -f /etc/nginx/sites-enabled/default
fi
nginx -t
systemctl reload nginx

if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  log "No TLS certificate yet — requesting one from Let's Encrypt..."
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${LETSENCRYPT_EMAIL}" --redirect
fi

log "Restarting application services..."
systemctl restart galactic-backend
systemctl restart galactic-telegram-bot

log "Waiting for backend/bot to settle (systemd shows 'activating' during a restart loop, not just on first boot)..."
BACKEND_STATE=unknown
BOT_STATE=unknown
for i in $(seq 1 10); do
  BACKEND_STATE=$(systemctl is-active galactic-backend || true)
  BOT_STATE=$(systemctl is-active galactic-telegram-bot || true)
  [ "$BACKEND_STATE" = "active" ] && [ "$BOT_STATE" = "active" ] && break
  sleep 2
done
echo "backend=${BACKEND_STATE} bot=${BOT_STATE} nginx=$(systemctl is-active nginx || true)"

log "End-to-end check — backend directly, and site+API through nginx over HTTPS (matching what a real visitor hits)..."
# Retried on purpose: systemd marks a Type=simple service "active" as soon as
# the process spawns, not once Fastify has actually bound to the port — a
# single immediate curl can lose that race even though the service is fine.
BACKEND_CODE=000
SITE_CODE=000
API_CODE=000
for i in $(seq 1 8); do
  BACKEND_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/health || echo 000)
  SITE_CODE=$(curl -sk -o /dev/null -w '%{http_code}' --resolve "${DOMAIN}:443:127.0.0.1" "https://${DOMAIN}/" || echo 000)
  API_CODE=$(curl -sk -o /dev/null -w '%{http_code}' --resolve "${DOMAIN}:443:127.0.0.1" "https://${DOMAIN}/api/health" || echo 000)
  [ "$BACKEND_CODE" = "200" ] && [ "$SITE_CODE" = "200" ] && [ "$API_CODE" = "200" ] && break
  sleep 2
done
echo "backend -> ${BACKEND_CODE}, site -> ${SITE_CODE}, api -> ${API_CODE}"

if [ "$BACKEND_STATE" != "active" ] || [ "$BOT_STATE" != "active" ] || [ "$BACKEND_CODE" != "200" ] || [ "$SITE_CODE" != "200" ] || [ "$API_CODE" != "200" ]; then
  log "Something's wrong — dumping diagnostics:"
  echo "--- journalctl galactic-backend (last 60 lines) ---"
  journalctl -u galactic-backend -n 60 --no-pager || true
  echo "--- journalctl galactic-telegram-bot (last 60 lines) ---"
  journalctl -u galactic-telegram-bot -n 60 --no-pager || true
  echo "--- namei on site/out/index.html ---"
  namei -l "${APP_ROOT}/site/out/index.html" || true
  echo "--- last 20 lines of nginx error log ---"
  tail -n 20 /var/log/nginx/error.log || true
  exit 1
fi

log "Deploy finished — backend, bot, and nginx (site+api over HTTPS) are all healthy."
