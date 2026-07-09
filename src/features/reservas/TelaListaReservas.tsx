import { Link } from 'react-router-dom'
import { Badge, type BadgeVariante } from '../../components/Badge'
import { Button } from '../../components/Button'
import { formatarData, formatarMoeda, reaisParaCentavos } from '../../lib/formatadores'
import { useListaReservas } from './useListaReservas'

const ROTULO_STATUS: Record<string, string> = {
  'pre-reserva': 'Pré-reserva',
  confirmada: 'Confirmada',
  checkin: 'Check-in feito',
  checkout: 'Check-out feito',
  cancelada: 'Cancelada',
}

export function TelaListaReservas() {
  const reservas = useListaReservas()

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Reservas</h1>
        <Link to="/reservas/nova">
          <Button>+ Nova reserva</Button>
        </Link>
      </div>

      {reservas.isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
      {reservas.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Erro ao carregar as reservas.
        </p>
      )}
      {reservas.data?.length === 0 && (
        <p className="text-sm text-slate-500">Nenhuma reserva ainda.</p>
      )}

      <ul className="flex flex-col gap-2">
        {reservas.data?.map((reserva) => (
          <li key={reserva.id}>
            <Link
              to={`/reservas/${reserva.id}`}
              className="flex items-center justify-between gap-2 rounded-lg bg-white p-3"
            >
              <div>
                <p className="font-semibold text-slate-800">{reserva.hospedes?.nome}</p>
                <p className="text-sm text-slate-500">
                  {formatarData(reserva.data_checkin)} → {formatarData(reserva.data_checkout)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {reserva.status === 'cancelada' ? (
                  <Badge variante="livre">Cancelada</Badge>
                ) : (
                  reserva.financeiro && (
                    <Badge variante={reserva.financeiro.situacao as BadgeVariante} />
                  )
                )}
                <span className="text-xs text-slate-400">
                  {ROTULO_STATUS[reserva.status] ?? reserva.status}
                </span>
                {reserva.financeiro?.valor_final != null && (
                  <span className="text-sm font-semibold text-slate-700">
                    {formatarMoeda(reaisParaCentavos(reserva.financeiro.valor_final))}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
