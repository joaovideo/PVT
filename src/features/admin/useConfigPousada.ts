import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Tables, TablesUpdate } from '../../lib/database.types'

export type ConfigPousada = Tables<'config_pousada'>

export function useConfigPousada() {
  return useQuery({
    queryKey: ['config-pousada'],
    queryFn: async (): Promise<ConfigPousada | null> => {
      const { data, error } = await supabase.from('config_pousada').select('*').maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useSalvarConfigPousada() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (campos: TablesUpdate<'config_pousada'>) => {
      const { error } = await supabase.from('config_pousada').update(campos).eq('id', 1)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config-pousada'] }),
  })
}
