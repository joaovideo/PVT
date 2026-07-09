import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useChegadasDoDia, useSaidasDoDia } from './useChegadasSaidas'

function nomesQuartos(segmentos: { quartos: { nome: string } | null }[]): string {
  return segmentos.map((s) => s.quartos?.nome).join(', ')
}

export function TelaChegadas() {
  const chegadas = useChegadasDoDia()
  const saidas = useSaidasDoDia()

  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <h1 className="mb-2 text-lg font-bold text-slate-800">Chegadas de hoje</h1>
        {chegadas.isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
        {chegadas.data?.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma chegada prevista para hoje.</p>
        )}
        <ul className="flex flex-col gap-2">
          {chegadas.data?.map((r) => (
            <li key={r.id}>
              <Link
                to={`/reservas/${r.id}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-white p-3"
              >
                <div>
                  <p className="font-semibold text-slate-800">{r.hospedes?.nome}</p>
                  <p className="text-sm text-slate-500">{nomesQuartos(r.reserva_segmentos)}</p>
                </div>
                <span className="text-sm font-medium text-slate-600">
                  {r.hora_chegada_prevista?.slice(0, 5) ?? '—'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-800">Saídas de hoje</h2>
        {saidas.isLoading && <p className="text-sm text-slate-500">Carregando…</p>}
        {saidas.data?.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma saída prevista para hoje.</p>
        )}
        <ul className="flex flex-col gap-2">
          {saidas.data?.map((r) => (
            <li key={r.id}>
              <Link
                to={`/reservas/${r.id}`}
                className={`flex items-center justify-between gap-2 rounded-lg p-3 ${
                  r.jaSaiu ? 'bg-pago-fundo' : 'bg-white'
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-800">{r.hospedes?.nome}</p>
                  <p className="text-sm text-slate-500">{nomesQuartos(r.reserva_segmentos)}</p>
                </div>
                {r.jaSaiu ? (
                  <span className="text-right text-sm font-medium text-pago-texto">
                    Saiu às {r.horaCheckout ? format(parseISO(r.horaCheckout), 'HH:mm') : '—'}
                    <br />
                    pode arrumar
                  </span>
                ) : (
                  <span className="text-sm font-medium text-slate-400">Ainda não saiu</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
