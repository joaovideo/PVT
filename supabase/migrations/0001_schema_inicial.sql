-- 0001 — Schema inicial (docs/ESPECIFICACAO.md, seção 3)

-- Funcionários (vinculados ao Supabase Auth)
create table funcionarios (
  id uuid primary key references auth.users(id),
  nome text not null,
  ativo boolean not null default true
);

-- Quartos
create table quartos (
  id serial primary key,
  nome text not null,              -- ex: "Quarto 3 — Ipê"
  camas_casal int not null default 0,
  camas_solteiro int not null default 0,
  capacidade_max int not null,     -- pessoas
  observacoes text,
  ativo boolean not null default true
);

-- Tarifas por tipo de ocupação
create table tarifas (
  id serial primary key,
  quarto_id int not null references quartos(id),
  adultos int not null,            -- 1 = solteiro, 2 = casal...
  criancas int not null default 0, -- casal + criança etc.
  valor_diaria numeric(10,2) not null,
  unique (quarto_id, adultos, criancas)
);

-- Hóspedes
create table hospedes (
  id serial primary key,
  nome text not null,
  telefone text,
  email text,
  documento text
);

-- Reserva (uma estadia; pode envolver mais de um quarto)
create table reservas (
  id serial primary key,
  hospede_id int not null references hospedes(id),
  data_checkin date not null,
  data_checkout date not null,
  hora_chegada_prevista time,      -- que horas a pessoa chega
  adultos int not null default 1,
  criancas int not null default 0,
  valor_total numeric(10,2) not null,
  status text not null default 'confirmada'
    check (status in ('pre-reserva','confirmada','checkin','checkout','cancelada')),
  criada_por uuid not null references funcionarios(id),
  criada_em timestamptz not null default now(),
  observacoes text
);

-- Segmentos: qual quarto em qual trecho da estadia.
-- Reserva simples = 1 segmento. Combinação de quartos = N segmentos.
create table reserva_segmentos (
  id serial primary key,
  reserva_id int not null references reservas(id) on delete cascade,
  quarto_id int not null references quartos(id),
  data_inicio date not null,
  data_fim date not null,          -- exclusiva (dia da saída do quarto)
  check (data_fim > data_inicio)
);

-- Pagamentos (parciais ou totais)
create table pagamentos (
  id serial primary key,
  reserva_id int not null references reservas(id),
  valor numeric(10,2) not null,
  metodo text not null check (metodo in ('pix','dinheiro','cartao','transferencia','outro')),
  recebido_por uuid not null references funcionarios(id),
  recebido_em timestamptz not null default now(),
  observacao text
);
