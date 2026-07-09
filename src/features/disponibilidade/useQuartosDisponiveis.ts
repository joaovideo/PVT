import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Periodo } from '../../lib/periodos'
import type { Quarto } from '../quartos/useQuartos'

/**
 * Quartos ativos com capacidade suficiente para o grupo, livres o período
 * inteiro (sem reserva ativa nem bloqueio sobrepondo). Filtro só por
 * capacidade — não exige tipo de cama específico (decisão do João).
 */
export function useQuartosDisponiveis(periodo: Periodo, totalPessoas: number) {
  return useQuery({
    queryKey: ['quartos-disponiveis', periodo.inicio, periodo.fim, totalPessoas],
    enabled: totalPessoas > 0 && periodo.inicio < periodo.fim,
    queryFn: async (): Promise<Quarto[]> => {
      const { data: quartos, error: erroQuartos } = await supabase
        .from('quartos')
        .select('*')
        .eq('ativo', true)
        .gte('capacidade_max', totalPessoas)
        .order('capacidade_max')
      if (erroQuartos) throw erroQuartos

      const [{ data: segmentos, error: erroSeg }, { data: bloqueios, error: erroBlo }] =
        await Promise.all([
          supabase
            .from('reserva_segmentos')
            .select('quarto_id')
            .eq('cancelado', false)
            .lt('data_inicio', periodo.fim)
            .gt('data_fim', periodo.inicio),
          supabase
            .from('bloqueios')
            .select('quarto_id')
            .lt('data_inicio', periodo.fim)
            .gt('data_fim', periodo.inicio),
        ])
      if (erroSeg) throw erroSeg
      if (erroBlo) throw erroBlo

      const ocupados = new Set([
        ...segmentos.map((s) => s.quarto_id),
        ...bloqueios.map((b) => b.quarto_id),
      ])
      return quartos.filter((q) => !ocupados.has(q.id))
    },
  })
}
