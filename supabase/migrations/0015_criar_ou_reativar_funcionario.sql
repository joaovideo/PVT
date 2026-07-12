-- 0015 — Criar/reativar funcionário direto no banco, com senha definida pelo admin.
--
-- Contexto: o cadastro via supabase.auth.signUp() dá "sucesso falso" quando o
-- e-mail já existe no Auth (ex.: funcionário apagado — o app só remove a linha
-- em `funcionarios`, não o auth.users). Esta função resolve isso sem Edge
-- Function: roda como security definer, valida que o chamador é admin e grava
-- a senha (bcrypt via pgcrypto) direto em auth.users.
--
-- ATENÇÃO: escreve no schema `auth` do Supabase — atalho pragmático. Se um dia
-- o GoTrue mudar o schema de auth.users/auth.identities, revisar esta função.
-- O caso comum (e-mail já existente) só faz UPDATE de senha, que é estável.

create extension if not exists pgcrypto with schema extensions;

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
    -- Conta já existe no Auth: reaproveita, redefine a senha e confirma o e-mail.
    update auth.users set
      encrypted_password = crypt(p_senha, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                           || jsonb_build_object('nome', p_nome),
      updated_at = now()
    where id = v_uid;
    v_reaproveitado := true;
  else
    -- Conta nova. Os campos de token vão como '' (não NULL) para não quebrar o
    -- login do GoTrue, que lê essas colunas como texto.
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

  -- Grava/atualiza a linha em funcionarios já ATIVA. Omitir `admin` preserva o
  -- valor atual num conflito e usa o default (false) num insert novo. O trigger
  -- de auth.users (0009) pode ter inserido a linha inativa; o upsert a ativa.
  insert into funcionarios (id, nome, ativo, email)
  values (v_uid, p_nome, true, v_email)
  on conflict (id) do update
    set nome = excluded.nome, ativo = true, email = excluded.email;

  return jsonb_build_object('ok', true, 'reaproveitado', v_reaproveitado);
end;
$$;

grant execute on function criar_ou_reativar_funcionario(text, text, text) to authenticated;
