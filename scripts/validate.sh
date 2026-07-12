#!/usr/bin/env bash
# Valida TODAS as migrations do zero: sobe um Postgres em Docker, aplica o stub
# do schema auth e as migrations em ordem. Não precisa de produção nem segredo —
# bom para rodar antes de todo PR de migration (e futuramente no CI).
#
# Uso: scripts/validate.sh
set -euo pipefail
cd "$(dirname "$0")/.."

IMG="${PG_IMAGE:-postgres:17-alpine}"
CT="pvt-validate-$$"
cleanup() { docker rm -f "$CT" >/dev/null 2>&1 || true; }
trap cleanup EXIT

run() { docker exec -i "$CT" psql -U postgres -d pvt -v ON_ERROR_STOP=1 -q; }

echo "→ subindo Postgres ($IMG)…"
docker run -d --name "$CT" -e POSTGRES_PASSWORD=pvt -e POSTGRES_DB=pvt "$IMG" >/dev/null
for _ in $(seq 1 30); do docker exec "$CT" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done

echo "→ stub do schema auth…"
run < scripts/_auth-stub.sql

for f in supabase/migrations/*.sql; do
  if run < "$f" >/tmp/pvt-mig.$$ 2>&1; then
    echo "  OK  $(basename "$f")"
  else
    echo "  FALHOU $(basename "$f"):"
    cat /tmp/pvt-mig.$$
    rm -f /tmp/pvt-mig.$$
    exit 1
  fi
done
rm -f /tmp/pvt-mig.$$
echo "✅ todas as migrations aplicam limpo (do zero)"
