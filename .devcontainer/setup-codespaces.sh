#!/usr/bin/env bash
set -euo pipefail

cd /workspaces/poetry-app

echo "==> Verifying PostgreSQL client tools"
if ! command -v psql >/dev/null 2>&1 || ! command -v pg_isready >/dev/null 2>&1; then
  echo "PostgreSQL client tools missing; installing postgresql-client"
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends postgresql-client
fi

echo "==> Installing workspace dependencies with npm ci"
npm ci

API_ENV_FILE="apps/api/.env"
FRONTEND_ENV_FILE="apps/frontend/.env"

mkdir -p apps/api apps/frontend

if [ -n "${CODESPACE_NAME:-}" ] && [ -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]; then
  API_PUBLIC_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
  FRONTEND_PUBLIC_URL="https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
else
  API_PUBLIC_URL="http://localhost:3000"
  FRONTEND_PUBLIC_URL="http://localhost:5173"
fi

python3 - "$API_ENV_FILE" "$FRONTEND_ENV_FILE" "$API_PUBLIC_URL" "$FRONTEND_PUBLIC_URL" <<'PY'
from pathlib import Path
import os
import sys

api_path = Path(sys.argv[1])
frontend_path = Path(sys.argv[2])
api_url = sys.argv[3]
frontend_url = sys.argv[4]

def upsert(path: Path, key: str, value: str):
    lines = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
    replaced = False
    updated = []
    for line in lines:
        if line.startswith(f"{key}="):
            updated.append(f"{key}={value}")
            replaced = True
        else:
            updated.append(line)
    if not replaced:
        updated.append(f"{key}={value}")
    path.write_text("\n".join(updated) + "\n", encoding="utf-8")

if not api_path.exists():
    api_path.write_text("", encoding="utf-8")

if not frontend_path.exists():
    frontend_path.write_text("", encoding="utf-8")

api_lines = api_path.read_text(encoding="utf-8").splitlines() if api_path.exists() else []
api_keys = {line.split("=", 1)[0]: line for line in api_lines if "=" in line}

if "JWT_SECRET" not in api_keys:
    upsert(api_path, "JWT_SECRET", os.urandom(32).hex())

upsert(api_path, "DATABASE_URL", "postgresql://poetry:poetry_dev@postgres:5432/poetry_dev")
upsert(api_path, "TEST_DATABASE_URL", "postgresql://poetry:poetry_dev@postgres:5432/poetry_test")
upsert(api_path, "PORT", "3000")
upsert(api_path, "NODE_ENV", "development")
upsert(api_path, "CORS_ORIGIN", frontend_url)
if "WORDS_API_KEY" not in api_keys:
    upsert(api_path, "WORDS_API_KEY", "")

upsert(frontend_path, "VITE_API_URL", api_url)
PY

echo "==> Waiting for PostgreSQL readiness"
until pg_isready -h postgres -p 5432 -U poetry -d poetry_dev; do
  echo "PostgreSQL is not ready yet; retrying..."
  sleep 2
done

echo "==> Ensuring poetry_test exists idempotently"
psql "postgresql://poetry:poetry_dev@postgres:5432/postgres" -v ON_ERROR_STOP=1 -U poetry <<'SQL'
SELECT 'CREATE DATABASE poetry_test OWNER poetry'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'poetry_test'
)\gexec
SQL

echo "==> Applying Prisma migrations to development DB"
(
  cd apps/api
  DATABASE_URL="postgresql://poetry:poetry_dev@postgres:5432/poetry_dev" \
    npx prisma migrate deploy
)

echo "==> Applying Prisma migrations to test DB"
(
  cd apps/api
  TEST_DATABASE_URL="postgresql://poetry:poetry_dev@postgres:5432/poetry_test" \
    NODE_ENV=test \
    npx prisma migrate deploy
)

echo "==> Codespaces environment is ready"
echo "Next step: run 'npm run dev' from the repo root"
