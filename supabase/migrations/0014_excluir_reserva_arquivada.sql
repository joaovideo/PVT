-- 0014 — Exclusão de reserva pelo admin, com arquivamento do histórico.
--
-- Decisão do João (2026-07-12): o admin pode excluir QUALQUER reserva. A
-- reserva sai das telas/mapa (libera o quarto), mas o histórico financeiro
-- completo (reserva, hóspede, pagamentos, despesas, eventos e segmentos) é
-- copiado para uma tabela de arquivo ANTES de apagar — respeitando o princípio
-- do 0009 de que a auditoria financeira nunca desaparece.
--
-- Não há política DELETE em `reservas`: a exclusão passa só pela função abaixo,
-- que roda security definer (bypassa RLS) e valida funcionario_eh_admin() na
-- mão. Funcionário comum continua sem conseguir apagar reservas.

-- ============================================================
-- 1. Tabela de arquivo (append-only, só admin lê)
-- ============================================================
create table reservas_arquivadas (
  id serial primary key,
  reserva_id int not null,               -- id original; NÃO é FK (a reserva será apagada)
  hospede_nome text,
  hospede_telefone text,
  data_checkin date not null,
  data_checkout date not null,
  status_original text not null,
  valor_total numeric(10,2) not null,
  total_pago numeric(10,2) not null default 0,
  motivo text,
  dados jsonb not null,                  -- bundle: reserva + hóspede + pagamentos + despesas + eventos + segmentos
  excluida_por uuid references funcionarios(id) on delete set null,
  excluida_por_nome text,                -- nome congelado (o funcionário pode ser removido depois)
  excluida_em timestamptz not null default now()
);

create index reservas_arquivadas_reserva_idx on reservas_arquivadas (reserva_id);

alter table reservas_arquivadas enable row level security;

-- Só admin lê o arquivo. Insert acontece apenas via a função security definer
-- (que bypassa RLS); sem políticas de insert/update/delete → imutável pela via normal.
create policy reservas_arquivadas_select on reservas_arquivadas for select to authenticated
  using (funcionario_eh_admin());

-- ============================================================
-- 2. Função: arquiva o histórico e apaga a reserva (só admin)
-- ============================================================
create function arquivar_e_excluir_reserva(p_reserva_id int, p_motivo text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text;
  v_reserva reservas%rowtype;
  v_hospede_nome text;
  v_hospede_telefone text;
  v_total_pago numeric(10,2);
  v_bundle jsonb;
begin
  if not funcionario_eh_admin() then
    raise exception 'Só administradores podem excluir reservas' using errcode = '42501';
  end if;

  select * into v_reserva from reservas where id = p_reserva_id;
  if not found then
    raise exception 'Reserva não encontrada' using errcode = 'P0002';
  end if;

  select nome into v_nome from funcionarios where id = v_uid;
  select nome, telefone into v_hospede_nome, v_hospede_telefone
    from hospedes where id = v_reserva.hospede_id;
  select coalesce(sum(valor), 0) into v_total_pago
    from pagamentos where reserva_id = p_reserva_id;

  -- Bundle completo do histórico, para a reserva poder ser reconstruída se preciso.
  v_bundle := jsonb_build_object(
    'reserva', to_jsonb(v_reserva),
    'hospede', (select to_jsonb(h) from hospedes h where h.id = v_reserva.hospede_id),
    'pagamentos', coalesce(
      (select jsonb_agg(to_jsonb(p) order by p.recebido_em) from pagamentos p
        where p.reserva_id = p_reserva_id), '[]'::jsonb),
    'despesas_extras', coalesce(
      (select jsonb_agg(to_jsonb(d) order by d.lancada_em) from despesas_extras d
        where d.reserva_id = p_reserva_id), '[]'::jsonb),
    'reserva_eventos', coalesce(
      (select jsonb_agg(to_jsonb(e) order by e.ocorrido_em) from reserva_eventos e
        where e.reserva_id = p_reserva_id), '[]'::jsonb),
    'reserva_segmentos', coalesce(
      (select jsonb_agg(to_jsonb(s)) from reserva_segmentos s
        where s.reserva_id = p_reserva_id), '[]'::jsonb)
  );

  insert into reservas_arquivadas (
    reserva_id, hospede_nome, hospede_telefone, data_checkin, data_checkout,
    status_original, valor_total, total_pago, motivo, dados,
    excluida_por, excluida_por_nome
  ) values (
    p_reserva_id, v_hospede_nome, v_hospede_telefone,
    v_reserva.data_checkin, v_reserva.data_checkout,
    v_reserva.status, v_reserva.valor_total, v_total_pago,
    nullif(btrim(p_motivo), ''), v_bundle, v_uid, v_nome
  );

  -- Apaga o histórico vivo. pagamentos e despesas_extras não têm ON DELETE
  -- CASCADE → apagar antes da reserva. reserva_segmentos e reserva_eventos
  -- caem por cascade ao apagar a reserva. O hóspede permanece (pode ser
  -- compartilhado com outras reservas).
  delete from pagamentos where reserva_id = p_reserva_id;
  delete from despesas_extras where reserva_id = p_reserva_id;
  delete from reservas where id = p_reserva_id;
end;
$$;

grant execute on function arquivar_e_excluir_reserva(int, text) to authenticated;
