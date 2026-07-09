-- 0012 — Preço por quarto (3 níveis fixos por quarto) + valor personalizado
-- Decisão do João (2026-07-09): abandona o modelo por pessoa/criança. Cada
-- quarto tem 3 preços de diária próprios (baixa/alta temporada e fim de
-- semana). Na reserva, além dos 3 níveis, existe "personalizado" (o
-- funcionário digita o valor à mão). O preço NÃO depende mais do nº de
-- pessoas — adultos/crianças seguem registrados só para ocupação/capacidade.

-- 1. Preços de diária por quarto (flat, não multiplica por pessoa)
alter table quartos
  add column preco_baixa numeric(10,2) not null default 0,
  add column preco_alta  numeric(10,2) not null default 0,
  add column preco_fds   numeric(10,2) not null default 0;

-- 2. Novos níveis de preço na reserva. valor_total já está gravado; o
--    nivel_preco é só o rótulo de qual foi usado.
alter table reservas drop constraint reservas_nivel_preco_check;
update reservas set nivel_preco =
  case nivel_preco when 'full' then 'alta' else 'baixa' end
  where nivel_preco in ('desconto', 'normal', 'full');
alter table reservas add constraint reservas_nivel_preco_check
  check (nivel_preco in ('baixa', 'alta', 'fds', 'custom'));
alter table reservas alter column nivel_preco set default 'baixa';

-- 3. Preços de demonstração para os quartos existentes (João ajusta no Admin).
update quartos set preco_baixa = 200, preco_alta = 300, preco_fds = 250
  where preco_baixa = 0;

-- Nota: as colunas adulto_valor_*/crianca_valor_* de config_pousada ficam
-- obsoletas (modelo antigo), mas NÃO são removidas aqui para não quebrar o
-- frontend anterior durante o deploy. Podem ser dropadas numa migration
-- futura, depois que o novo frontend estiver no ar.
