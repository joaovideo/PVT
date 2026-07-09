import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { TablesInsert } from '../../lib/database.types'

export function useBloqueios() {
  return useQuery({
    queryKey: ['bloqueios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bloqueios')
        .select('*, quartos(nome)')
        .order('data_inicio')
      if (error) throw error
      return data
    },
  })
}

export function useBloqueiosAdmin() {
  const queryClient = useQueryClient()
  const aoMudar = () => {
    queryClient.invalidateQueries({ queryKey: ['bloqueios'] })
    // 'mapa-quartos' também depende de bloqueios (Issue #33) — invalida
    // qualquer janela de data já em cache, não só a exibida agora.
    queryClient.invalidateQueries({ queryKey: ['mapa-quartos'] })
  }

  const criar = useMutation({
    mutationFn: async (bloqueio: TablesInsert<'bloqueios'>) => {
      const { error } = await supabase.from('bloqueios').insert(bloqueio)
      if (error) throw error
    },
    onSuccess: aoMudar,
  })

  // Desbloquear = apagar o bloqueio (delete permitido pelo RLS nesta tabela)
  const excluir = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('bloqueios').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: aoMudar,
  })

  return { criar, excluir }
}
