#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3003}"
API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8000}"
SITE_URL="${SITE_URL:-http://${HOST}:${PORT}}"
CLEAN_NEXT="${CLEAN_NEXT:-1}"

echo "Starting iOS Kit frontend..."
echo "Host: ${HOST}"
echo "Port: ${PORT}"
echo "API Base URL: ${API_BASE_URL}"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is not installed."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Error: frontend dependencies are missing."
  echo "Run: cd ${SCRIPT_DIR} && npm install"
  exit 1
fi

if [ ! -f ".env.local" ]; then
  cat > .env.local <<EOF
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_API_BASE_URL=${API_BASE_URL}
PUBLIC_SITE_URL=${SITE_URL}
EOF
  echo "Created frontend/.env.local. Fill in your Supabase values if needed."
fi

if [ "${CLEAN_NEXT}" = "1" ] && [ -d ".next" ]; then
  echo "Removing stale .next cache..."
  rm -rf .next
fi

echo ""
echo "Frontend URL: ${SITE_URL}"
echo "Health target: ${API_BASE_URL}"
echo ""

exec npm run dev -- --hostname "${HOST}" --port "${PORT}"
