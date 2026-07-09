-- 0005 — Níveis de preço, bloqueios, despesas extras e linha do tempo
-- (Issue #16 e adendos; especificação seções 3 e 4)

-- ============================================================
-- 1. Tarifas: três níveis de preço (desconto / normal / full),
--    por quarto e nº de ADULTOS. Criança sai da tabela: passa a ser
--    um valor único da pousada (config_pousada), somado por criança.
-- ============================================================
alter table tarifas rename column valor_diaria to valor_normal;
alter table tarifas add column valor_desconto numeric(10,2);
alter table tarifas add column valor_full numeric(10,2);

-- Ponto de partida para dados existentes: desconto = 90%, full = 120%
update tarifas set
  valor_desconto = round(valor_normal * 0.90, 2),
  valor_full     = round(valor_normal * 1.20, 2)
where valor_desconto is null;

alter table tarifas alter column valor_desconto set not null;
alter table tarifas alter column valor_full set not null;

-- Remove as combinações com criança (modelo antigo) e a coluna
delete from tarifas where criancas > 0;
alter table tarifas drop constraint tarifas_quarto_id_adultos_criancas_key;
alter table tarifas drop column criancas;
alter table tarifas add constraint tarifas_quarto_id_adultos_key unique (quarto_id, adultos);

-- Configuração única da pousada: valor por criança (até a idade limite)
-- Diária = tarifa(quarto, adultos)[nível] + nº crianças × valor_crianca[nível]
create table config_pousada (
  id int primary key default 1 check (id = 1),
  crianca_valor_desconto numeric(10,2) not null,
  crianca_valor_normal numeric(10,2) not null,
  crianca_valor_full numeric(10,2) not null,
  crianca_idade_max int not null default 12
);

insert into config_pousada (crianca_valor_desconto, crianca_valor_normal, crianca_valor_full)
values (40.00, 50.00, 60.00);

-- ============================================================
-- 2. Reservas: nível de preço escolhido pelo funcionário
-- ============================================================
alter table reservas add column nivel_preco text not null default 'normal'
  check (nivel_preco in ('desconto','normal','full'));

-- ============================================================
-- 3. Bloqueios de quarto (reforma, manutenção)
-- ============================================================
create table bloqueios (
  id serial primary key,
  quarto_id int not null references quartos(id),
  data_inicio date not null,
  data_fim date not null,          -- exclusiva, como nos segmentos
  motivo text not null,
  criado_por uuid not null references funcionarios(id),
  criado_em timestamptz not null default now(),
  check (data_fim > data_inicio)
);

create index bloqueios_quarto_periodo_idx
  on bloqueios (quarto_id, data_inicio, data_fim);

-- ============================================================
-- 4. Despesas extras (consumo na conta da reserva)
-- ============================================================
create table despesas_extras (
  id serial primary key,
  reserva_id int not null references reservas(id),
  descricao text not null,
  quantidade int not null default 1 check (quantidade > 0),
  valor_unitario numeric(10,2) not null,
  lancada_por uuid not null references funcionarios(id),
  lancada_em timestamptz not null default now()
);

-- ============================================================
-- 5. Linha do tempo da reserva (append-only, alimentada por triggers)
-- ============================================================
create table reserva_eventos (
  id serial primary key,
  reserva_id int not null references reservas(id) on delete cascade,
  tipo text not null check (tipo in
    ('criacao','status','pagamento','despesa','bloqueio_quarto')),
  descricao text not null,
  funcionario_id uuid references funcionarios(id),
  ocorrido_em timestamptz not null default now()
);

create index reserva_eventos_reserva_idx on reserva_eventos (reserva_id, ocorrido_em);

-- ============================================================
-- 6. View financeira v2: valor final = estadia + despesas extras
-- ============================================================
drop view reservas_financeiro;
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

alter view reservas_financeiro set (security_invoker = true);

-- ============================================================
-- 7. RLS das novas tabelas
-- ============================================================
alter table bloqueios enable row level security;
alter table despesas_extras enable row level security;
alter table reserva_eventos enable row level security;

-- Bloqueios: DELETE permitido (desbloquear = apagar o bloqueio)
create policy bloqueios_select on bloqueios for select to authenticated using (funcionario_ativo());
create policy bloqueios_insert on bloqueios for insert to authenticated with check (funcionario_ativo());
create policy bloqueios_update on bloqueios for update to authenticated using (funcionario_ativo()) with check (funcionario_ativo());
create policy bloqueios_delete on bloqueios for delete to authenticated using (funcionario_ativo());

-- Despesas: sem delete (estorno/ajuste em vez de apagar)
create policy despesas_select on despesas_extras for select to authenticated using (funcionario_ativo());
create policy despesas_insert on despesas_extras for insert to authenticated with check (funcionario_ativo());
create policy despesas_update on despesas_extras for update to authenticated using (funcionario_ativo()) with check (funcionario_ativo());

-- Eventos: append-only e SÓ via trigger — apenas leitura para o app
-- (as funções de trigger são security definer e inserem por fora do RLS)
create policy eventos_select on reserva_eventos for select to authenticated using (funcionario_ativo());

-- Config da pousada: leitura e edição (linha única; sem insert/delete)
alter table config_pousada enable row level security;
create policy config_select on config_pousada for select to authenticated using (funcionario_ativo());
create policy config_update on config_pousada for update to authenticated using (funcionario_ativo()) with check (funcionario_ativo());

-- ============================================================
-- 8. Triggers que alimentam a linha do tempo
-- ============================================================
create function formatar_brl(v numeric)
returns text
language sql
immutable
as $$ select 'R$ ' || replace(to_char(v, 'FM999999990.00'), '.', ',') $$;

create function registrar_evento_criacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into reserva_eventos (reserva_id, tipo, descricao, funcionario_id)
  values (new.id, 'criacao',
          'Reserva criada (nível ' || new.nivel_preco || ')',
          new.criada_por);
  return new;
end;
$$;

create trigger trg_evento_criacao
after insert on reservas
for each row execute function registrar_evento_criacao();

create function registrar_evento_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  texto text;
begin
  texto := case new.status
    when 'checkin'     then 'Check-in realizado'
    when 'checkout'    then 'Check-out realizado'
    when 'cancelada'   then 'Reserva cancelada'
    when 'confirmada'  then 'Reserva confirmada'
    when 'pre-reserva' then 'Marcada como pré-reserva'
    else 'Status alterado para ' || new.status
  end;
  insert into reserva_eventos (reserva_id, tipo, descricao, funcionario_id)
  values (new.id, 'status', texto, auth.uid());
  return new;
end;
$$;

create trigger trg_evento_status
after update of status on reservas
for each row
when (old.status is distinct from new.status)
execute function registrar_evento_status();

create function registrar_evento_pagamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into reserva_eventos (reserva_id, tipo, descricao, funcionario_id)
  values (new.reserva_id, 'pagamento',
          'Pagamento recebido: ' || formatar_brl(new.valor) || ' via ' || new.metodo,
          new.recebido_por);
  return new;
end;
$$;

create trigger trg_evento_pagamento
after insert on pagamentos
for each row execute function registrar_evento_pagamento();

create function registrar_evento_despesa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into reserva_eventos (reserva_id, tipo, descricao, funcionario_id)
  values (new.reserva_id, 'despesa',
          'Despesa lançada: ' || new.quantidade || '× ' || new.descricao ||
          ' — ' || formatar_brl(new.quantidade * new.valor_unitario),
          new.lancada_por);
  return new;
end;
$$;

create trigger trg_evento_despesa
after insert on despesas_extras
for each row execute function registrar_evento_despesa();

-- ============================================================
-- 9. Realtime: eventos transmitidos aos apps abertos (avisos)
-- ============================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table reserva_eventos;
  end if;
end $$;
