import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'

/** Reservas mais recentes (qualquer status), com hóspede e situação
 *  financeira, para a lista da aba Reservas. Busca a view financeira à
 *  parte e junta no cliente — PostgREST não embeda views com segurança. */
export function useListaReservas() {
  return useQuery({
    queryKey: ['reservas-lista'],
    queryFn: async () => {
      const [{ data: reservas, error: erroReservas }, { data: financeiro, error: erroFin }] =
        await Promise.all([
          supabase
            .from('reservas')
            .select('*, hospedes(nome)')
            .order('data_checkin', { ascending: false })
            .limit(50),
          supabase.from('reservas_financeiro').select('*'),
        ])
      if (erroReservas) throw erroReservas
      if (erroFin) throw erroFin

      const financeiroPorId = new Map(financeiro.map((f) => [f.id, f]))
      return reservas.map((r) => ({ ...r, financeiro: financeiroPorId.get(r.id) ?? null }))
    },
  })
}
