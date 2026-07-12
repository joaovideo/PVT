import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Tables } from '../../lib/database.types'

export type Pousada = Tables<'pousadas'>

/** Lê a pousada do funcionário logado. O RLS (migration 0018) retorna só a dele,
 *  então basta pegar a primeira linha. */
export function usePousada() {
  return useQuery({
    queryKey: ['pousada'],
    queryFn: async (): Promise<Pousada | null> => {
      const { data, error } = await supabase.from('pousadas').select('*').limit(1)
      if (error) throw error
      return data?.[0] ?? null
    },
  })
}

export interface BrandingInput {
  id: number
  nome_exibicao: string
  endereco: string | null
  cor_primaria: string | null
  cor_secundaria: string | null
  cor_fundo: string | null
}

/** Atualiza a identidade visual da pousada. Só admin da própria pousada
 *  (garantido pelo RLS de update em 0018). */
export function useAtualizarBranding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...campos }: BrandingInput) => {
      const { error } = await supabase.from('pousadas').update(campos).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pousada'] }),
  })
}
