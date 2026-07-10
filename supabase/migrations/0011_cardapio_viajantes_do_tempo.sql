-- 0011 — Cardápio da Pousada Viajantes do Tempo (Cunha-SP)
-- Importa ~50 itens do cardápio impresso para itens_extras_catalogo,
-- usando a coluna `categoria` criada em 0010. Nomes fiéis ao cardápio.
-- Extraído de fotos (2026-07-09). Duplicatas exatas do cardápio
-- (Risoto de camarão/palmito repetidos) foram removidas.

-- ⚠️ CONFERIR ANTES DE RODAR: dois preços de CALDOS ficaram ilegíveis na foto
--    - Feijão: lido como 20,00 (parecia "29" — confirmar)
--    - Lentilha: sem preço legível — assumido 25,00 (confirmar)

insert into itens_extras_catalogo (nome, valor_unitario, categoria) values
  -- Pratos diversos (individuais)
  ('Costela de porco frita, arroz e mandioca', 40.00, 'Pratos'),
  ('Filé de frango à milanesa, arroz e fritas ou mandioca frita', 25.00, 'Pratos'),
  ('Filé de frango à parmegiana, arroz, fritas ou mandioca frita', 30.00, 'Pratos'),
  ('Frango caipira ao molho, arroz e mandioca frita', 55.00, 'Pratos'),
  ('Joelho de porco, arroz e mandioca (serve 2 pessoas)', 80.00, 'Pratos'),
  ('Macarrão alho e óleo', 30.00, 'Pratos'),
  ('Macarrão à bolonhesa', 35.00, 'Pratos'),
  ('Nhoque de batata doce à bolonhesa', 35.00, 'Pratos'),
  ('Nhoque com peito de frango desfiado', 35.00, 'Pratos'),
  ('Nhoque de batata doce ao sugo', 30.00, 'Pratos'),
  ('Porco na lata, com arroz e mandioca frita', 40.00, 'Pratos'),
  ('Torresmo, arroz e fritas ou mandioca frita', 40.00, 'Pratos'),
  ('Truta com alcaparras, cogumelo, arroz, fritas ou mandioca frita', 50.00, 'Pratos'),
  ('Truta à Belle meunière (arroz, fritas ou refogado de cenoura com brócolis)', 65.00, 'Pratos'),
  ('Truta com risoto de pinhão', 65.00, 'Pratos'),
  ('Truta com nozes, shitake, arroz, fritas ou mandioca', 50.00, 'Pratos'),
  ('Torresmo, arroz, fritas', 40.00, 'Pratos'),

  -- Risotos
  ('Risoto de alho poró com gorgonzola', 35.00, 'Risotos'),
  ('Risoto à carbonara', 35.00, 'Risotos'),
  ('Risoto de camarão', 45.00, 'Risotos'),
  ('Risoto de palmito', 35.00, 'Risotos'),
  ('Risoto de queijo', 30.00, 'Risotos'),
  ('Risoto de tomate com manjericão', 30.00, 'Risotos'),
  ('Risoto de shitake', 30.00, 'Risotos'),
  ('Risoto de frango', 35.00, 'Risotos'),

  -- Caldos
  ('Abóbora cabotchá', 20.00, 'Caldos'),
  ('Caldo verde', 25.00, 'Caldos'),
  ('Feijão', 20.00, 'Caldos'),        -- ⚠️ confirmar (parecia 29,00)
  ('Mandioca', 20.00, 'Caldos'),
  ('Mandioquinha', 25.00, 'Caldos'),
  ('Mocotó', 25.00, 'Caldos'),
  ('Ervilha', 25.00, 'Caldos'),
  ('Canjiquinha', 25.00, 'Caldos'),
  ('Lentilha', 25.00, 'Caldos'),      -- ⚠️ confirmar (preço ilegível na foto)

  -- Pizzas
  ('Atum', 70.00, 'Pizzas'),
  ('Calabresa', 65.00, 'Pizzas'),
  ('Frango com mussarela', 70.00, 'Pizzas'),
  ('Margherita', 65.00, 'Pizzas'),
  ('Mussarela', 65.00, 'Pizzas'),
  ('Napolitana', 65.00, 'Pizzas'),
  ('Pepperoni', 70.00, 'Pizzas'),
  ('Rúcula com tomate seco', 70.00, 'Pizzas'),
  ('Três queijos', 70.00, 'Pizzas'),

  -- Porções
  ('Batata frita', 25.00, 'Porções'),
  ('Calabresa frita acebolada', 30.00, 'Porções'),
  ('Frango à passarinho', 30.00, 'Porções'),
  ('Mandioca frita', 25.00, 'Porções'),
  ('Mesclado (mandioca frita / torresmo)', 28.00, 'Porções'),
  ('Queijo branco', 35.00, 'Porções'),
  ('Torresmo', 48.00, 'Porções');

-- Opcional — desativar os 5 itens genéricos do seed 0008 (era a decisão
-- inicial). Na 0010 você categorizou Caldo/Refri/Água, o que sugere mantê-los;
-- por isso deixei COMENTADO. Descomente se quiser o cardápio "limpo":
-- update itens_extras_catalogo set ativo = false
--   where nome in ('Café da manhã extra', 'Caldo', 'Refrigerante lata',
--                  'Água mineral', 'Lanche natural');
