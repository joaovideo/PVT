-- 0017 — Isolamento por tenant via RLS (Incremento 2 do ADR 0001).
--
-- ESTE É O PASSO DELICADO. Torna `pousada_id` obrigatório, faz o banco carimbar
-- o tenant automaticamente em cada insert e reescreve TODO o RLS para escopar
-- por pousada. Como a produção tem só o tenant #1 e o admin atual pertence a ele,
-- o comportamento continua idêntico para a pousada existente.
--
-- Estrutura das políticas:
--   operacional:  (funcionario_ativo()   and pousada_id = pousada_do_usuario()) or eh_super_admin()
--   admin:        (funcionario_eh_admin() and pousada_id = pousada_do_usuario()) or eh_super_admin()
-- O super-admin (plano plataforma, tabela separada) é a exceção explícita.

-- ============================================================
-- 1. Helpers de tenant e do plano plataforma
-- ============================================================
-- Pousada do usuário atual. security definer evita recursão de RLS (lê
-- funcionarios fora das políticas).
create function pousada_do_usuario()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select pousada_id from funcionarios where id = auth.uid() and ativo;
$$;

-- Plano plataforma: super-admin fica FORA de funcionarios, em tabela própria,
-- para que um admin de pousada nunca se auto-promova. Sem políticas → a via
-- normal (authenticated) não lê nem escreve; gerido pelo App da Plataforma.
create table plataforma_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  criado_em timestamptz not null default now()
);
alter table plataforma_admins enable row level security;

create function eh_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from plataforma_admins where user_id = auth.uid());
$$;

-- ============================================================
-- 2. Carimbo automático de pousada_id em cada insert (BEFORE INSERT)
-- ============================================================
-- Deixa o front e as funções existentes (criar_reserva etc.) inserirem sem
-- informar pousada_id: o banco preenche com a pousada do usuário. Um cliente
-- que tente forçar outro pousada_id é barrado pelo WITH CHECK das políticas.
create function definir_pousada_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.pousada_id is null then
    new.pousada_id := pousada_do_usuario();
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
  tabelas text[] := array[
    'funcionarios','quartos','config_pousada','hospedes','reservas',
    'reserva_segmentos','pagamentos','despesas_extras','reserva_eventos',
    'bloqueios','itens_extras_catalogo','categorias_itens','reservas_arquivadas'
  ];
begin
  foreach t in array tabelas loop
    execute format(
      'create trigger trg_pousada_id before insert on %I
       for each row execute function definir_pousada_id()', t);
    -- backfill já foi feito na 0016 → agora pode ser NOT NULL
    execute format('alter table %I alter column pousada_id set not null', t);
  end loop;
end $$;

-- ============================================================
-- 3. Reescrita do RLS: derruba TODAS as políticas e recria por tenant
-- ============================================================
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

do $$
declare
  t text;
  ativo text := '((funcionario_ativo() and pousada_id = pousada_do_usuario()) or eh_super_admin())';
  adm text := '((funcionario_eh_admin() and pousada_id = pousada_do_usuario()) or eh_super_admin())';
begin
  -- Operacional: qualquer funcionário ativo do tenant lê/escreve
  foreach t in array array[
    'hospedes','reservas','reserva_segmentos','pagamentos','despesas_extras','bloqueios'
  ] loop
    execute format('create policy %I on %I for select to authenticated using (%s)', t||'_sel', t, ativo);
    execute format('create policy %I on %I for insert to authenticated with check (%s)', t||'_ins', t, ativo);
    execute format('create policy %I on %I for update to authenticated using (%s) with check (%s)', t||'_upd', t, ativo, ativo);
  end loop;
  execute format('create policy %I on bloqueios for delete to authenticated using (%s)', 'bloqueios_del', ativo);
  -- reserva_eventos é append-only (inserts via trigger security definer) → só select
  execute format('create policy eventos_sel on reserva_eventos for select to authenticated using (%s)', ativo);

  -- Config/cadastros: leitura p/ ativo, escrita p/ admin
  foreach t in array array['quartos','itens_extras_catalogo','categorias_itens','funcionarios'] loop
    execute format('create policy %I on %I for select to authenticated using (%s)', t||'_sel', t, ativo);
    execute format('create policy %I on %I for insert to authenticated with check (%s)', t||'_ins', t, adm);
    execute format('create policy %I on %I for update to authenticated using (%s) with check (%s)', t||'_upd', t, adm, adm);
    execute format('create policy %I on %I for delete to authenticated using (%s)', t||'_del', t, adm);
  end loop;

  execute format('create policy config_sel on config_pousada for select to authenticated using (%s)', ativo);
  execute format('create policy config_upd on config_pousada for update to authenticated using (%s) with check (%s)', adm, adm);
  execute format('create policy arquivadas_sel on reservas_arquivadas for select to authenticated using (%s)', adm);
end $$;

-- ============================================================
-- 4. Funções security definer que furam o RLS → precisam checar o tenant
-- ============================================================
-- arquivar_e_excluir_reserva: como roda security definer (ignora RLS), sem esta
-- checagem um admin poderia apagar reserva de OUTRA pousada informando o id.
create or replace function arquivar_e_excluir_reserva(p_reserva_id int, p_motivo text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text;
  v_reserva reservas%rowtype;
  v_hospede_nome text;
  v_hospede_telefone text;
  v_total_pago numeric(10,2);
  v_bundle jsonb;
begin
  if not funcionario_eh_admin() then
    raise exception 'Só administradores podem excluir reservas' using errcode = '42501';
  end if;

  select * into v_reserva from reservas where id = p_reserva_id;
  if not found then
    raise exception 'Reserva não encontrada' using errcode = 'P0002';
  end if;

  -- Isolamento: a reserva tem que ser da pousada do admin (ou super-admin).
  if not (v_reserva.pousada_id = pousada_do_usuario() or eh_super_admin()) then
    raise exception 'Reserva de outra pousada' using errcode = '42501';
  end if;

  select nome into v_nome from funcionarios where id = v_uid;
  select nome, telefone into v_hospede_nome, v_hospede_telefone
    from hospedes where id = v_reserva.hospede_id;
  select coalesce(sum(valor), 0) into v_total_pago
    from pagamentos where reserva_id = p_reserva_id;

  v_bundle := jsonb_build_object(
    'reserva', to_jsonb(v_reserva),
    'hospede', (select to_jsonb(h) from hospedes h where h.id = v_reserva.hospede_id),
    'pagamentos', coalesce(
      (select jsonb_agg(to_jsonb(p) order by p.recebido_em) from pagamentos p
        where p.reserva_id = p_reserva_id), '[]'::jsonb),
    'despesas_extras', coalesce(
      (select jsonb_agg(to_jsonb(d) order by d.lancada_em) from despesas_extras d
        where d.reserva_id = p_reserva_id), '[]'::jsonb),
    'reserva_eventos', coalesce(
      (select jsonb_agg(to_jsonb(e) order by e.ocorrido_em) from reserva_eventos e
        where e.reserva_id = p_reserva_id), '[]'::jsonb),
    'reserva_segmentos', coalesce(
      (select jsonb_agg(to_jsonb(s)) from reserva_segmentos s
        where s.reserva_id = p_reserva_id), '[]'::jsonb)
  );

  insert into reservas_arquivadas (
    reserva_id, hospede_nome, hospede_telefone, data_checkin, data_checkout,
    status_original, valor_total, total_pago, motivo, dados,
    excluida_por, excluida_por_nome, pousada_id
  ) values (
    p_reserva_id, v_hospede_nome, v_hospede_telefone,
    v_reserva.data_checkin, v_reserva.data_checkout,
    v_reserva.status, v_reserva.valor_total, v_total_pago,
    nullif(btrim(p_motivo), ''), v_bundle, v_uid, v_nome, v_reserva.pousada_id
  );

  delete from pagamentos where reserva_id = p_reserva_id;
  delete from despesas_extras where reserva_id = p_reserva_id;
  delete from reservas where id = p_reserva_id;
end;
$$;

-- criar_ou_reativar_funcionario: também roda security definer. Impede que um
-- admin reative/redefina a senha de um funcionário de OUTRA pousada (mesmo
-- e-mail). A pousada do novo funcionário é a do admin (carimbada no upsert).
create or replace function criar_ou_reativar_funcionario(
  p_nome text,
  p_email text,
  p_senha text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email text := lower(btrim(p_email));
  v_uid uuid;
  v_reaproveitado boolean := false;
  v_pousada int := pousada_do_usuario();
  v_pousada_existente int;
begin
  if not funcionario_eh_admin() then
    raise exception 'Só administradores podem criar funcionários' using errcode = '42501';
  end if;
  if btrim(coalesce(p_nome, '')) = '' or v_email = '' then
    raise exception 'Preencha nome e e-mail' using errcode = '22004';
  end if;
  if length(coalesce(p_senha, '')) < 6 then
    raise exception 'Senha muito curta' using errcode = '22023';
  end if;

  select id into v_uid from auth.users where lower(email) = v_email limit 1;

  if v_uid is not null then
    -- Se já existe funcionário para essa conta em OUTRA pousada, recusa
    -- (não sequestrar/resetar senha de funcionário de outro tenant).
    select pousada_id into v_pousada_existente from funcionarios where id = v_uid;
    if v_pousada_existente is not null and v_pousada_existente <> v_pousada then
      raise exception 'E-mail já pertence a outra pousada' using errcode = '42501';
    end if;

    update auth.users set
      encrypted_password = crypt(p_senha, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                           || jsonb_build_object('nome', p_nome),
      updated_at = now()
    where id = v_uid;
    v_reaproveitado := true;
  else
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      reauthentication_token, phone_change, phone_change_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, crypt(p_senha, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nome', p_nome),
      '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_uid::text, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email),
      'email', now(), now(), now()
    );
  end if;

  -- pousada_id explícito = a do admin (não depende só do trigger de carimbo).
  insert into funcionarios (id, nome, ativo, email, pousada_id)
  values (v_uid, p_nome, true, v_email, v_pousada)
  on conflict (id) do update
    set nome = excluded.nome, ativo = true, email = excluded.email;

  return jsonb_build_object('ok', true, 'reaproveitado', v_reaproveitado);
end;
$$;
