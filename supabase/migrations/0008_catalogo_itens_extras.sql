-- 0008 — Catálogo de itens extras (cardápio fixo)
-- Decisão do João (2026-07-09): em vez de digitar descrição+valor toda vez,
-- os itens (café extra, caldo, refrigerante, lanche...) são pré-cadastrados
-- no Admin com preço fixo; lançar uma despesa vira só escolher item + qtd.
-- despesas_extras continua guardando descrição/valor "congelados" no momento
-- do lançamento (histórico não muda se o preço do item for editado depois).

create table itens_extras_catalogo (
  id serial primary key,
  nome text not null,
  valor_unitario numeric(10,2) not null,
  ativo boolean not null default true
);

alter table itens_extras_catalogo enable row level security;

create policy itens_extras_select on itens_extras_catalogo
  for select to authenticated using (funcionario_ativo());
create policy itens_extras_insert on itens_extras_catalogo
  for insert to authenticated with check (funcionario_ativo());
create policy itens_extras_update on itens_extras_catalogo
  for update to authenticated using (funcionario_ativo()) with check (funcionario_ativo());
-- Sem delete: item sai de uso desativando (ativo=false), preservando o
-- histórico de despesas_extras que já referenciaram esse nome/valor.

insert into itens_extras_catalogo (nome, valor_unitario) values
  ('Café da manhã extra', 25.00),
  ('Caldo', 15.00),
  ('Refrigerante lata', 8.00),
  ('Água mineral', 5.00),
  ('Lanche natural', 18.00);
