-- Stub mínimo do ambiente Supabase para validar/ensaiar migrations em Postgres
-- puro (Docker). NÃO é o schema de produção — só o suficiente para as migrations
-- e um dump do schema `public` aplicarem sem o resto da stack Supabase.
--
-- Cobre o que as migrations do PVT referenciam de fora do public:
--   auth.users, auth.identities, auth.uid(), roles anon/authenticated/
--   service_role e pgcrypto (extensions).

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

create schema if not exists auth;

-- Colunas cobrem o INSERT/UPDATE feito pela função criar_ou_reativar_funcionario
-- (migration 0015) e o que os triggers/updates leem.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid,
  aud text,
  role text,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  confirmation_token text,
  recovery_token text,
  email_change text,
  email_change_token_new text,
  email_change_token_current text,
  reauthentication_token text,
  phone_change text,
  phone_change_token text
);

create table if not exists auth.identities (
  id uuid primary key default gen_random_uuid(),
  provider_id text,
  user_id uuid,
  identity_data jsonb,
  provider text,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);

-- Referenciada por RLS e por funções security definer. Stub retorna null.
create or replace function auth.uid() returns uuid language sql stable as $$
  select null::uuid
$$;
