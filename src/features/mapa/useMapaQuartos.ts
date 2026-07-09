import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { addDiasStr, diasEntre } from '../../lib/periodos'

export type TipoCelula = 'livre' | 'nao_pago' | 'parcial' | 'pago' | 'checkin' | 'bloqueada'

export interface CelulaMapa {
  tipo: TipoCelula
  reservaId?: number
  hospedeNome?: string
  bloqueioId?: number
  motivo?: string
  bloqueioInicio?: string
  bloqueioFim?: string
}

/** Grade quarto × dia para o período [inicio, inicio+dias). Prioridade de
 *  uma célula com mais de uma coisa acontecendo (raro, RLS não impede
 *  bloqueio sobre reserva ativa): bloqueio > check-in feito > situação
 *  financeira da reserva. */
export function useMapaQuartos(inicio: string, dias: number) {
  const fim = addDiasStr(inicio, dias)

  return useQuery({
    queryKey: ['mapa-quartos', inicio, dias],
    queryFn: async () => {
      const [quartosRes, segmentosRes, bloqueiosRes] = await Promise.all([
        supabase.from('quartos').select('*').eq('ativo', true).order('id'),
        supabase
          .from('reserva_segmentos')
          .select('quarto_id, data_inicio, data_fim, reservas(id, status, hospedes(nome))')
          .eq('cancelado', false)
          .lt('data_inicio', fim)
          .gt('data_fim', inicio),
        supabase
          .from('bloqueios')
          .select('id, quarto_id, data_inicio, data_fim, motivo')
          .lt('data_inicio', fim)
          .gt('data_fim', inicio),
      ])
      if (quartosRes.error) throw quartosRes.error
      if (segmentosRes.error) throw segmentosRes.error
      if (bloqueiosRes.error) throw bloqueiosRes.error

      const reservaIds = segmentosRes.data
        .map((s) => s.reservas?.id)
        .filter((id): id is number => id !== undefined)
      const { data: financeiro, error: erroFin } =
        reservaIds.length > 0
          ? await supabase.from('reservas_financeiro').select('id, situacao').in('id', reservaIds)
          : { data: [] as { id: number; situacao: string | null }[], error: null }
      if (erroFin) throw erroFin
      const situacaoPorReserva = new Map(financeiro.map((f) => [f.id, f.situacao]))

      const grade = new Map<number, Map<string, CelulaMapa>>()
      for (const quarto of quartosRes.data) grade.set(quarto.id, new Map())

      for (const seg of segmentosRes.data) {
        // quarto_id pode ser null se o quarto foi apagado (0009); sem linha
        // na grade, o segmento histórico não aparece no mapa.
        if (seg.quarto_id === null) continue
        const diasSeg = diasEntre(
          seg.data_inicio > inicio ? seg.data_inicio : inicio,
          seg.data_fim < fim ? seg.data_fim : fim,
        )
        const reserva = seg.reservas
        const tipo: TipoCelula =
          reserva?.status === 'checkin'
            ? 'checkin'
            : ((situacaoPorReserva.get(reserva?.id ?? -1) ?? 'nao_pago') as TipoCelula)
        const linha = grade.get(seg.quarto_id)
        for (const dia of diasSeg) {
          linha?.set(dia, { tipo, reservaId: reserva?.id, hospedeNome: reserva?.hospedes?.nome })
        }
      }

      // Bloqueio tem prioridade visual (sobrescreve reserva na mesma célula,
      // caso raro em que um bloqueio foi criado sobre um período já reservado).
      for (const bloqueio of bloqueiosRes.data) {
        if (bloqueio.quarto_id === null) continue
        const diasB = diasEntre(
          bloqueio.data_inicio > inicio ? bloqueio.data_inicio : inicio,
          bloqueio.data_fim < fim ? bloqueio.data_fim : fim,
        )
        const linha = grade.get(bloqueio.quarto_id)
        for (const dia of diasB) {
          linha?.set(dia, {
            tipo: 'bloqueada',
            bloqueioId: bloqueio.id,
            motivo: bloqueio.motivo,
            bloqueioInicio: bloqueio.data_inicio,
            bloqueioFim: bloqueio.data_fim,
          })
        }
      }

      return { quartos: quartosRes.data, grade }
    },
  })
}
