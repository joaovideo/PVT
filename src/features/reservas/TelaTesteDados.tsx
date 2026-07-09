import { Badge, type BadgeVariante } from '../../components/Badge'
import { formatarData, formatarMoeda, reaisParaCentavos } from '../../lib/formatadores'
import { numeroDeDiarias } from '../../lib/periodos'
import { useQuartos } from '../quartos/useQuartos'
import { useReservaFinanceiro } from '../pagamentos/useReservaFinanceiro'
import { useReservas } from './useReservas'

const PERIODO_TESTE = { inicio: '2026-07-01', fim: '2026-08-01' }

/** Tela temporária da Issue #6: prova que os hooks retornam o seed tipado. */
export function TelaTesteDados() {
  const quartos = useQuartos()
  const reservas = useReservas(PERIODO_TESTE)
  const financeiro = useReservaFinanceiro(reservas.data?.[0]?.id)

  if (quartos.isLoading || reservas.isLoading) {
    return <p className="p-4 text-slate-500">Carregando dados…</p>
  }

  if (quartos.isError || reservas.isError) {
    return (
      <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
        Erro ao buscar dados. Confira o .env.local e se as migrations + seed foram aplicados.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-800">Quartos ({quartos.data?.length})</h2>
        <ul className="flex flex-col gap-1">
          {quartos.data?.map((quarto) => (
            <li key={quarto.id} className="rounded-lg bg-white p-3 text-sm text-slate-700">
              <strong>{quarto.nome}</strong> — {quarto.camas_casal} casal,{' '}
              {quarto.camas_solteiro} solteiro, até {quarto.capacidade_max} pessoas
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-800">
          Reservas de julho ({reservas.data?.length})
        </h2>
        <ul className="flex flex-col gap-1">
          {reservas.data?.map((reserva) => (
            <li key={reserva.id} className="rounded-lg bg-white p-3 text-sm text-slate-700">
              <strong>{reserva.hospedes?.nome}</strong> · {formatarData(reserva.data_checkin)} →{' '}
              {formatarData(reserva.data_checkout)} (
              {numeroDeDiarias({ inicio: reserva.data_checkin, fim: reserva.data_checkout })}{' '}
              diárias) · {formatarMoeda(reaisParaCentavos(reserva.valor_total))} ·{' '}
              {reserva.reserva_segmentos.length} quarto(s)
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-800">Financeiro da primeira reserva</h2>
        {financeiro.data && (
          <p className="flex items-center gap-2 rounded-lg bg-white p-3 text-sm text-slate-700">
            Total {formatarMoeda(reaisParaCentavos(financeiro.data.valor_total ?? 0))} · pago{' '}
            {formatarMoeda(reaisParaCentavos(financeiro.data.total_pago ?? 0))}
            <Badge variante={(financeiro.data.situacao ?? 'nao_pago') as BadgeVariante} />
          </p>
        )}
      </section>
    </div>
  )
}
