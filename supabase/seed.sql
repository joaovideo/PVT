-- Seed de desenvolvimento — dados de exemplo coerentes com as tarifas.
-- ATENÇÃO: os usuários em auth.users existem só para satisfazer a FK de
-- funcionarios em ambiente de desenvolvimento. Logins reais devem ser
-- criados pelo Supabase Auth (Issue #3).

create extension if not exists pgcrypto;

-- 2 funcionários (senha de desenvolvimento: senha123)
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'ana@pousada.dev',
   crypt('senha123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"nome":"Ana Ribeiro"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'bruno@pousada.dev',
   crypt('senha123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"nome":"Bruno Costa"}', now(), now());

-- A partir da migration 0004 o trigger em auth.users já cria estas linhas
-- (como ativo=false a partir da 0009); o on conflict garante que a equipe
-- de demonstração fique ativa e admin. O seed roda após todas as migrations.
insert into funcionarios (id, nome, ativo, admin, email) values
  ('11111111-1111-1111-1111-111111111111', 'Ana Ribeiro', true, true, 'ana@pousada.dev'),
  ('22222222-2222-2222-2222-222222222222', 'Bruno Costa', true, true, 'bruno@pousada.dev')
on conflict (id) do update
  set nome = excluded.nome, ativo = excluded.ativo,
      admin = excluded.admin, email = excluded.email;

-- 6 quartos variados
insert into quartos (nome, camas_casal, camas_solteiro, capacidade_max, observacoes) values
  ('Quarto 1 — Ipê',       1, 0, 2, 'Vista para o jardim'),
  ('Quarto 2 — Jasmim',    1, 1, 3, null),
  ('Quarto 3 — Lavanda',   0, 2, 2, 'Térreo, acessível'),
  ('Quarto 4 — Manacá',    1, 2, 4, 'Família'),
  ('Quarto 5 — Orquídea',  1, 0, 2, 'Varanda com rede'),
  ('Quarto 6 — Primavera', 2, 1, 5, 'Suíte master');

-- Preço é global (migration 0006): valor por adulto e por criança na
-- config_pousada, em 3 níveis. Ajusta os valores de demonstração aqui.
update config_pousada set
  adulto_valor_desconto = 100.00, adulto_valor_normal = 120.00, adulto_valor_full = 150.00,
  crianca_valor_desconto = 40.00, crianca_valor_normal = 50.00, crianca_valor_full = 60.00,
  crianca_idade_max = 12;

-- 3 hóspedes
insert into hospedes (nome, telefone, email, documento) values
  ('Carlos Silva', '(24) 99911-0001', 'carlos.silva@email.com', '111.222.333-44'),
  ('Maria Souza',  '(21) 99922-0002', 'maria.souza@email.com',  '555.666.777-88'),
  ('Pedro Lima',   '(11) 99933-0003', null,                     '999.888.777-66');

-- Reserva 1 — PAGA: Carlos, Quarto 1, casal, 3 diárias × 260 = 780
insert into reservas (hospede_id, data_checkin, data_checkout, hora_chegada_prevista,
                      adultos, criancas, valor_total, status, criada_por) values
  (1, '2026-07-10', '2026-07-13', '14:00', 2, 0, 780.00, 'confirmada',
   '11111111-1111-1111-1111-111111111111');
insert into reserva_segmentos (reserva_id, quarto_id, data_inicio, data_fim) values
  (1, 1, '2026-07-10', '2026-07-13');
insert into pagamentos (reserva_id, valor, metodo, recebido_por) values
  (1, 780.00, 'pix', '11111111-1111-1111-1111-111111111111');

-- Reserva 2 — PARCIAL: Maria, Quarto 4, casal + 1 criança,
-- 3 diárias × (320 casal + 50 criança) = 1110
insert into reservas (hospede_id, data_checkin, data_checkout, hora_chegada_prevista,
                      adultos, criancas, valor_total, status, criada_por) values
  (2, '2026-07-15', '2026-07-18', '16:30', 2, 1, 1110.00, 'confirmada',
   '11111111-1111-1111-1111-111111111111');
insert into reserva_segmentos (reserva_id, quarto_id, data_inicio, data_fim) values
  (2, 4, '2026-07-15', '2026-07-18');
insert into pagamentos (reserva_id, valor, metodo, recebido_por, observacao) values
  (2, 500.00, 'dinheiro', '22222222-2222-2222-2222-222222222222', 'Sinal na reserva');

-- Reserva 3 — NÃO PAGA: Pedro, Quarto 3, 2 adultos, 2 diárias × 240 = 480
insert into reservas (hospede_id, data_checkin, data_checkout, hora_chegada_prevista,
                      adultos, criancas, valor_total, status, criada_por) values
  (3, '2026-07-20', '2026-07-22', '12:00', 2, 0, 480.00, 'confirmada',
   '22222222-2222-2222-2222-222222222222');
insert into reserva_segmentos (reserva_id, quarto_id, data_inicio, data_fim) values
  (3, 3, '2026-07-20', '2026-07-22');

-- Reserva 4 — COMBINAÇÃO de 2 quartos (1 troca): Carlos, casal,
-- Quarto 2 (24→26, 2 × 290 = 580) + Quarto 5 (26→29, 3 × 280 = 840) = 1420
insert into reservas (hospede_id, data_checkin, data_checkout, hora_chegada_prevista,
                      adultos, criancas, valor_total, status, criada_por, observacoes) values
  (1, '2026-07-24', '2026-07-29', '15:00', 2, 0, 1420.00, 'confirmada',
   '22222222-2222-2222-2222-222222222222', 'Troca de quarto no dia 26/07');
insert into reserva_segmentos (reserva_id, quarto_id, data_inicio, data_fim) values
  (4, 2, '2026-07-24', '2026-07-26'),
  (4, 5, '2026-07-26', '2026-07-29');
insert into pagamentos (reserva_id, valor, metodo, recebido_por, observacao) values
  (4, 700.00, 'transferencia', '22222222-2222-2222-2222-222222222222', 'Sinal 50%');

-- Despesas extras de exemplo (consumo na conta)
insert into despesas_extras (reserva_id, descricao, quantidade, valor_unitario, lancada_por) values
  (1, 'Caldo verde', 2, 15.00, '22222222-2222-2222-2222-222222222222'),
  (2, 'Refrigerante lata', 1, 8.00, '11111111-1111-1111-1111-111111111111');

-- Bloqueio de exemplo: Quarto 6 em manutenção
insert into bloqueios (quarto_id, data_inicio, data_fim, motivo, criado_por) values
  (6, '2026-08-10', '2026-08-15', 'Manutenção do ar-condicionado',
   '11111111-1111-1111-1111-111111111111');
