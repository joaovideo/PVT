import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Tables } from '../../lib/database.types'

export type Hospede = Tables<'hospedes'>

/** Busca hóspedes pelo nome (mín. 2 letras) para o cadastro rápido na reserva. */
export function useBuscarHospedes(termo: string) {
  return useQuery({
    queryKey: ['hospedes-busca', termo],
    enabled: termo.trim().length >= 2,
    queryFn: async (): Promise<Hospede[]> => {
      const { data, error } = await supabase
        .from('hospedes')
        .select('*')
        .ilike('nome', `%${termo.trim()}%`)
        .order('nome')
        .limit(8)
      if (error) throw error
      return data
    },
  })
}
