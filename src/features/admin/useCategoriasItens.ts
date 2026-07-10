import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Tables } from '../../lib/database.types'

export type CategoriaItem = Tables<'categorias_itens'>

/** Categoria fallback (default da coluna no banco; protegida contra exclusão). */
export const CATEGORIA_PADRAO = 'Outros'

/** Categorias do cardápio, na ordem definida pelo admin. Fonte única para os
 *  dropdowns e para o agrupamento por categoria (que antes era uma const fixa). */
export function useCategorias() {
  return useQuery({
    queryKey: ['categorias-itens'],
    queryFn: async (): Promise<CategoriaItem[]> => {
      const { data, error } = await supabase
        .from('categorias_itens')
        .select('*')
        .order('ordem')
        .order('nome')
      if (error) throw error
      return data
    },
  })
}

/** Índice de ordenação a partir das categorias carregadas. Categoria fora da
 *  lista (item órfão) vai para o fim. Substitui o antigo `ordemCategoria`. */
export function criarOrdemCategoria(categorias: CategoriaItem[]): (nome: string) => number {
  const porNome = new Map(categorias.map((c) => [c.nome, c.ordem]))
  const fim = categorias.length + 1
  return (nome) => porNome.get(nome) ?? fim
}

export function useCategoriasAdmin() {
  const queryClient = useQueryClient()
  // Renomear altera itens_extras_catalogo via FK ON UPDATE CASCADE, então
  // invalida também o cache dos itens.
  const aoMudar = () => {
    queryClient.invalidateQueries({ queryKey: ['categorias-itens'] })
    queryClient.invalidateQueries({ queryKey: ['itens-extras'] })
  }

  const criar = useMutation({
    mutationFn: async (nome: string) => {
      // Nova categoria entra por último na ordem.
      const { data: ultima } = await supabase
        .from('categorias_itens')
        .select('ordem')
        .order('ordem', { ascending: false })
        .limit(1)
        .maybeSingle()
      const ordem = (ultima?.ordem ?? 0) + 1
      const { error } = await supabase.from('categorias_itens').insert({ nome: nome.trim(), ordem })
      if (error) throw error
    },
    onSuccess: aoMudar,
  })

  const renomear = useMutation({
    mutationFn: async ({ id, nome }: { id: number; nome: string }) => {
      const { error } = await supabase
        .from('categorias_itens')
        .update({ nome: nome.trim() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: aoMudar,
  })

  // Troca a ordem de duas categorias (mover para cima/baixo na lista).
  const trocarOrdem = useMutation({
    mutationFn: async ({ a, b }: { a: CategoriaItem; b: CategoriaItem }) => {
      const r1 = await supabase.from('categorias_itens').update({ ordem: b.ordem }).eq('id', a.id)
      if (r1.error) throw r1.error
      const r2 = await supabase.from('categorias_itens').update({ ordem: a.ordem }).eq('id', b.id)
      if (r2.error) throw r2.error
    },
    onSuccess: aoMudar,
  })

  const apagar = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('categorias_itens').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: aoMudar,
  })

  return { criar, renomear, trocarOrdem, apagar }
}
