-- 0003 — Índice de disponibilidade e constraint anti-overbooking
-- (docs/ESPECIFICACAO.md, seção 3, e Issue #2)

-- btree_gist permite usar '=' de inteiros dentro de EXCLUDE USING gist
create extension if not exists btree_gist;

-- Índice para as consultas de disponibilidade por quarto/período
create index reserva_segmentos_quarto_periodo_idx
  on reserva_segmentos (quarto_id, data_inicio, data_fim);

-- Uma constraint EXCLUDE não pode consultar outra tabela, então o estado
-- "reserva cancelada" é espelhado em cada segmento e mantido por triggers.
alter table reserva_segmentos
  add column cancelado boolean not null default false;

-- Segmento novo herda o estado da reserva
create function definir_cancelado_do_segmento()
returns trigger
language plpgsql
as $$
begin
  select (r.status = 'cancelada') into new.cancelado
  from reservas r
  where r.id = new.reserva_id;
  return new;
end;
$$;

create trigger trg_segmento_definir_cancelado
before insert or update of reserva_id on reserva_segmentos
for each row
execute function definir_cancelado_do_segmento();

-- Mudança de status da reserva propaga para os segmentos
create function espelhar_cancelamento_reserva()
returns trigger
language plpgsql
as $$
begin
  update reserva_segmentos
  set cancelado = (new.status = 'cancelada')
  where reserva_id = new.id;
  return new;
end;
$$;

create trigger trg_reserva_espelhar_cancelamento
after update of status on reservas
for each row
when (old.status is distinct from new.status)
execute function espelhar_cancelamento_reserva();

-- Anti-overbooking no nível do banco: segmentos ativos do mesmo quarto não
-- podem se sobrepor. daterange usa fim exclusivo [), então o dia do checkout
-- já pode receber outro hóspede.
alter table reserva_segmentos
  add constraint reserva_segmentos_sem_sobreposicao
  exclude using gist (
    quarto_id with =,
    daterange(data_inicio, data_fim) with &&
  ) where (not cancelado);
