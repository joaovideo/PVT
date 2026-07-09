import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Tables, TablesInsert } from '../../lib/database.types'

export type Tarifa = Tables<'tarifas'>

export function useTarifas(quartoId: number | undefined) {
  return useQuery({
    queryKey: ['tarifas', quartoId],
    enabled: quartoId !== undefined,
    queryFn: async (): Promise<Tarifa[]> => {
      const { data, error } = await supabase
        .from('tarifas')
        .select('*')
        .eq('quarto_id', quartoId!)
        .order('adultos')
      if (error) throw error
      return data
    },
  })
}

/** Cria ou atualiza a tarifa de um quarto para um nº de adultos
 *  (upsert pela unique quarto_id+adultos). */
export function useSalvarTarifa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tarifa: TablesInsert<'tarifas'>) => {
      const { error } = await supabase
        .from('tarifas')
        .upsert(tarifa, { onConflict: 'quarto_id,adultos' })
      if (error) throw error
    },
    onSuccess: (_dados, tarifa) =>
      queryClient.invalidateQueries({ queryKey: ['tarifas', tarifa.quarto_id] }),
  })
}
