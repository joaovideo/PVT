#!/usr/bin/env bash
# Backup lógico do schema `public` de produção — a rede de segurança ANTES de
# aplicar qualquer migration (substitui o PITR do Supabase Pro para migrações
# agendadas). Gera um arquivo restaurável, com timestamp, em backups/.
#
# Requer a variável SUPABASE_DB_URL com a string de conexão do Postgres de
# produção (Supabase → Settings → Database → Connection string). Use a conexão
# DIRETA ou o pooler de SESSÃO — o pooler de transação (porta 6543) não serve
# para pg_dump. NUNCA commite essa URL (contém a senha do banco).
#
# Uso: SUPABASE_DB_URL="postgresql://…" scripts/backup.sh
set -euo pipefail
: "${SUPABASE_DB_URL:?defina SUPABASE_DB_URL com a string de conexão do Postgres de produção}"
cd "$(dirname "$0")/.."

IMG="${PG_IMAGE:-postgres:16-alpine}"
mkdir -p backups
ts=$(date +%Y%m%d-%H%M%S)
out="backups/pvt-public-${ts}.sql.gz"

# pg_dump roda DENTRO do Docker (mesma versão do servidor) — não precisa
# instalar Postgres na máquina, só ter o Docker rodando.
echo "→ pg_dump (schema public, schema+dados) de produção → $out"
docker run --rm "$IMG" pg_dump "$SUPABASE_DB_URL" \
  --schema=public --no-owner --no-privileges --clean --if-exists \
  | gzip >"$out"

echo "✅ backup: $out ($(du -h "$out" | cut -f1))"
echo "   rollback em produção:  gunzip -c '$out' | docker run --rm -i $IMG psql \"\$SUPABASE_DB_URL\""
echo "   ensaiar migration:     scripts/rehearse.sh '$out' supabase/migrations/00XX_*.sql"
