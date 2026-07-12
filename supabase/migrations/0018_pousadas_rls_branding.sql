-- 0018 — RLS na tabela `pousadas` + view pública de branding (Incremento 3, Parte A).
--
-- Fecha o gap: a `pousadas` foi criada (0016) e passou pela reescrita de RLS
-- (0017) SEM políticas próprias — ou seja, com RLS desabilitado, qualquer
-- funcionário logado poderia ler nome/endereço/branding de TODAS as pousadas.
-- Não vazava nada ainda (só há 1 tenant), mas precisa ser fechado antes do 2º.
--
-- Também cria a view pública `pousada_publica` (só branding, por slug), para o
-- app pintar a tela de LOGIN com o logo/cores da pousada ANTES de autenticar.

-- ============================================================
-- 1. RLS na pousadas: funcionário vê a própria; super-admin vê todas
-- ============================================================
alter table pousadas enable row level security;

create policy pousadas_sel on pousadas for select to authenticated
  using (id = pousada_do_usuario() or eh_super_admin());

-- Editar branding: só admin da própria pousada (ou super-admin)
create policy pousadas_upd on pousadas for update to authenticated
  using ((funcionario_eh_admin() and id = pousada_do_usuario()) or eh_super_admin())
  with check ((funcionario_eh_admin() and id = pousada_do_usuario()) or eh_super_admin());

-- Criar/remover pousada (ciclo de vida do tenant) é ação da plataforma
create policy pousadas_ins on pousadas for insert to authenticated
  with check (eh_super_admin());
create policy pousadas_del on pousadas for delete to authenticated
  using (eh_super_admin());

-- ============================================================
-- 2. View pública de branding (por slug), para a tela de login
-- ============================================================
-- Roda como o dono (definer, padrão) → ignora o RLS acima de propósito: o
-- branding é semi-público (aparece na tela de login/reserva). Expõe SÓ os
-- campos de identidade visual — nada sensível, nem o id interno.
create view pousada_publica as
  select
    slug,
    nome_exibicao,
    endereco,
    logo_url,
    cor_primaria,
    cor_secundaria,
    cor_fundo
  from pousadas
  where ativo;

-- anon (não logado) e authenticated podem ler a view — é o que permite resolver
-- o branding pelo slug na URL antes do login.
grant select on pousada_publica to anon, authenticated;
