#!/usr/bin/env bash
# Ensaia uma migration sobre uma CÓPIA REAL de produção, num Postgres Docker —
# pega problemas que só aparecem com os dados reais (violação de constraint,
# backfill, etc.) ANTES de tocar produção. Não altera produção.
#
# Uso: scripts/rehearse.sh [backup.sql.gz] supabase/migrations/00XX_*.sql [mais…]
#   - Se o 1º argumento não for um .sql.gz, usa o backup mais recente em backups/.
set -euo pipefail
cd "$(dirname "$0")/.."

IMG="${PG_IMAGE:-postgres:17-alpine}"

if [[ "${1:-}" == *.sql.gz ]]; then
  dump="$1"
  shift
else
  dump="$(ls -t backups/*.sql.gz 2>/dev/null | head -1 || true)"
fi
[ -n "${dump:-}" ] && [ -f "$dump" ] || {
  echo "backup não encontrado — rode scripts/backup.sh primeiro (ou passe o arquivo)"
  exit 1
}
[ "$#" -ge 1 ] || {
  echo "passe pelo menos uma migration para ensaiar"
  exit 1
}

CT="pvt-rehearse-$$"
cleanup() { docker rm -f "$CT" >/dev/null 2>&1 || true; }
trap cleanup EXIT
run() { docker exec -i "$CT" psql -U postgres -d pvt -v ON_ERROR_STOP=1 -q; }

echo "→ subindo Postgres ($IMG)…"
docker run -d --name "$CT" -e POSTGRES_PASSWORD=pvt -e POSTGRES_DB=pvt "$IMG" >/dev/null
for _ in $(seq 1 30); do docker exec "$CT" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done

echo "→ stub do schema auth…"
run < scripts/_auth-stub.sql

echo "→ restaurando cópia de produção ($dump)…"
# session_replication_role=replica desliga as FKs durante a carga: a FK
# funcionarios→auth.users não bloqueia (o auth aqui é só um stub vazio).
{ echo "set session_replication_role = replica;"; gunzip -c "$dump"; } | run

echo "→ aplicando migration(s) sobre os dados reais:"
for m in "$@"; do
  if run < "$m" >/tmp/pvt-reh.$$ 2>&1; then
    echo "  OK  $(basename "$m")"
  else
    echo "  FALHOU $(basename "$m"):"
    cat /tmp/pvt-reh.$$
    rm -f /tmp/pvt-reh.$$
    exit 1
  fi
done
rm -f /tmp/pvt-reh.$$
echo "✅ ensaio OK — a migration aplica sobre os dados reais de produção"
