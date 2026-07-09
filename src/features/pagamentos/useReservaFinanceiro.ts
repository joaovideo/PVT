import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Tables } from '../../lib/database.types'

export type ReservaFinanceiro = Tables<'reservas_financeiro'>

/** Situação financeira derivada (view reservas_financeiro): total pago e status. */
export function useReservaFinanceiro(reservaId: number | undefined) {
  return useQuery({
    queryKey: ['reserva-financeiro', reservaId],
    enabled: reservaId !== undefined,
    queryFn: async (): Promise<ReservaFinanceiro | null> => {
      const { data, error } = await supabase
        .from('reservas_financeiro')
        .select('*')
        .eq('id', reservaId!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}
