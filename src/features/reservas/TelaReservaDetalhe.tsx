import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Badge, type BadgeVariante } from '../../components/Badge'
import { Button } from '../../components/Button'
import { formatarData, formatarMoeda, reaisParaCentavos } from '../../lib/formatadores'
import { useReservaDetalhe } from './useReservaDetalhe'
import { useMudarStatusReserva } from './useAcoesReserva'
import { FormRegistrarPagamento } from './FormRegistrarPagamento'
import { FormLancarDespesa } from './FormLancarDespesa'
import { FormCancelarReserva } from './FormCancelarReserva'

function formatarDataHora(iso: string): string {
  return format(parseISO(iso), "dd/MM 'às' HH:mm")
}

export function TelaReservaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const reservaId = Number(id)
  const navigate = useNavigate()
  const reserva = useReservaDetalhe(reservaId)
  const mudarStatus = useMudarStatusReserva()

  const [modalPagamento, setModalPagamento] = useState(false)
  const [modalDespesa, setModalDespesa] = useState(false)
  const [modalCancelar, setModalCancelar] = useState(false)

  if (reserva.isLoading) return <p className="p-4 text-slate-500">Carregando…</p>
  if (reserva.isError || !reserva.data)
    return (
      <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
        Reserva não encontrada.
      </p>
    )

  const r = reserva.data
  const totalDespesas = r.despesas_extras.reduce((s, d) => s + d.quantidade * d.valor_unitario, 0)
  const totalPago = r.pagamentos.reduce((s, p) => s + p.valor, 0)
  const valorFinal = r.valor_total + totalDespesas
  const saldo = valorFinal - totalPago
  const situacao: BadgeVariante = totalPago === 0 ? 'nao_pago' : saldo > 0 ? 'parcial' : 'pago'

  const podeCheckin = r.status === 'confirmada' || r.status === 'pre-reserva'
  const podeCheckout = r.status === 'checkin'
  const podeCancelar = r.status !== 'cancelada' && r.status !== 'checkout'

  return (
    <div className="flex flex-col gap-4 p-4">
      <Link to="/reservas" className="text-sm text-slate-500">
        ‹ Reservas
      </Link>
      <div>
        <h1 className="text-lg font-bold text-slate-800">{r.hospedes?.nome}</h1>
        <p className="text-sm text-slate-500">
          {formatarData(r.data_checkin)} → {formatarData(r.data_checkout)} · {r.adultos} adulto
          {r.adultos > 1 ? 's' : ''}
          {r.criancas > 0 && `, ${r.criancas} criança${r.criancas > 1 ? 's' : ''}`} · nível{' '}
          {r.nivel_preco}
        </p>
        {r.hospedes?.telefone && <p className="text-sm text-slate-500">{r.hospedes.telefone}</p>}
      </div>

      <section className="rounded-lg bg-white p-3">
        <p className="mb-2 text-sm font-semibold text-slate-700">Quarto(s)</p>
        <ul className="flex flex-col gap-1 text-sm text-slate-600">
          {r.reserva_segmentos.map((s) => (
            <li key={s.id}>
              {s.quartos?.nome} · {formatarData(s.data_inicio)} → {formatarData(s.data_fim)}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Situação financeira</p>
          <Badge variante={situacao} />
        </div>
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-slate-500">Estadia</dt>
          <dd className="text-right">{formatarMoeda(reaisParaCentavos(r.valor_total))}</dd>
          <dt className="text-slate-500">Despesas extras</dt>
          <dd className="text-right">{formatarMoeda(reaisParaCentavos(totalDespesas))}</dd>
          <dt className="font-semibold text-slate-700">Valor final</dt>
          <dd className="text-right font-semibold">
            {formatarMoeda(reaisParaCentavos(valorFinal))}
          </dd>
          <dt className="text-slate-500">Pago</dt>
          <dd className="text-right">{formatarMoeda(reaisParaCentavos(totalPago))}</dd>
          <dt className="font-semibold text-slate-700">Saldo a receber</dt>
          <dd className="text-right font-semibold">{formatarMoeda(reaisParaCentavos(saldo))}</dd>
        </dl>
        <div className="mt-3 flex gap-2">
          <Button variante="secundario" onClick={() => setModalPagamento(true)}>
            Registrar pagamento
          </Button>
          <Button variante="secundario" onClick={() => setModalDespesa(true)}>
            Lançar despesa
          </Button>
        </div>
      </section>

      {r.pagamentos.length > 0 && (
        <section className="rounded-lg bg-white p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Pagamentos</p>
          <ul className="flex flex-col gap-2 text-sm text-slate-600">
            {r.pagamentos.map((p) => (
              <li key={p.id} className="flex flex-col gap-0.5">
                <div className="flex justify-between">
                  <span>
                    {p.metodo} · {p.funcionario?.nome} · {formatarDataHora(p.recebido_em)}
                  </span>
                  <span className="font-medium">{formatarMoeda(reaisParaCentavos(p.valor))}</span>
                </div>
                {p.observacao && <p className="text-xs text-slate-400">{p.observacao}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.despesas_extras.length > 0 && (
        <section className="rounded-lg bg-white p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Despesas extras</p>
          <ul className="flex flex-col gap-1 text-sm text-slate-600">
            {r.despesas_extras.map((d) => (
              <li key={d.id} className="flex justify-between">
                <span>
                  {d.quantidade}× {d.descricao} · {d.funcionario?.nome} ·{' '}
                  {formatarDataHora(d.lancada_em)}
                </span>
                <span className="font-medium">
                  {formatarMoeda(reaisParaCentavos(d.quantidade * d.valor_unitario))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex gap-2">
        {podeCheckin && (
          <Button
            disabled={mudarStatus.isPending}
            onClick={() => mudarStatus.mutate({ reservaId, status: 'checkin' })}
          >
            Fazer check-in
          </Button>
        )}
        {podeCheckout && (
          <Button
            disabled={mudarStatus.isPending}
            onClick={() => mudarStatus.mutate({ reservaId, status: 'checkout' })}
          >
            Fazer check-out
          </Button>
        )}
        {podeCancelar && (
          <Button variante="perigo" onClick={() => setModalCancelar(true)}>
            Cancelar reserva
          </Button>
        )}
      </section>

      {r.reserva_eventos.length > 0 && (
        <section className="rounded-lg bg-white p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Histórico</p>
          <ul className="flex flex-col gap-2 text-sm">
            {r.reserva_eventos.map((e) => (
              <li key={e.id} className="text-slate-600">
                <span className="text-slate-400">{formatarDataHora(e.ocorrido_em)}</span> ·{' '}
                {e.funcionario?.nome && <strong>{e.funcionario.nome}</strong>} {e.descricao}
              </li>
            ))}
          </ul>
        </section>
      )}

      <FormRegistrarPagamento
        aberto={modalPagamento}
        reservaId={reservaId}
        saldoSugerido={saldo}
        aoFechar={() => setModalPagamento(false)}
      />
      <FormLancarDespesa
        aberto={modalDespesa}
        reservaId={reservaId}
        aoFechar={() => setModalDespesa(false)}
      />
      <FormCancelarReserva
        aberto={modalCancelar}
        reservaId={reservaId}
        aoFechar={() => setModalCancelar(false)}
        aoCancelar={() => {
          setModalCancelar(false)
          navigate('/reservas')
        }}
      />
    </div>
  )
}
