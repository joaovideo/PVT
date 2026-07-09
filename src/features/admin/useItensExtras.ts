import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Tables, TablesInsert, TablesUpdate } from '../../lib/database.types'

export type ItemExtra = Tables<'itens_extras_catalogo'>

export function useItensExtras() {
  return useQuery({
    queryKey: ['itens-extras'],
    queryFn: async (): Promise<ItemExtra[]> => {
      const { data, error } = await supabase.from('itens_extras_catalogo').select('*').order('nome')
      if (error) throw error
      return data
    },
  })
}

/** Só itens ativos, para o seletor de "Lançar despesa" na reserva. */
export function useItensExtrasAtivos() {
  return useQuery({
    queryKey: ['itens-extras', 'ativos'],
    queryFn: async (): Promise<ItemExtra[]> => {
      const { data, error } = await supabase
        .from('itens_extras_catalogo')
        .select('*')
        .eq('ativo', true)
        .order('nome')
      if (error) throw error
      return data
    },
  })
}

export function useItensExtrasAdmin() {
  const queryClient = useQueryClient()
  const aoMudar = () => queryClient.invalidateQueries({ queryKey: ['itens-extras'] })

  const criar = useMutation({
    mutationFn: async (item: TablesInsert<'itens_extras_catalogo'>) => {
      const { error } = await supabase.from('itens_extras_catalogo').insert(item)
      if (error) throw error
    },
    onSuccess: aoMudar,
  })

  const atualizar = useMutation({
    mutationFn: async ({
      id,
      ...campos
    }: TablesUpdate<'itens_extras_catalogo'> & { id: number }) => {
      const { error } = await supabase.from('itens_extras_catalogo').update(campos).eq('id', id)
      if (error) throw error
    },
    onSuccess: aoMudar,
  })

  // Só admin (RLS). Despesas já lançadas não são afetadas — elas guardam
  // descrição e valor próprios, não uma referência ao item do catálogo.
  const apagar = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('itens_extras_catalogo').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: aoMudar,
  })

  return { criar, atualizar, apagar }
}
