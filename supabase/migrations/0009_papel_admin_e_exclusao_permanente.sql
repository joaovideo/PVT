-- 0009 — Papel admin, exclusão real de quartos/funcionários/itens/bloqueios,
-- e log de auditoria permanente e independente de exclusões.
--
-- Decisão do João (2026-07-09): precisa dar para apagar quartos e
-- funcionários de vez, mas o log (reserva_eventos) e os registros
-- históricos (pagamentos, despesas, segmentos) NUNCA podem sumir nem
-- ficar sem sentido — viram a auditoria permanente do sistema.
--
-- Estratégia: "congelar" o nome (funcionário/quarto) como texto no
-- momento de cada ação, e afrouxar as chaves estrangeiras para
-- ON DELETE SET NULL em vez de bloquear a exclusão. O texto congelado
-- garante que o histórico continue legível mesmo depois que a linha
-- original (funcionário ou quarto) for apagada.

-- ============================================================
-- 1. Papel admin + e-mail de referência
-- ============================================================
alter table funcionarios add column admin boolean not null default false;

-- E-mail de referência (cópia do login, guardado aqui para o admin poder
-- disparar redefinição de senha). NÃO é o login em si — o e-mail de
-- autenticação vive no Supabase Auth; alterar este campo não muda o login.
alter table funcionarios add column email text;
update funcionarios f set email = u.email from auth.users u where u.id = f.id;

-- Funcionários já existentes (equipe de confiança atual) nascem admin;
-- só cadastros NOVOS a partir de agora nascem comuns.
update funcionarios set admin = true where ativo = true;

create function funcionario_eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from funcionarios f
    where f.id = auth.uid() and f.ativo and f.admin
  );
$$;

-- ============================================================
-- 2. Corrige falha de segurança: cadastro novo nasce INATIVO
-- (antes: todo signUp() virava ativo=true automaticamente — qualquer
-- pessoa com a anon key, que é pública por design, podia se
-- autocadastrar e ganhar acesso total. Agora só um admin ativa.)
-- ============================================================
create or replace function criar_funcionario_para_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into funcionarios (id, nome, ativo, admin, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.email, 'Funcionário'),
    false,
    false,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================================
-- 3. Colunas de "nome congelado" (snapshot no momento da ação)
-- ============================================================
alter table reservas add column criada_por_nome text;
alter table pagamentos add column recebido_por_nome text;
alter table despesas_extras add column lancada_por_nome text;
alter table bloqueios add column criado_por_nome text;
alter table bloqueios add column quarto_nome text;
alter table reserva_segmentos add column quarto_nome text;

-- Backfill dos dados já existentes
update reservas r set criada_por_nome = f.nome
  from funcionarios f where f.id = r.criada_por and r.criada_por_nome is null;
update pagamentos p set recebido_por_nome = f.nome
  from funcionarios f where f.id = p.recebido_por and p.recebido_por_nome is null;
update despesas_extras d set lancada_por_nome = f.nome
  from funcionarios f where f.id = d.lancada_por and d.lancada_por_nome is null;
update bloqueios b set criado_por_nome = f.nome
  from funcionarios f where f.id = b.criado_por and b.criado_por_nome is null;
update bloqueios b set quarto_nome = q.nome
  from quartos q where q.id = b.quarto_id and b.quarto_nome is null;
update reserva_segmentos s set quarto_nome = q.nome
  from quartos q where q.id = s.quarto_id and s.quarto_nome is null;

-- Triggers: preenche o snapshot automaticamente em toda linha nova
create function preencher_snapshot_reserva()
returns trigger language plpgsql as $$
begin
  select nome into new.criada_por_nome from funcionarios where id = new.criada_por;
  return new;
end; $$;
create trigger trg_snapshot_reserva
  before insert on reservas for each row execute function preencher_snapshot_reserva();

create function preencher_snapshot_pagamento()
returns trigger language plpgsql as $$
begin
  select nome into new.recebido_por_nome from funcionarios where id = new.recebido_por;
  return new;
end; $$;
create trigger trg_snapshot_pagamento
  before insert on pagamentos for each row execute function preencher_snapshot_pagamento();

create function preencher_snapshot_despesa()
returns trigger language plpgsql as $$
begin
  select nome into new.lancada_por_nome from funcionarios where id = new.lancada_por;
  return new;
end; $$;
create trigger trg_snapshot_despesa
  before insert on despesas_extras for each row execute function preencher_snapshot_despesa();

create function preencher_snapshot_bloqueio()
returns trigger language plpgsql as $$
begin
  select nome into new.criado_por_nome from funcionarios where id = new.criado_por;
  select nome into new.quarto_nome from quartos where id = new.quarto_id;
  return new;
end; $$;
create trigger trg_snapshot_bloqueio
  before insert on bloqueios for each row execute function preencher_snapshot_bloqueio();

create function preencher_snapshot_segmento()
returns trigger language plpgsql as $$
begin
  select nome into new.quarto_nome from quartos where id = new.quarto_id;
  return new;
end; $$;
create trigger trg_snapshot_segmento
  before insert on reserva_segmentos for each row execute function preencher_snapshot_segmento();

-- Trigger de reserva_eventos (migration 0005) passa a incluir o nome
-- diretamente no texto — já é texto livre, só falta o nome nele.
create or replace function registrar_evento_criacao()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_nome text;
begin
  select nome into v_nome from funcionarios where id = new.criada_por;
  insert into reserva_eventos (reserva_id, tipo, descricao, funcionario_id)
  values (new.id, 'criacao',
          'Reserva criada (nível ' || new.nivel_preco || ') — ' || coalesce(v_nome, 'funcionário removido'),
          new.criada_por);
  return new;
end; $$;

create or replace function registrar_evento_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare texto text; v_nome text;
begin
  texto := case new.status
    when 'checkin'     then 'Check-in realizado'
    when 'checkout'    then 'Check-out realizado'
    when 'cancelada'   then 'Reserva cancelada'
    when 'confirmada'  then 'Reserva confirmada'
    when 'pre-reserva' then 'Marcada como pré-reserva'
    else 'Status alterado para ' || new.status
  end;
  select nome into v_nome from funcionarios where id = auth.uid();
  insert into reserva_eventos (reserva_id, tipo, descricao, funcionario_id)
  values (new.id, 'status', texto || ' — ' || coalesce(v_nome, 'funcionário removido'), auth.uid());
  return new;
end; $$;

create or replace function registrar_evento_pagamento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into reserva_eventos (reserva_id, tipo, descricao, funcionario_id)
  values (new.reserva_id, 'pagamento',
          'Pagamento recebido: ' || formatar_brl(new.valor) || ' via ' || new.metodo ||
          ' — ' || coalesce(new.recebido_por_nome, 'funcionário removido'),
          new.recebido_por);
  return new;
end; $$;

create or replace function registrar_evento_despesa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into reserva_eventos (reserva_id, tipo, descricao, funcionario_id)
  values (new.reserva_id, 'despesa',
          'Despesa lançada: ' || new.quantidade || '× ' || new.descricao ||
          ' — ' || formatar_brl(new.quantidade * new.valor_unitario) ||
          ' — ' || coalesce(new.lancada_por_nome, 'funcionário removido'),
          new.lancada_por);
  return new;
end; $$;

-- ============================================================
-- 4. Afrouxa as chaves estrangeiras: ON DELETE SET NULL em vez de
-- bloquear a exclusão de quartos/funcionários
-- ============================================================
alter table reservas alter column criada_por drop not null;
alter table reservas drop constraint reservas_criada_por_fkey;
alter table reservas add constraint reservas_criada_por_fkey
  foreign key (criada_por) references funcionarios(id) on delete set null;

alter table pagamentos alter column recebido_por drop not null;
alter table pagamentos drop constraint pagamentos_recebido_por_fkey;
alter table pagamentos add constraint pagamentos_recebido_por_fkey
  foreign key (recebido_por) references funcionarios(id) on delete set null;

alter table despesas_extras alter column lancada_por drop not null;
alter table despesas_extras drop constraint despesas_extras_lancada_por_fkey;
alter table despesas_extras add constraint despesas_extras_lancada_por_fkey
  foreign key (lancada_por) references funcionarios(id) on delete set null;

alter table bloqueios alter column criado_por drop not null;
alter table bloqueios drop constraint bloqueios_criado_por_fkey;
alter table bloqueios add constraint bloqueios_criado_por_fkey
  foreign key (criado_por) references funcionarios(id) on delete set null;

alter table bloqueios alter column quarto_id drop not null;
alter table bloqueios drop constraint bloqueios_quarto_id_fkey;
alter table bloqueios add constraint bloqueios_quarto_id_fkey
  foreign key (quarto_id) references quartos(id) on delete set null;

alter table reserva_segmentos alter column quarto_id drop not null;
alter table reserva_segmentos drop constraint reserva_segmentos_quarto_id_fkey;
alter table reserva_segmentos add constraint reserva_segmentos_quarto_id_fkey
  foreign key (quarto_id) references quartos(id) on delete set null;

alter table reserva_eventos drop constraint reserva_eventos_funcionario_id_fkey;
alter table reserva_eventos add constraint reserva_eventos_funcionario_id_fkey
  foreign key (funcionario_id) references funcionarios(id) on delete set null;

-- ============================================================
-- 5. RLS: exclusão de quartos/funcionários/itens só para admin;
-- escrita (insert/update) em quartos/valores/cardápio só para admin
-- (bloqueios continuam abertos a qualquer funcionário ativo — ação
-- operacional do dia a dia, não de configuração)
-- ============================================================
create policy quartos_delete on quartos for delete to authenticated
  using (funcionario_eh_admin());
create policy funcionarios_delete on funcionarios for delete to authenticated
  using (funcionario_eh_admin());
create policy itens_extras_delete on itens_extras_catalogo for delete to authenticated
  using (funcionario_eh_admin());

drop policy quartos_insert on quartos;
create policy quartos_insert on quartos for insert to authenticated
  with check (funcionario_eh_admin());
drop policy quartos_update on quartos;
create policy quartos_update on quartos for update to authenticated
  using (funcionario_eh_admin()) with check (funcionario_eh_admin());

drop policy config_update on config_pousada;
create policy config_update on config_pousada for update to authenticated
  using (funcionario_eh_admin()) with check (funcionario_eh_admin());

drop policy itens_extras_insert on itens_extras_catalogo;
create policy itens_extras_insert on itens_extras_catalogo for insert to authenticated
  with check (funcionario_eh_admin());
drop policy itens_extras_update on itens_extras_catalogo;
create policy itens_extras_update on itens_extras_catalogo for update to authenticated
  using (funcionario_eh_admin()) with check (funcionario_eh_admin());

drop policy funcionarios_update on funcionarios;
create policy funcionarios_update on funcionarios for update to authenticated
  using (funcionario_eh_admin()) with check (funcionario_eh_admin());
