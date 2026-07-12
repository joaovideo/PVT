# scripts/ — harness de migração (backup, ensaio e validação)

Rede de segurança **grátis** para aplicar migrations sem o Supabase Pro. Tudo
roda em Postgres via Docker; nada aqui altera produção, exceto o `pg_dump` de
leitura do `backup.sh`.

## Pré-requisitos

- **Docker** rodando (Docker Desktop).
- Para `backup.sh` e `rehearse.sh`: a variável `SUPABASE_DB_URL` com a string de
  conexão do Postgres de produção (Supabase → **Settings → Database → Connection
  string**). Use a conexão **direta** ou o **pooler de sessão** — o pooler de
  transação (porta 6543) não serve para `pg_dump`. **Nunca commite essa URL.**

```bash
export SUPABASE_DB_URL="postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres"
```

## Fluxo seguro para aplicar uma migration em produção

```bash
npm run db:validate                                   # 1. as migrations aplicam do zero?
scripts/backup.sh                                     # 2. backup de produção (backups/*.sql.gz)
scripts/rehearse.sh supabase/migrations/00XX_*.sql    # 3. ensaia sobre a cópia real
# 4. se tudo OK → aplica o SQL da migration no SQL Editor do Supabase
# 5. guarde o backup até ter certeza de que está tudo certo
```

## Scripts

| Script | O que faz | Precisa de produção? |
|---|---|---|
| `validate.sh` | Sobe Postgres em Docker, aplica o stub de `auth` e **todas** as migrations do zero. | Não |
| `backup.sh` | `pg_dump` do schema `public` de produção → `backups/pvt-public-<ts>.sql.gz` (restaurável). | Sim (leitura) |
| `rehearse.sh` | Restaura o último backup num Postgres Docker e aplica a(s) migration(s) passada(s) — ensaio sobre dados reais. | Não (usa o dump) |

## Rollback (se uma migration der errado em produção)

```bash
gunzip -c backups/pvt-public-<ts>.sql.gz | psql "$SUPABASE_DB_URL"
```

O dump é gerado com `--clean --if-exists`, então ele mesmo derruba e recria os
objetos do schema `public` a partir do backup.

## Notas

- `_auth-stub.sql` é um schema `auth` **mínimo** só para os testes locais — não
  reflete o Auth real do Supabase. Se uma migration futura passar a referenciar
  outro objeto de `auth`, estenda o stub.
- `backups/` é ignorado pelo git (contém dados reais).
- `PG_IMAGE` sobrescreve a imagem (padrão `postgres:16-alpine`).
