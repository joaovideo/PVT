-- 0016 — Fundação multi-tenant (Incremento 1 do ADR 0001).
--
-- ADITIVO E NÃO-QUEBRA: cria a tabela `pousadas` (tenants, com branding
-- white-label), insere a pousada atual como tenant #1 e adiciona `pousada_id`
-- NULLABLE em todas as tabelas de domínio, preenchendo tudo com o tenant #1.
-- O RLS e o app NÃO mudam nesta fase — o sistema segue funcionando single-
-- tenant. Tornar `pousada_id` obrigatório e reescrever o RLS fica no Incremento
-- 2 (migration futura), aplicado com deploy coordenado e backup.

-- ============================================================
-- 1. Tabela de tenants + branding (ADR 0001, D4/D5)
-- ============================================================
create table pousadas (
  id serial primary key,
  slug text not null unique,          -- URL-safe, ex.: 'pousada-do-mar'
  nome_exibicao text not null,
  endereco text,
  logo_url text,                      -- aponta p/ o Storage (bucket branding)
  cor_primaria text,                  -- hex, ex.: '#1e293b' (token 'marca')
  cor_secundaria text,
  cor_fundo text,                     -- token 'fundo'
  ativo boolean not null default true,
  criada_em timestamptz not null default now()
);

-- Tenant #1 = a pousada atual. Primeira linha → id = 1 (a sequence avança
-- corretamente porque o id não é informado). João renomeia slug/nome depois.
insert into pousadas (slug, nome_exibicao)
values ('pousada-1', 'Pousada 1');

-- ============================================================
-- 2. pousada_id NULLABLE + índice + backfill (tenant #1) em cada tabela
-- ============================================================
do $$
declare
  t text;
  tabelas text[] := array[
    'funcionarios','quartos','config_pousada','hospedes','reservas',
    'reserva_segmentos','pagamentos','despesas_extras','reserva_eventos',
    'bloqueios','itens_extras_catalogo','categorias_itens','reservas_arquivadas'
  ];
begin
  foreach t in array tabelas loop
    execute format(
      'alter table %I add column pousada_id int references pousadas(id)', t);
    execute format('update %I set pousada_id = 1', t);
    execute format(
      'create index %I on %I (pousada_id)', t || '_pousada_idx', t);
  end loop;
end $$;
