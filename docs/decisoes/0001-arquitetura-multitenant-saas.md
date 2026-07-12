# ADR 0001 — Arquitetura multi-tenant SaaS (comercialização do PVT)

- **Status:** Proposto
- **Data:** 2026-07-12
- **Decisores:** João
- **Contexto do projeto:** [[project-pvt-pousada]]

## Contexto

O PVT nasceu single-tenant: uma única pousada, um único conjunto de dados. O
objetivo agora é **comercializar** o software como SaaS **multi-tenant**, muito
seguro, com um harness de CI forte, onde:

1. **Cada pousada** gerencia seus próprios funcionários e dados, totalmente
   isolada das demais (App da Pousada).
2. **Você (plataforma)** tem um painel super-admin que enxerga todas as
   pousadas, gerencia tenants e billing (App da Plataforma).
3. **Cada pousada tem identidade visual própria** (white-label): logo,
   endereço e cores, além de um endereço/URL customizável.

Estado atual relevante: o schema não tem noção de tenant (`config_pousada` é
literalmente uma linha única `id=1`); o app roda no Supabase gerenciado (free
tier) com deploy no GitHub Pages; toda a segurança de dados é feita por RLS.

## Decisões

### D1 — Multi-tenancy: banco único compartilhado + `pousada_id` + RLS

Modelo **shared database, shared schema, isolamento por linha**. Toda tabela de
domínio ganha `pousada_id`; o RLS escopa cada consulta ao tenant do usuário.

- Rejeitado **database-per-tenant / schema-per-tenant**: isolamento mais forte,
  mas operação pesada e ruim para muitos tenants pequenos (pousadas). O painel
  super-admin (D3) também exige visão consolidada, que um banco único entrega
  naturalmente.
- É o cenário em que o RLS do Postgres/Supabase brilha e onde já temos
  experiência no projeto.

### D2 — Dois frontends, um banco

- **App 1 — Pousada (tenant):** evolução do PVT atual. Login do pessoal da
  pousada; só vê o próprio `pousada_id`.
- **App 2 — Plataforma (super-admin):** app separado, domínio separado, auth
  próprio; gestão de tenants, billing, métricas, suporte.

Ambos batem no **mesmo** projeto Supabase. Separar os frontends reduz a
superfície de ataque (o código que cruza tenants nunca é entregue ao navegador
das pousadas), limita o raio de dano de um XSS e atende públicos/UX distintos.
As **migrations continuam únicas** (uma fonte de verdade do schema).

### D3 — Dois planos de papel

- **Plano tenant:** `funcionario` comum e `admin` da pousada — sempre travados
  ao `pousada_id`.
- **Plano plataforma:** `super_admin`, que **não é membro de nenhum tenant**. A
  flag mora em tabela **separada** (`plataforma_admins`), fora de `funcionarios`,
  para que um admin de pousada **nunca** consiga se auto-promover editando a
  própria linha. Verificada por função `eh_super_admin()`.

Política RLS padrão de cada tabela, na prática:
`using (pousada_id = pousada_do_usuario() OR eh_super_admin())`.

**Acesso cross-tenant é o ativo mais valioso do sistema.** Portanto:
- **MFA** obrigatório para super-admin.
- **Log de auditoria** de todo acesso/ação cross-tenant.
- Preferir **modo suporte/impersonação** (super-admin "entra" numa pousada em
  sessão escopada e registrada) em vez de chave-mestra de escrita irrestrita.
- Todo `security definer` deve tratar tenant **e** super-admin explicitamente —
  é aí que vazamentos cross-tenant acontecem.

### D4 — Identidade visual customizável por pousada (white-label)

Cada pousada tem **logo, endereço, cores e nome de exibição** próprios, além de
um **endereço/URL** (slug). Reaproveita o padrão de tokens de marca já existente
(`text-marca`, `bg-fundo`) e o `ThemeContext` do ecossistema veng
([[project-veng-identity]]).

- **Dados:** campos de branding na tabela `pousadas` (ou tabela
  `pousada_branding` 1-1): `slug` (único, URL-safe), `nome_exibicao`,
  `endereco`, `logo_url`, `cor_primaria`, `cor_secundaria`, `cor_fundo`.
- **Logo:** Supabase **Storage**, bucket `branding`, caminho
  `<pousada_id>/logo...`. RLS de Storage: admin da pousada escreve só a própria
  pasta; leitura pública (o logo aparece na tela de login, antes de autenticar).
- **Tema em runtime:** as cores do tenant viram **CSS custom properties** que
  sobrescrevem os tokens Tailwind (`--cor-marca`, `--cor-fundo`, …). Sem rebuild
  por tenant — um único bundle lê o tema do tenant resolvido.
- **Resolução ANTES do login:** o app resolve o tenant pelo endereço (slug) e lê
  um **branding público** (view anon-readable `pousada_publica` com só
  `slug, nome_exibicao, logo_url, endereco, cores`) para já pintar a tela de
  login com a cara da pousada. Essa view **não** expõe nenhum dado sensível.

### D5 — Endereço/URL por pousada

Faseado, do mais simples ao mais premium:
1. **Slug em path:** `app.dominio/p/<slug>` — funciona num SPA de domínio único,
   zero DNS extra. **Ponto de partida.**
2. **Subdomínio:** `<slug>.dominio` — precisa de DNS wildcard + TLS wildcard.
3. **Domínio próprio do cliente:** `reservas.pousadadobem.com.br` — TLS por
   domínio (ACME). Recurso premium, fase posterior.

O slug também **escopa o login**: o tenant vem da URL e o auth valida que o
usuário pertence àquela pousada.

### D6 — Infra: seguir no Supabase gerenciado (Pro) por ora

Manter o Supabase **gerenciado**, subindo para o plano **Pro**, que resolve dois
incômodos reais já registrados: o **limite de 2 e-mails/hora** e a **falta de
backup** (ganha PITR). Self-hosting fica para depois, motivado por escala real,
custo em volume ou residência de dados — e, se vier, feito com HA e backups
gerenciados, **nunca** num box único de IP fixo (que seria menos seguro, não
mais). Ver discussão em [[project-pvt-pousada]].

### D7 — Repositório: monorepo

`apps/pousada`, `apps/plataforma` e `packages/db` (migrations +
`database.types.ts` + client Supabase compartilhados). Time pequeno/solo se
beneficia dos types compartilhados e da fonte única de migrations. Dois repos
separados só se justificam com times distintos no futuro.

### D8 — Harness (CI) forte

Portões obrigatórios no CI, além do atual (lint + test + build com exit code
conferido de verdade — ver [[feedback-validation-exit-code]]):
- **Testes de isolamento entre tenants** — a **joia da coroa**: provar que
  tenant A não lê/escreve nada de tenant B; que super-admin **pode** cruzar (de
  propósito) e é auditado; que admin de pousada **não vira** super-admin.
- Migrations testadas contra um Postgres real (Docker) antes do merge.
- Scan de dependências e de segredos; review obrigatório de PR.
- Ambiente de **staging** separado da produção.

## Plano de migração single → multi (dados reais, faseado)

A produção tem **uma pousada real** (dados do João). A migração é delicada e
será feita em fases, cada uma como migration numerada + PR:

1. **Fundação do tenant (sem quebrar nada):** criar `pousadas`, inserir a
   pousada atual como tenant #1, adicionar `pousada_id` **nullable** nas tabelas
   e backfill com o tenant #1.
2. **Tornar obrigatório + RLS:** `pousada_id NOT NULL`; reescrever TODAS as
   políticas RLS para escopar por tenant; tornar as funções `security definer`
   tenant-aware; helper `pousada_do_usuario()`.
3. **Plano plataforma:** `plataforma_admins`, `eh_super_admin()`, log de
   auditoria, exceção super-admin nas políticas.
4. **Branding + slug (D4/D5):** campos de branding, bucket de Storage, view
   pública, tema em runtime, resolução por slug.
5. **App da Plataforma (D2):** novo app no monorepo.
6. **Onboarding + billing:** criar tenant + primeiro admin; Stripe (há
   experiência no projeto Backup Engine).

## Consequências

**Positivas:** produto comercializável; isolamento forte por RLS; identidade por
pousada; base já validada (PVT finalizado); reaproveita tokens de marca e
ThemeContext existentes.

**Custos/riscos:** reescrita de RLS e das funções `security definer`
(alto risco se malfeito → vazamento cross-tenant); migração de dados reais em
produção exige cuidado e backup antes; o painel super-admin é alvo de alto valor
(exige MFA + auditoria); Storage e billing são superfícies novas.

**A rever no futuro:** a função `criar_ou_reativar_funcionario` escreve direto em
`auth.users` — pragmática hoje, vira passivo em escala multi-tenant; migrar para
fluxo de admin API/Edge Function quando houver o App da Plataforma.
