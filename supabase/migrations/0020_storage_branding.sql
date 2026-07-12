-- 0020 — Bucket de Storage para o logo das pousadas (Inc 3 — upload de logo).
--
-- Bucket `branding` público (o logo aparece na tela de login/cabeçalho via URL
-- pública). Escrita restrita: cada admin só mexe na pasta da PRÓPRIA pousada,
-- cujo caminho é '<pousada_id>/...'. Leitura pública vem do bucket ser public.

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Escrita (insert/update/delete): admin da pousada, só na sua pasta.
create policy branding_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'branding'
    and funcionario_eh_admin()
    and (storage.foldername(name))[1] = pousada_do_usuario()::text
  );

create policy branding_update on storage.objects for update to authenticated
  using (
    bucket_id = 'branding'
    and funcionario_eh_admin()
    and (storage.foldername(name))[1] = pousada_do_usuario()::text
  )
  with check (
    bucket_id = 'branding'
    and funcionario_eh_admin()
    and (storage.foldername(name))[1] = pousada_do_usuario()::text
  );

create policy branding_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'branding'
    and funcionario_eh_admin()
    and (storage.foldername(name))[1] = pousada_do_usuario()::text
  );
