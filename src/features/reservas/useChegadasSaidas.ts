import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { hoje } from '../../lib/periodos'

const SELECT_BASE = `*, hospedes(nome),
  reserva_segmentos(quartos(nome)),
  reserva_eventos(descricao, ocorrido_em)`

export function useChegadasDoDia() {
  return useQuery({
    queryKey: ['chegadas', hoje()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select(SELECT_BASE)
        .eq('data_checkin', hoje())
        .neq('status', 'cancelada')
        .order('hora_chegada_prevista', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data
    },
  })
}

export function useSaidasDoDia() {
  return useQuery({
    queryKey: ['saidas', hoje()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select(SELECT_BASE)
        .eq('data_checkout', hoje())
        .neq('status', 'cancelada')
        .order('data_checkin')
      if (error) throw error
      return data.map((r) => {
        const eventoCheckout = r.reserva_eventos
          .filter((e) => e.descricao === 'Check-out realizado')
          .sort((a, b) => b.ocorrido_em.localeCompare(a.ocorrido_em))[0]
        return { ...r, jaSaiu: r.status === 'checkout', horaCheckout: eventoCheckout?.ocorrido_em }
      })
    },
  })
}
