import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { addDiasStr, diasEntre, hoje } from '../../lib/periodos'
import { useMapaQuartos, type CelulaMapa } from './useMapaQuartos'
import { ModalBloqueioInfo } from './ModalBloqueioInfo'

const DIAS_JANELA = 14

const CORES: Record<CelulaMapa['tipo'], string> = {
  livre: 'bg-livre-fundo text-livre-texto',
  nao_pago: 'bg-naopago-fundo text-naopago-texto',
  parcial: 'bg-parcial-fundo text-parcial-texto',
  pago: 'bg-pago-fundo text-pago-texto',
  checkin: 'bg-checkin-fundo text-checkin-texto',
  bloqueada: 'bg-bloqueada-fundo text-bloqueada-texto',
}

function formatarCabecalho(dia: string): { diaSemana: string; diaMes: string } {
  const data = parseISO(dia)
  return {
    diaSemana: format(data, 'EEEEEE'),
    diaMes: format(data, 'dd/MM'),
  }
}

export function TelaMapa() {
  const [inicioJanela, setInicioJanela] = useState(hoje())
  const navigate = useNavigate()
  const mapa = useMapaQuartos(inicioJanela, DIAS_JANELA)
  const dias = diasEntre(inicioJanela, addDiasStr(inicioJanela, DIAS_JANELA))

  const [bloqueioAberto, setBloqueioAberto] = useState<CelulaMapa | null>(null)

  function tocarCelula(quartoId: number, dia: string, celula: CelulaMapa | undefined) {
    if (celula?.tipo === 'bloqueada') {
      setBloqueioAberto(celula)
    } else if (celula?.reservaId) {
      navigate(`/reservas/${celula.reservaId}`)
    } else {
      navigate('/reservas/nova', { state: { checkinSugerido: dia, quartoIdSugerido: quartoId } })
    }
  }

  if (mapa.isLoading) return <p className="p-4 text-slate-500">Carregando…</p>
  if (mapa.isError)
    return (
      <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
        Erro ao carregar o mapa de quartos.
      </p>
    )

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Mapa de quartos</h1>
        <div className="flex gap-1">
          <button
            onClick={() => setInicioJanela((d) => addDiasStr(d, -DIAS_JANELA))}
            className="min-h-11 min-w-11 rounded-lg text-slate-500 active:bg-slate-100"
            aria-label="Semanas anteriores"
          >
            ‹
          </button>
          <button
            onClick={() => setInicioJanela(hoje())}
            className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-600 active:bg-slate-100"
          >
            Hoje
          </button>
          <button
            onClick={() => setInicioJanela((d) => addDiasStr(d, DIAS_JANELA))}
            className="min-h-11 min-w-11 rounded-lg text-slate-500 active:bg-slate-100"
            aria-label="Próximas semanas"
          >
            ›
          </button>
        </div>
      </div>

      <div className="flex gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-livre-fundo" /> Livre
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-naopago-fundo" /> Não pago
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-parcial-fundo" /> Parcial
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-pago-fundo" /> Pago
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-checkin-fundo" /> Check-in
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-bloqueada-fundo" /> Bloqueado
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <div style={{ width: `${112 + dias.length * 44}px` }}>
          <div className="flex border-b border-slate-200">
            <div className="sticky left-0 z-10 w-28 flex-none border-r border-slate-200 bg-white" />
            {dias.map((dia) => {
              const { diaSemana, diaMes } = formatarCabecalho(dia)
              return (
                <div
                  key={dia}
                  className="w-11 flex-none border-r border-slate-100 py-1 text-center text-xs text-slate-500"
                >
                  <div className="uppercase">{diaSemana}</div>
                  <div>{diaMes}</div>
                </div>
              )
            })}
          </div>

          {mapa.data?.quartos.map((quarto) => (
            <div key={quarto.id} className="flex border-b border-slate-100 last:border-b-0">
              <div className="sticky left-0 z-10 flex w-28 flex-none items-center border-r border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-700">
                {quarto.nome}
              </div>
              {dias.map((dia) => {
                const celula = mapa.data.grade.get(quarto.id)?.get(dia)
                const tipo = celula?.tipo ?? 'livre'
                return (
                  <button
                    key={dia}
                    onClick={() => tocarCelula(quarto.id, dia, celula)}
                    title={celula?.hospedeNome ?? celula?.motivo ?? 'Livre'}
                    className={`h-11 w-11 flex-none border-r border-slate-100 text-xs ${CORES[tipo]}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <ModalBloqueioInfo
        aberto={bloqueioAberto !== null}
        bloqueioId={bloqueioAberto?.bloqueioId ?? null}
        motivo={bloqueioAberto?.motivo ?? null}
        dataInicio={bloqueioAberto?.bloqueioInicio ?? null}
        dataFim={bloqueioAberto?.bloqueioFim ?? null}
        aoFechar={() => setBloqueioAberto(null)}
      />
    </div>
  )
}
