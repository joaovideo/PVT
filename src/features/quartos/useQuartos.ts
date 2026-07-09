import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Tables } from '../../lib/database.types'

export type Quarto = Tables<'quartos'>

/** Lista de quartos (inclusive inativos — filtrar na UI quando necessário). */
export function useQuartos() {
  return useQuery({
    queryKey: ['quartos'],
    queryFn: async (): Promise<Quarto[]> => {
      const { data, error } = await supabase.from('quartos').select('*').order('id')
      if (error) throw error
      return data
    },
  })
}
