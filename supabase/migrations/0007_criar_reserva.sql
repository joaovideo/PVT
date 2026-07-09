-- 0007 — Função atômica de criação de reserva (Issue #18)
-- Cria hóspede (se novo), reserva, segmento do quarto e sinal opcional numa
-- única transação. Se o quarto for ocupado nesse meio-tempo, a constraint
-- anti-overbooking aborta tudo — sem reserva órfã. security definer + checagem
-- de funcionário ativo (a função roda fora do RLS, então valida na mão).

-- Parâmetros opcionais levam "default null": o PostgREST sempre chama por
-- nome (não posicional), então a ordem aqui não afeta as chamadas do app;
-- o default é só para o typegen do Supabase marcar o campo como opcional.
create function criar_reserva(
  p_quarto_id int,
  p_checkin date,
  p_checkout date,
  p_adultos int,
  p_criancas int,
  p_nivel text,
  p_valor_total numeric,
  p_hospede_id int default null,
  p_hospede_nome text default null,
  p_hospede_telefone text default null,
  p_hora_chegada time default null,
  p_sinal_valor numeric default null,
  p_sinal_metodo text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_func uuid := auth.uid();
  v_hospede int := p_hospede_id;
  v_reserva int;
begin
  if not funcionario_ativo() then
    raise exception 'Sem permissão' using errcode = '42501';
  end if;

  if v_hospede is null and (p_hospede_nome is null or btrim(p_hospede_nome) = '') then
    raise exception 'Informe o hóspede' using errcode = '22004';
  end if;

  if v_hospede is null then
    insert into hospedes (nome, telefone)
    values (p_hospede_nome, nullif(p_hospede_telefone, ''))
    returning id into v_hospede;
  end if;

  insert into reservas (
    hospede_id, data_checkin, data_checkout, hora_chegada_prevista,
    adultos, criancas, nivel_preco, valor_total, status, criada_por
  ) values (
    v_hospede, p_checkin, p_checkout, p_hora_chegada,
    p_adultos, p_criancas, p_nivel, p_valor_total, 'confirmada', v_func
  )
  returning id into v_reserva;

  -- Pode disparar exclusion_violation → aborta a transação inteira
  insert into reserva_segmentos (reserva_id, quarto_id, data_inicio, data_fim)
  values (v_reserva, p_quarto_id, p_checkin, p_checkout);

  if p_sinal_valor is not null and p_sinal_valor > 0 then
    insert into pagamentos (reserva_id, valor, metodo, recebido_por, observacao)
    values (v_reserva, p_sinal_valor, coalesce(p_sinal_metodo, 'outro'), v_func, 'Sinal na reserva');
  end if;

  return v_reserva;
end;
$$;

grant execute on function criar_reserva(
  int, date, date, int, int, text, numeric, int, text, text, time, numeric, text
) to authenticated;
