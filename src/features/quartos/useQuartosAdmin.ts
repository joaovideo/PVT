import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { TablesInsert, TablesUpdate } from '../../lib/database.types'

/** Mutations do CRUD de quartos. A partir da migration 0009 a exclusão de
 *  verdade é permitida (só admin, via RLS): o histórico sobrevive porque
 *  segmentos/bloqueios guardam o nome congelado do quarto. Desativar
 *  (ativo = false) continua sendo a opção para tirar de uso sem apagar. */
export function useQuartosAdmin() {
  const queryClient = useQueryClient()
  const aoMudar = () => {
    queryClient.invalidateQueries({ queryKey: ['quartos'] })
    queryClient.invalidateQueries({ queryKey: ['mapa-quartos'] })
  }

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

  const apagar = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('quartos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: aoMudar,
  })

  return { criar, atualizar, apagar }
}
