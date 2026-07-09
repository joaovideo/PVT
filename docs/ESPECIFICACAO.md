# Sistema de Reservas da Pousada — Especificação do Projeto

## 1. Visão geral

Aplicação web de gestão de reservas para pousada, otimizada para celular (mobile-first), com hospedagem gratuita. Permite cadastrar quartos com sua configuração de camas e capacidade, definir tarifas por tipo de ocupação, registrar reservas com controle de pagamento e responsável, e sugerir automaticamente combinações de quartos quando nenhum quarto único está livre durante todo o período solicitado — minimizando o número de trocas de quarto do hóspede.

## 2. Arquitetura

A arquitetura é deliberadamente enxuta: **não há servidor próprio**. O frontend é um site estático hospedado no GitHub Pages, e toda a persistência, autenticação e regras de acesso ficam no Supabase (PostgreSQL gerenciado, plano gratuito).

```
┌─────────────────────────┐
│  GitHub Pages (grátis)  │
│  React + Vite + Tailwind│  ← PWA, mobile-first
└───────────┬─────────────┘
            │ HTTPS (supabase-js)
┌───────────▼─────────────┐
│  Supabase (grátis)      │
│  • PostgreSQL           │
│  • Auth (funcionários)  │
│  • Row Level Security   │
│  • Edge Functions (IA)  │
└─────────────────────────┘
```

**Stack:**

| Camada | Tecnologia | Custo |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS | grátis |
| Estado/dados | TanStack Query + supabase-js | grátis |
| Banco de dados | Supabase PostgreSQL (500 MB free tier) | grátis |
| Autenticação | Supabase Auth (e-mail/senha por funcionário) | grátis |
| Hospedagem | GitHub Pages + GitHub Actions (CI/CD) | grátis |
| IA (opcional) | Claude API via Supabase Edge Function | pago por uso |

**Por que não backend no GitHub Pages:** o GitHub Pages serve apenas arquivos estáticos. O Supabase substitui o backend inteiro: a chave `anon` é pública por design, e a segurança real é feita por políticas de Row Level Security no banco (só funcionários autenticados leem/escrevem).

O app deve ser configurado como **PWA** (Progressive Web App): instalável na tela inicial do celular, com cache offline básico da tela de mapa de quartos.

## 3. Modelo de dados (PostgreSQL / Supabase)

```sql
-- Funcionários (vinculados ao Supabase Auth)
create table funcionarios (
  id uuid primary key references auth.users(id),
  nome text not null,
  ativo boolean not null default true
);

-- Quartos
create table quartos (
  id serial primary key,
  nome text not null,              -- ex: "Quarto 3 — Ipê"
  camas_casal int not null default 0,
  camas_solteiro int not null default 0,
  capacidade_max int not null,     -- pessoas
  observacoes text,
  ativo boolean not null default true
);

-- Preço da diária é GLOBAL e linear na ocupação (não varia por quarto):
--   diária = adultos × adulto_valor[nível] + crianças × crianca_valor[nível]
-- Os valores unitários (por adulto e por criança), em três níveis
-- (desconto/normal/full), ficam na configuração única da pousada. Editáveis
-- no Admin. Quem passa da idade limite conta como adulto. Não há tabela de
-- tarifa por quarto: os quartos diferem apenas por camas e capacidade.
create table config_pousada (
  id int primary key default 1 check (id = 1),  -- linha única
  adulto_valor_desconto numeric(10,2) not null,
  adulto_valor_normal numeric(10,2) not null,
  adulto_valor_full numeric(10,2) not null,
  crianca_valor_desconto numeric(10,2) not null,
  crianca_valor_normal numeric(10,2) not null,
  crianca_valor_full numeric(10,2) not null,
  crianca_idade_max int not null default 12
);

-- Hóspedes
create table hospedes (
  id serial primary key,
  nome text not null,
  telefone text,
  email text,
  documento text
);

-- Reserva (uma estadia; pode envolver mais de um quarto)
create table reservas (
  id serial primary key,
  hospede_id int not null references hospedes(id),
  data_checkin date not null,
  data_checkout date not null,
  hora_chegada_prevista time,      -- que horas a pessoa chega
  adultos int not null default 1,
  criancas int not null default 0,
  nivel_preco text not null default 'normal'
    check (nivel_preco in ('desconto','normal','full')),
  valor_total numeric(10,2) not null,
  status text not null default 'confirmada'
    check (status in ('pre-reserva','confirmada','checkin','checkout','cancelada')),
  criada_por uuid not null references funcionarios(id),
  criada_em timestamptz not null default now(),
  observacoes text
);

-- Segmentos: qual quarto em qual trecho da estadia.
-- Reserva simples = 1 segmento. Combinação de quartos = N segmentos.
create table reserva_segmentos (
  id serial primary key,
  reserva_id int not null references reservas(id) on delete cascade,
  quarto_id int not null references quartos(id),
  data_inicio date not null,
  data_fim date not null,          -- exclusiva (dia da saída do quarto)
  check (data_fim > data_inicio)
);

-- Pagamentos (parciais ou totais)
create table pagamentos (
  id serial primary key,
  reserva_id int not null references reservas(id),
  valor numeric(10,2) not null,
  metodo text not null check (metodo in ('pix','dinheiro','cartao','transferencia','outro')),
  recebido_por uuid not null references funcionarios(id),
  recebido_em timestamptz not null default now(),
  observacao text
);

-- Despesas extras lançadas na conta da reserva
-- (café da manhã extra, caldo, refrigerante, lanche etc.)
create table despesas_extras (
  id serial primary key,
  reserva_id int not null references reservas(id),
  descricao text not null,
  quantidade int not null default 1 check (quantidade > 0),
  valor_unitario numeric(10,2) not null,
  lancada_por uuid not null references funcionarios(id),
  lancada_em timestamptz not null default now()
);

-- Linha do tempo da reserva: log legível de quem fez o quê, alimentado
-- por triggers (criação, mudança de status/check-in/check-out/cancelamento,
-- pagamento recebido, despesa lançada). Append-only: sem update nem delete.
create table reserva_eventos (
  id serial primary key,
  reserva_id int not null references reservas(id) on delete cascade,
  tipo text not null check (tipo in
    ('criacao','status','pagamento','despesa','bloqueio_quarto')),
  descricao text not null,          -- ex: "Check-in realizado", "R$ 500,00 via pix"
  funcionario_id uuid references funcionarios(id),
  ocorrido_em timestamptz not null default now()
);
```

O ponto central do modelo é `reserva_segmentos`: ele torna a "combinação de quartos" um cidadão de primeira classe do banco, em vez de gambiarra. A disponibilidade de um quarto num período é calculada verificando sobreposição de segmentos ativos (`status <> 'cancelada'`) **e de bloqueios** (manutenção/reforma). Crie um índice em `(quarto_id, data_inicio, data_fim)` e uma constraint de exclusão (`EXCLUDE USING gist`) para impedir overbooking no nível do banco — nunca confie só no frontend.

> **Nota de versionamento:** o banco criado no sprint 0 (migrations 0001–0004) tem `tarifas.valor_diaria` e não tem `nivel_preco` nem `bloqueios`. Essas mudanças entraram nas migrations 0005 e 0006 — nunca editar migrations já aplicadas.

O status de pagamento da reserva é derivado: `sum(pagamentos.valor)` comparado ao **valor final** (estadia + despesas extras) → **não pago / parcial / pago**. Não armazene esse status; calcule via view:

```sql
create view reservas_financeiro as
with pagos as (
  select reserva_id, sum(valor) as total_pago
  from pagamentos group by reserva_id
), despesas as (
  select reserva_id, sum(quantidade * valor_unitario) as total_despesas
  from despesas_extras group by reserva_id
)
select r.id, r.valor_total,
       coalesce(d.total_despesas,0)                  as total_despesas,
       r.valor_total + coalesce(d.total_despesas,0)  as valor_final,
       coalesce(p.total_pago,0)                      as total_pago,
       case
         when coalesce(p.total_pago,0) = 0 then 'nao_pago'
         when coalesce(p.total_pago,0) < r.valor_total + coalesce(d.total_despesas,0) then 'parcial'
         else 'pago'
       end as situacao
from reservas r
left join pagos p on p.reserva_id = r.id
left join despesas d on d.reserva_id = r.id;
```

## 4. Telas (mobile-first)

**Mapa de quartos (tela principal).** Grade tipo calendário: quartos nas linhas, dias nas colunas, com rolagem horizontal por gestos. Células coloridas por status: livre, reservada (não paga = vermelho, parcial = amarelo, paga = verde), check-in feito, bloqueada. Tocar numa célula abre a reserva ou inicia uma nova.

**Filtro de disponibilidade (dashboard de quartos vagos).** Entradas: período (check-in/check-out) **ou nº de diárias a partir de uma data**, nº de adultos, nº de crianças, preferência de camas (casal/solteiro). Só aparecem quartos com camas suficientes para o grupo e sem bloqueio no período. Saída em duas seções: quartos livres o período inteiro (com preço calculado pela tarifa da ocupação no nível escolhido) e, se não houver, as combinações sugeridas pelo motor da seção 5.

**Orçamento rápido → reserva.** Fluxo central da recepção: o funcionário informa **quantidade de pessoas, diárias e nível de preço (desconto/normal/full)** e o app mostra na hora o **valor final da estadia** para passar ao cliente. Se o cliente aceitar, um toque converte o orçamento em reserva e **bloqueia o quarto naquelas datas** (via `reserva_segmentos`, protegido pela constraint anti-overbooking), **com a opção de já registrar o sinal** (valor e forma de pagamento) no mesmo passo — o sinal é um pagamento parcial normal: entra no histórico, muda a situação para "parcial" (amarelo no mapa) e é abatido do saldo no checkout.

**Nova reserva.** Hóspede (busca ou cadastro rápido), período, hora prevista de chegada, ocupação, **nível de preço**, quarto(s), valor calculado automaticamente pela tabela de tarifas com possibilidade de ajuste manual. O funcionário logado é gravado automaticamente como `criada_por`.

**Detalhe da reserva.** Tudo em uma tela: dados do hóspede, segmentos de quarto, situação financeira com histórico de pagamentos (valor, método, quem recebeu, quando), botão "Registrar pagamento", **botão "Lançar despesa" para consumo extra (café da manhã extra, caldo, refrigerante, lanche etc., com quantidade, valor e quem lançou)**, botões de check-in/check-out, **botão "Cancelar reserva" com motivo obrigatório** (a reserva nunca é apagada: vira status `cancelada`, o quarto libera na hora e o log registra quem cancelou), quem criou a reserva. **No check-out o app apresenta a conta fechada: estadia + despesas extras − pagamentos = saldo a receber.**

**Histórico (log de atividades).** Na tela da reserva, uma linha do tempo simples e legível de tudo que aconteceu e **qual funcionário fez**: "Ana criou a reserva (nível normal)", "Bruno lançou 2× caldo — R$ 30,00", "Ana recebeu R$ 500,00 via pix", "Bruno fez o check-in". Alimentada automaticamente por triggers na tabela `reserva_eventos` — o funcionário não precisa preencher nada. Append-only: eventos não podem ser editados nem apagados.

**Chegadas e saídas do dia.** Duas listas na mesma aba, a tela que a recepção deixa aberta. **Chegadas:** reservas com check-in hoje, ordenadas por hora prevista de chegada. **Saídas:** reservas com check-out hoje, mostrando quem **já fez check-out (com a hora)** e quem ainda não — check-out feito significa quarto liberado para arrumação.

**Avisos em tempo real.** Via Supabase Realtime (canal em `reserva_eventos`), todos os funcionários com o app aberto são notificados na hora, sem recarregar: **cancelamento de reserva** ("Quarto 3 liberou de 10–13/07 — cancelada por Ana") e **check-out realizado** ("Quarto 5 fez check-out — pode arrumar"). Um sino no cabeçalho acumula os avisos recentes para quem abriu o app depois. Notificação push com o app fechado fica para a fase PWA (Sprint 5).

**Administração.** CRUD completo de quartos (**criar, editar configuração de camas/capacidade e excluir/desativar**), valores da diária (**editar os três níveis do valor por adulto e por criança até 12 anos — únicos para toda a pousada**) e funcionários (apenas perfil admin). Inclui **bloquear/desbloquear quarto por período** com motivo (reforma, manutenção).

## 5. Motor de sugestão de combinação de quartos

Minimizar trocas de quarto é um problema de **cobertura de intervalos**, e a solução correta é um algoritmo determinístico — não um LLM. O algoritmo roda no frontend em milissegundos, sem custo:

1. Para o período solicitado, montar a lista de janelas livres de cada quarto compatível (capacidade e camas suficientes para a ocupação), descontando reservas ativas **e bloqueios de manutenção**.
2. Se algum quarto cobre o período inteiro → retornar direto (zero trocas).
3. Caso contrário, algoritmo guloso de cobertura mínima: a partir da data de check-in, escolher o quarto compatível cuja janela livre se estende mais longe; repetir a partir do fim dessa janela até cobrir o checkout. Isso é provadamente ótimo em número de segmentos (mínimo de trocas).
4. Como desempate entre soluções com o mesmo número de trocas: menor preço total, depois manter camas do mesmo tipo.
5. Apresentar as 2–3 melhores combinações, ex.: "Quarto 2 (sex–dom) → Quarto 5 (dom–qua), 1 troca, R$ 1.140".

**Onde a IA entra de verdade (fase 2, opcional):** uma Supabase Edge Function que chama a Claude API para (a) explicar em linguagem natural a melhor combinação para enviar ao hóspede via WhatsApp, e (b) analisar histórico de ocupação e sugerir ajustes de tarifa conforme demanda (fins de semana, feriados, sazonalidade). A chave da API fica na Edge Function, nunca no frontend.

## 6. Estrutura do repositório e trabalho com múltiplas instâncias do Claude Code

```
pousada-reservas/
├── CLAUDE.md              # contexto e convenções para o Claude Code
├── docs/
│   ├── ESPECIFICACAO.md   # este documento
│   └── decisoes/          # ADRs (registros de decisão)
├── supabase/
│   ├── migrations/        # schema versionado em SQL
│   └── functions/         # edge functions (IA)
├── src/
│   ├── features/
│   │   ├── quartos/
│   │   ├── reservas/
│   │   ├── pagamentos/
│   │   ├── disponibilidade/   # motor de combinação
│   │   └── auth/
│   ├── components/        # UI compartilhada
│   └── lib/               # cliente supabase, utilitários
├── tests/
└── .github/workflows/deploy.yml
```

**Regras para paralelizar instâncias do Claude Code sem conflito:**

1. **`CLAUDE.md` na raiz** com: stack, convenções de código, como rodar testes, e a regra "leia `docs/ESPECIFICACAO.md` antes de qualquer tarefa". Todas as instâncias herdam esse contexto automaticamente.
2. **Sprints como GitHub Issues**, uma issue por tarefa, com critérios de aceite. Cada instância do Claude Code recebe uma issue e trabalha em **uma branch própria** (`feat/12-mapa-quartos`), abrindo PR ao final.
3. **Fronteiras por pasta**: a estrutura `features/` permite que uma instância trabalhe em `reservas/` enquanto outra trabalha em `disponibilidade/` com risco quase nulo de conflito de merge. Nunca dê a duas instâncias tarefas que toquem o mesmo arquivo.
4. **Schema é sagrado**: mudanças no banco só via arquivos em `supabase/migrations/`, numerados, e apenas uma instância por vez mexe em migrations.
5. **Testes como contrato**: o motor de disponibilidade (seção 5) deve ter testes unitários completos antes de qualquer UI — é o coração do sistema.

## 7. Deploy gratuito no GitHub Pages

Workflow do GitHub Actions: a cada push na `main`, roda `npm run build` (Vite) e publica `dist/` no GitHub Pages. Configurar `base` no `vite.config.ts` com o nome do repositório e usar HashRouter (ou fallback 404.html) para as rotas do React funcionarem. As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` entram como secrets do repositório — a anon key é pública por design; a proteção real são as políticas RLS.

## 8. Roadmap de sprints

**Sprint 0 — Fundação:** repositório, CLAUDE.md, Vite+React+Tailwind, projeto Supabase, migrations do schema completo, RLS, login de funcionário, deploy funcionando no Pages.

**Sprint 1 — Cadastros:** CRUD de quartos, tarifas, hóspedes e funcionários.

**Sprint 2 — Reservas:** criar/editar reserva com segmentos, hora de chegada, cálculo de valor, registro de pagamentos com recebedor, view financeira, constraint anti-overbooking.

**Sprint 3 — Mapa e filtros:** mapa de quartos mobile, filtro de disponibilidade, tela de chegadas do dia.

**Sprint 4 — Motor de combinação:** algoritmo guloso com testes unitários, UI de sugestões.

**Sprint 5 — PWA e polimento:** instalável, cache offline, refinamento de UX no celular.

**Sprint 6 (opcional) — IA:** Edge Function com Claude API para mensagens ao hóspede e sugestão de tarifas por demanda.
