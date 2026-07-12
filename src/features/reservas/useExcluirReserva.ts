import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'

interface ExcluirReservaInput {
  reservaId: number
  motivo: string
}

/** Arquiva o histórico da reserva e a apaga (ação de admin — ver migration 0014).
 *  O banco valida `funcionario_eh_admin()`; um funcionário comum recebe erro. */
export function useExcluirReserva() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ reservaId, motivo }: ExcluirReservaInput) => {
      const { error } = await supabase.rpc('arquivar_e_excluir_reserva', {
        p_reserva_id: reservaId,
        p_motivo: motivo,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quartos-disponiveis'] })
      queryClient.invalidateQueries({ queryKey: ['reservas-lista'] })
      queryClient.invalidateQueries({ queryKey: ['mapa-quartos'] })
    },
  })
}
