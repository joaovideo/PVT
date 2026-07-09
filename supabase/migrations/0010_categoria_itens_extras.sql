-- 0010 — Categoria no catálogo de itens extras
-- Prepara o catálogo para importar um cardápio real (~50 itens) agrupado
-- por categoria. default 'Outros' porque os itens já existentes (0008) e o
-- formulário atual não informam categoria — sem o default, o backfill e os
-- inserts existentes quebrariam.

alter table itens_extras_catalogo
  add column categoria text not null default 'Outros';

alter table itens_extras_catalogo
  add constraint itens_extras_categoria_valida
  check (categoria in (
    'Pratos', 'Risotos', 'Caldos', 'Porções', 'Pizzas', 'Bebidas', 'Outros'
  ));

-- Categoriza os itens genéricos do seed inicial (os demais seguem 'Outros').
update itens_extras_catalogo set categoria = 'Caldos'  where nome = 'Caldo';
update itens_extras_catalogo set categoria = 'Bebidas' where nome in ('Refrigerante lata', 'Água mineral');
