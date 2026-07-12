-- 0019 — Onboarding de nova pousada (Incremento 5/6 antecipado).
--
-- Cria uma pousada (tenant) + o primeiro admin dela num comando só. É ação de
-- SUPER-ADMIN (plano plataforma). Enquanto não há App da Plataforma, o João
-- chama via SQL Editor. Bootstrap do 1º super-admin também via SQL (ver README
-- do PR / instruções).

-- ============================================================
-- 1. Trigger de auth: tolerar criador SEM pousada (super-admin)
-- ============================================================
-- Antes: todo insert em auth.users criava uma linha em funcionarios carimbada
-- com a pousada do criador. No onboarding, o criador é o super-admin, que não
-- pertence a nenhuma pousada (pousada_do_usuario() = null) → quebraria o
-- NOT NULL. Agora: se o criador não tem pousada, NÃO cria a linha aqui — quem
-- chamou (criar_pousada_com_admin) insere o funcionário com a pousada certa.
create or replace function criar_funcionario_para_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pousada_do_usuario() is null then
    return new;
  end if;
  insert into funcionarios (id, nome, ativo, pousada_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.email, 'Funcionário'),
    false,
    pousada_do_usuario()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================================
-- 2. Função: cria pousada + primeiro admin (só super-admin)
-- ============================================================
create function criar_pousada_com_admin(
  p_slug text,
  p_nome text,
  p_admin_email text,
  p_admin_senha text,
  p_admin_nome text,
  p_endereco text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_pousada_id int;
  v_email text := lower(btrim(p_admin_email));
  v_uid uuid;
begin
  if not eh_super_admin() then
    raise exception 'Só super-admin pode criar pousadas' using errcode = '42501';
  end if;
  if btrim(coalesce(p_slug, '')) = '' or btrim(coalesce(p_nome, '')) = '' or v_email = '' then
    raise exception 'Preencha slug, nome e e-mail do admin' using errcode = '22004';
  end if;
  if length(coalesce(p_admin_senha, '')) < 6 then
    raise exception 'Senha do admin muito curta' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'E-mail já cadastrado — use outro para o admin da nova pousada'
      using errcode = '42501';
  end if;

  -- cria o tenant
  insert into pousadas (slug, nome_exibicao, endereco)
  values (btrim(p_slug), btrim(p_nome), nullif(btrim(p_endereco), ''))
  returning id into v_pousada_id;

  -- cria a conta do admin no Auth (e-mail já confirmado, senha definida)
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
    v_email, crypt(p_admin_senha, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nome', p_admin_nome),
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

  -- primeiro funcionário da pousada = admin ativo
  insert into funcionarios (id, nome, ativo, admin, email, pousada_id)
  values (v_uid, p_admin_nome, true, true, v_email, v_pousada_id);

  return jsonb_build_object(
    'pousada_id', v_pousada_id, 'slug', p_slug, 'admin_uid', v_uid, 'admin_email', v_email
  );
end;
$$;

grant execute on function criar_pousada_com_admin(text, text, text, text, text, text) to authenticated;
