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

/** Sobe o logo para o Storage (bucket `branding`, pasta da própria pousada — RLS
 *  em 0020) e grava a URL pública em pousadas.logo_url. */
export function useUploadLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ pousadaId, arquivo }: { pousadaId: number; arquivo: File }) => {
      const ext = (arquivo.name.split('.').pop() || 'png').toLowerCase()
      const caminho = `${pousadaId}/logo.${ext}`
      const up = await supabase.storage
        .from('branding')
        .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type })
      if (up.error) throw up.error
      const { data } = supabase.storage.from('branding').getPublicUrl(caminho)
      // ?v=timestamp força o cabeçalho a recarregar o logo após re-upload
      const url = `${data.publicUrl}?v=${Date.now()}`
      const { error } = await supabase
        .from('pousadas')
        .update({ logo_url: url })
        .eq('id', pousadaId)
      if (error) throw error
      return url
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pousada'] }),
  })
}
