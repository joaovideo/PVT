# PVT — Sistema de Reservas da Pousada

Gestão de reservas mobile-first: quartos, tarifas por ocupação, reservas com controle
de pagamento e mapa de disponibilidade. Especificação completa em
[`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md).

**Site publicado:** <https://joaovideo.github.io/PVT/>

## Stack

React 18 + TypeScript + Vite + Tailwind CSS · Supabase (PostgreSQL, Auth, RLS) ·
TanStack Query · GitHub Pages via Actions.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencher com a URL e anon key do Supabase
npm run dev                  # http://localhost:5173/PVT/
npm run test                 # vitest
npm run lint                 # eslint + prettier
npm run build                # produção em dist/
```

## Banco de dados (Supabase)

Aplicar em um projeto Supabase limpo, na ordem, via SQL Editor ou `supabase db push`:

1. `supabase/migrations/0001_schema_inicial.sql`
2. `supabase/migrations/0002_views.sql`
3. `supabase/migrations/0003_constraints.sql`
4. `supabase/migrations/0004_rls.sql`
5. `supabase/seed.sql` (opcional — dados de exemplo para desenvolvimento)

Os usuários dos funcionários são criados em **Authentication → Users**; o trigger da
migration 0004 cria a linha correspondente em `funcionarios` automaticamente.

## Deploy (GitHub Pages)

Cada push na `main` roda lint + testes + build e publica `dist/` no GitHub Pages
(workflow em `.github/workflows/deploy.yml`).

Configuração única do repositório:

1. **Settings → Secrets and variables → Actions**: criar `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` (valores em Settings → API no painel do Supabase).
   A anon key é pública por design — a proteção real é o Row Level Security.
2. **Settings → Pages**: em *Build and deployment*, escolher **GitHub Actions**.

As rotas usam `HashRouter`, então funcionam no Pages sem fallback de servidor.
