import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { TablesInsert, TablesUpdate } from '../../lib/database.types'

/** Mutations do CRUD de quartos. Exclusão física é bloqueada pelo RLS —
 *  o caminho é desativar (ativo = false), preservando o histórico. */
export function useQuartosAdmin() {
  const queryClient = useQueryClient()
  const aoMudar = () => queryClient.invalidateQueries({ queryKey: ['quartos'] })

  const criar = useMutation({
    mutationFn: async (quarto: TablesInsert<'quartos'>) => {
      const { error } = await supabase.from('quartos').insert(quarto)
      if (error) throw error
    },
    onSuccess: aoMudar,
  })

  const atualizar = useMutation({
    mutationFn: async ({ id, ...campos }: TablesUpdate<'quartos'> & { id: number }) => {
      const { error } = await supabase.from('quartos').update(campos).eq('id', id)
      if (error) throw error
    },
    onSuccess: aoMudar,
  })

  return { criar, atualizar }
}
