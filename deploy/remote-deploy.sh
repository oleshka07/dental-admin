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

set -euo pipefail

APP_ROOT=/opt/galactic-dent
: "${DOMAIN:?DOMAIN is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL is required}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"
ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-claude-sonnet-5}"
STAFF_CHAT_ID="${STAFF_CHAT_ID:-}"

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

sleep 2
log "Status check:"
systemctl is-active galactic-backend galactic-telegram-bot nginx
curl -fsS http://127.0.0.1:3000/health && echo

log "End-to-end check through nginx itself (not just the backend directly)..."
SITE_CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: ${DOMAIN}" http://127.0.0.1/)
API_CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: ${DOMAIN}" http://127.0.0.1/api/health)
echo "site -> ${SITE_CODE}, api -> ${API_CODE}"

if [ "$SITE_CODE" != "200" ] || [ "$API_CODE" != "200" ]; then
  log "Something's wrong — dumping diagnostics:"
  echo "--- namei on site/out/index.html (permission trace) ---"
  namei -l "${APP_ROOT}/site/out/index.html" || true
  echo "--- active nginx config for this server_name ---"
  nginx -T 2>/dev/null | awk "/server_name ${DOMAIN}/,/^}/" | head -80
  echo "--- last 30 lines of nginx error log ---"
  tail -n 30 /var/log/nginx/error.log || true
  exit 1
fi

log "Deploy finished — site and API both responded 200 through nginx."
