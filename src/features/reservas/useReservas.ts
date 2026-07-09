import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Periodo } from '../../lib/periodos'

/**
 * Reservas não canceladas cuja estadia sobrepõe o período consultado
 * (fim exclusivo: data_checkin < periodo.fim E data_checkout > periodo.inicio),
 * com hóspede e segmentos de quarto.
 */
export function useReservas(periodo: Periodo) {
  return useQuery({
    queryKey: ['reservas', periodo.inicio, periodo.fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select('*, hospedes(nome), reserva_segmentos(*)')
        .lt('data_checkin', periodo.fim)
        .gt('data_checkout', periodo.inicio)
        .neq('status', 'cancelada')
        .order('data_checkin')
      if (error) throw error
      return data
    },
  })
}

export type ReservaComSegmentos = NonNullable<ReturnType<typeof useReservas>['data']>[number]
