-- 0004 — Row Level Security e criação automática de funcionários (Issue #3)

-- Função auxiliar: o usuário autenticado é um funcionário ativo?
-- SECURITY DEFINER evita recursão de RLS ao consultar a própria tabela
-- funcionarios (a função roda como dona do schema, fora das políticas).
create function funcionario_ativo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from funcionarios f
    where f.id = auth.uid()
      and f.ativo
  );
$$;

-- Política única em todas as tabelas: apenas funcionário ativo autenticado
-- pode select/insert/update. DELETE não recebe política em nenhuma tabela —
-- com RLS habilitado isso o bloqueia por padrão (em reservas e pagamentos,
-- usar status 'cancelada' e estorno em vez de apagar).
do $$
declare
  t text;
begin
  foreach t in array array[
    'funcionarios','quartos','tarifas','hospedes',
    'reservas','reserva_segmentos','pagamentos'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for select to authenticated using (funcionario_ativo())',
      t || '_select', t);
    execute format(
      'create policy %I on %I for insert to authenticated with check (funcionario_ativo())',
      t || '_insert', t);
    execute format(
      'create policy %I on %I for update to authenticated using (funcionario_ativo()) with check (funcionario_ativo())',
      t || '_update', t);
  end loop;
end $$;

-- Sem isto a view roda com os privilégios do dono (postgres) e vazaria os
-- dados de reservas/pagamentos mesmo com RLS habilitado nas tabelas.
alter view reservas_financeiro set (security_invoker = true);

-- Novo usuário no Supabase Auth ganha automaticamente a linha em funcionarios
create function criar_funcionario_para_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into funcionarios (id, nome, ativo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.email, 'Funcionário'),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_criar_funcionario_novo_usuario
after insert on auth.users
for each row
execute function criar_funcionario_para_novo_usuario();
