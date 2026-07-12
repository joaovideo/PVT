#!/usr/bin/env bash
# Teste de isolamento entre tenants (a "joia da coroa" do harness — D8 do ADR).
# Sobe Postgres em Docker, aplica todas as migrations, cria DUAS pousadas com um
# admin cada + um super-admin, e prova que:
#   - cada admin só enxerga a própria pousada;
#   - insert cross-tenant é bloqueado pelo RLS;
#   - o super-admin enxerga as duas.
set -euo pipefail
cd "$(dirname "$0")/.."

IMG="${PG_IMAGE:-postgres:16-alpine}"
CT="pvt-iso-$$"
FAIL=0
A="11111111-1111-1111-1111-111111111111"
B="22222222-2222-2222-2222-222222222222"
S="33333333-3333-3333-3333-333333333333"

cleanup() { docker rm -f "$CT" >/dev/null 2>&1 || true; }
trap cleanup EXIT
psqlp() { docker exec -i "$CT" psql -U postgres -d pvt -v ON_ERROR_STOP=1 -q; }
q() { docker exec -i "$CT" psql -U postgres -d pvt -At -q -c "$1"; }
assert() { if [ "$2" = "$3" ]; then echo "  ✓ $1"; else echo "  ✗ $1 (obtido '$2', esperado '$3')"; FAIL=1; fi; }
# consulta como um usuário autenticado específico
as_user() { q "set role authenticated; set request.jwt.claims = '{\"sub\":\"$1\"}'; $2"; }

echo "→ subindo Postgres ($IMG)…"
docker run -d --name "$CT" -e POSTGRES_PASSWORD=pvt -e POSTGRES_DB=pvt "$IMG" >/dev/null
for _ in $(seq 1 30); do docker exec "$CT" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done

echo "→ stub + migrations…"
psqlp < scripts/_auth-stub.sql
for f in supabase/migrations/*.sql; do psqlp < "$f" >/dev/null; done

echo "→ seed (2 pousadas, 2 admins, 1 super-admin, 1 quarto por pousada)…"
# replica desliga triggers/FK durante o seed → insiro tudo com pousada_id explícito
psqlp <<SQL
set session_replication_role = replica;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into pousadas (id, slug, nome_exibicao) values (2,'pousada-2','Pousada 2');
select setval(pg_get_serial_sequence('pousadas','id'), 2, true);

insert into auth.users (id, email) values
  ('$A','a@t1'), ('$B','b@t2'), ('$S','s@plat');
insert into funcionarios (id, nome, ativo, admin, pousada_id) values
  ('$A','Admin A', true, true, 1),
  ('$B','Admin B', true, true, 2);
insert into plataforma_admins (user_id, nome) values ('$S','Super');

insert into quartos (nome, capacidade_max, pousada_id) values
  ('Quarto P1', 2, 1), ('Quarto P2', 2, 2);
SQL

echo "→ asserções de isolamento:"
assert "Admin A vê só a própria pousada (1 quarto)"      "$(as_user "$A" 'select count(*) from quartos;')" "1"
assert "Admin A não vê nada da pousada 2"                "$(as_user "$A" 'select count(*) from quartos where pousada_id=2;')" "0"
assert "Admin B vê só a própria pousada (1 quarto)"      "$(as_user "$B" 'select count(*) from quartos;')" "1"
assert "Super-admin vê as duas pousadas (2 quartos)"     "$(as_user "$S" 'select count(*) from quartos;')" "2"

# Admin A insere sem pousada_id → carimbado como pousada 1
as_user "$A" "insert into quartos(nome,capacidade_max) values('Novo A',2);" >/dev/null
assert "Após insert, Admin A vê 2 quartos"               "$(as_user "$A" 'select count(*) from quartos;')" "2"
assert "Insert de A não vazou para a pousada 2"          "$(as_user "$B" 'select count(*) from quartos;')" "1"

# Admin A tenta inserir na pousada 2 → WITH CHECK bloqueia
if as_user "$A" "insert into quartos(nome,capacidade_max,pousada_id) values('Hack',2,2);" >/dev/null 2>&1; then
  echo "  ✗ insert cross-tenant deveria ter falhado"; FAIL=1
else
  echo "  ✓ insert cross-tenant bloqueado pelo RLS"
fi

echo ""
[ "$FAIL" = 0 ] && echo "✅ isolamento entre tenants OK" || { echo "❌ FALHA no isolamento"; exit 1; }
