import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'

/** Reserva completa para a tela de detalhe: hóspede, segmentos (com quarto),
 *  pagamentos, despesas e a linha do tempo — tudo numa consulta, com o
 *  nome do funcionário responsável por cada evento/pagamento/despesa. */
export function useReservaDetalhe(reservaId: number | undefined) {
  return useQuery({
    queryKey: ['reserva-detalhe', reservaId],
    enabled: reservaId !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select(
          `*, hospedes(*), criador:funcionarios(nome),
           reserva_segmentos(*, quartos(nome)),
           pagamentos(*, funcionario:funcionarios(nome)),
           despesas_extras(*, funcionario:funcionarios(nome)),
           reserva_eventos(*, funcionario:funcionarios(nome))`,
        )
        .eq('id', reservaId!)
        .order('ocorrido_em', { referencedTable: 'reserva_eventos' })
        .single()
      if (error) throw error
      return data
    },
  })
}

export type ReservaDetalhe = NonNullable<ReturnType<typeof useReservaDetalhe>['data']>
