-- 0002 — View de situação financeira das reservas
-- O status de pagamento é derivado (soma dos pagamentos × valor_total),
-- nunca armazenado (docs/ESPECIFICACAO.md, seção 3).

create view reservas_financeiro as
select r.id, r.valor_total,
       coalesce(sum(p.valor),0) as total_pago,
       case
         when coalesce(sum(p.valor),0) = 0 then 'nao_pago'
         when coalesce(sum(p.valor),0) < r.valor_total then 'parcial'
         else 'pago'
       end as situacao
from reservas r
left join pagamentos p on p.reserva_id = r.id
group by r.id;
