import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { NivelPreco } from '../../lib/precos'

export interface DadosNovaReserva {
  hospedeId: number | null
  hospedeNome: string
  hospedeTelefone: string
  quartoId: number
  checkin: string
  checkout: string
  adultos: number
  criancas: number
  nivel: NivelPreco
  valorTotal: number // reais
  horaChegada: string | null
  sinalValor: number | null // reais
  sinalMetodo: string | null
}

/** Cria a reserva inteira (hóspede + reserva + segmento + sinal opcional)
 *  numa única chamada atômica no banco — ver migration 0007. */
export function useCriarReserva() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: DadosNovaReserva) => {
      const { data, error } = await supabase.rpc('criar_reserva', {
        p_hospede_id: dados.hospedeId ?? undefined,
        p_hospede_nome: dados.hospedeNome,
        p_hospede_telefone: dados.hospedeTelefone,
        p_quarto_id: dados.quartoId,
        p_checkin: dados.checkin,
        p_checkout: dados.checkout,
        p_adultos: dados.adultos,
        p_criancas: dados.criancas,
        p_nivel: dados.nivel,
        p_valor_total: dados.valorTotal,
        p_hora_chegada: dados.horaChegada ?? undefined,
        p_sinal_valor: dados.sinalValor ?? undefined,
        p_sinal_metodo: dados.sinalMetodo ?? undefined,
      })
      if (error) throw error
      return data as number
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quartos-disponiveis'] })
      queryClient.invalidateQueries({ queryKey: ['reservas-lista'] })
    },
  })
}
