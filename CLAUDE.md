# PVT — Sistema de Reservas da Pousada

## O que é este projeto

PVT é um sistema de gestão de reservas de pousada: quartos com configuração de camas, tarifas por ocupação, reservas com controle de pagamento e funcionário responsável, mapa de disponibilidade mobile-first e motor de sugestão de combinação de quartos.

**Antes de qualquer tarefa, leia `docs/ESPECIFICACAO.md`.** Ele define o modelo de dados, as telas e o algoritmo de disponibilidade. Em caso de dúvida entre este arquivo e a especificação, a especificação vence.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Dados:** Supabase (PostgreSQL + Auth + RLS) via `@supabase/supabase-js` e TanStack Query
- **Deploy:** GitHub Pages via GitHub Actions (build Vite, pasta `dist/`)
- **Testes:** Vitest (unitários) — obrigatórios no motor de disponibilidade
- **Idioma:** toda a UI, mensagens e comentários voltados ao usuário em **português (pt-BR)**. Código (variáveis, funções) em inglês.

## Comandos

```bash
npm run dev        # servidor local
npm run build      # build de produção
npm run test       # vitest
npm run lint       # eslint + prettier
```

Todo PR deve passar `npm run test` e `npm run lint` antes de ser aberto.

## Estrutura

```
src/
├── features/
│   ├── quartos/          # CRUD de quartos e tarifas
│   ├── reservas/         # reservas, segmentos, check-in/out
│   ├── pagamentos/       # registro e situação financeira
│   ├── disponibilidade/  # motor de busca e combinação (CORE)
│   └── auth/             # login de funcionários
├── components/           # UI compartilhada (Button, Modal, etc.)
└── lib/                  # supabaseClient, formatadores, datas
supabase/
├── migrations/           # schema versionado — ver regras abaixo
└── functions/            # edge functions (fase de IA)
```

## Regras para instâncias do Claude Code trabalhando em paralelo

1. **Uma issue = uma branch = um PR.** Nome da branch: `feat/<nº-da-issue>-<slug>` (ex.: `feat/12-mapa-quartos`). Nunca commite direto na `main`.
2. **Respeite as fronteiras de pasta.** Sua issue indica em quais pastas de `features/` você pode mexer. Não edite arquivos fora do escopo da sua issue; se precisar de algo em `components/` ou `lib/`, crie arquivo novo em vez de modificar um existente, e sinalize no PR.
3. **Migrations são exclusivas.** Só altere `supabase/migrations/` se a sua issue disser explicitamente. Nunca edite uma migration já existente — crie uma nova, numerada sequencialmente (`0007_descricao.sql`).
4. **Não invente schema.** As tabelas são as da especificação. Se uma coluna parecer faltar, registre no PR em vez de adicionar por conta própria.
5. **Datas:** períodos de reserva usam data de fim **exclusiva** (dia do checkout o quarto já pode ser ocupado por outro hóspede). Use sempre `date-fns`, nunca aritmética manual de Date.
6. **Dinheiro:** valores em `numeric` no banco; no frontend, trabalhe em centavos (inteiro) e formate com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
7. **Segurança:** nenhuma chave além de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no frontend. Chaves da Claude API só em edge functions.
8. **Mobile-first:** desenvolva e teste em viewport de 390px primeiro. Alvos de toque com mínimo de 44px.
9. **Commits:** Conventional Commits em português (`feat: mapa de quartos com status de pagamento`).

## Definição de pronto (todo PR)

- Critérios de aceite da issue atendidos
- `npm run test` e `npm run lint` passando
- Funciona em viewport mobile (390px)
- Sem `console.log` sobrando, sem `any` sem justificativa
- Descrição do PR explica o que foi feito e como testar
