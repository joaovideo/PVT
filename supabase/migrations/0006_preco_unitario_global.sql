-- 0006 — Preço unitário GLOBAL por adulto e por criança
-- Regra do João (2026-07-09): o valor por adulto é o MESMO em qualquer quarto,
-- e a diária é linear na ocupação:
--   diária = adultos × valor_adulto[nível] + crianças × valor_crianca[nível]
-- Ambos os valores são únicos da pousada (config_pousada), em 3 níveis.
-- Com isso a tabela `tarifas` (preço por quarto) deixa de existir.

-- 1. Valor unitário do adulto (3 níveis) na configuração da pousada
alter table config_pousada
  add column adulto_valor_desconto numeric(10,2),
  add column adulto_valor_normal   numeric(10,2),
  add column adulto_valor_full      numeric(10,2);

-- Semente: média dos preços de 1 adulto já cadastrados (fallback 100/120/150)
update config_pousada set
  adulto_valor_desconto = coalesce((select round(avg(valor_desconto), 2) from tarifas where adultos = 1), 100.00),
  adulto_valor_normal   = coalesce((select round(avg(valor_normal),   2) from tarifas where adultos = 1), 120.00),
  adulto_valor_full     = coalesce((select round(avg(valor_full),      2) from tarifas where adultos = 1), 150.00);

alter table config_pousada alter column adulto_valor_desconto set not null;
alter table config_pousada alter column adulto_valor_normal   set not null;
alter table config_pousada alter column adulto_valor_full     set not null;

-- 2. Preço deixa de ser por quarto
drop table tarifas;
