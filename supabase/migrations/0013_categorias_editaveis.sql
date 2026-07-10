-- 0013 — Categorias de itens extras editáveis pelo Admin
-- Antes as categorias eram uma lista fixa: o CHECK da 0010 no banco e a const
-- CATEGORIAS_ITENS no frontend. Agora viram tabela própria, para o admin
-- criar/renomear/reordenar sem depender de deploy.
--
-- A categoria no item continua sendo TEXTO (não trocamos por id) para não
-- reescrever como o frontend lê `item.categoria`. A integridade vem de uma FK
-- do texto para `categorias_itens.nome`:
--   ON UPDATE CASCADE  → renomear a categoria propaga para todos os itens
--   ON DELETE RESTRICT → o banco impede apagar uma categoria em uso

-- 1. Tabela de categorias
create table categorias_itens (
  id serial primary key,
  nome text not null unique,
  ordem int not null default 0
);

alter table categorias_itens enable row level security;

-- Leitura para qualquer funcionário ativo; escrita só admin (mesmo padrão das
-- outras tabelas de configuração — ver 0004 e 0009).
create policy categorias_select on categorias_itens for select to authenticated
  using (funcionario_ativo());
create policy categorias_insert on categorias_itens for insert to authenticated
  with check (funcionario_eh_admin());
create policy categorias_update on categorias_itens for update to authenticated
  using (funcionario_eh_admin()) with check (funcionario_eh_admin());
create policy categorias_delete on categorias_itens for delete to authenticated
  using (funcionario_eh_admin());

-- 2. Semente com as 7 categorias que já existiam, na ordem de exibição atual.
insert into categorias_itens (nome, ordem) values
  ('Pratos', 1), ('Risotos', 2), ('Caldos', 3), ('Porções', 4),
  ('Pizzas', 5), ('Bebidas', 6), ('Outros', 7);

-- 3. Solta a trava fixa da 0010 e amarra a categoria do item à tabela.
-- Todos os itens existentes já têm categoria entre as 7 (o CHECK da 0010
-- garantia isso), então a FK entra sem violação.
alter table itens_extras_catalogo drop constraint itens_extras_categoria_valida;

alter table itens_extras_catalogo
  add constraint itens_extras_categoria_fk
  foreign key (categoria) references categorias_itens (nome)
  on update cascade on delete restrict;

-- 4. 'Outros' é o fallback (default da coluna categoria). Um gatilho impede
-- apagá-lo, para o default nunca apontar para uma categoria inexistente.
create function protege_categoria_outros()
returns trigger
language plpgsql
as $$
begin
  if old.nome = 'Outros' then
    raise exception 'A categoria "Outros" não pode ser apagada' using errcode = '23503';
  end if;
  return old;
end;
$$;

create trigger nao_apagar_outros
  before delete on categorias_itens
  for each row execute function protege_categoria_outros();
