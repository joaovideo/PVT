import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'

function invalidarDetalhe(queryClient: ReturnType<typeof useQueryClient>, reservaId: number) {
  queryClient.invalidateQueries({ queryKey: ['reserva-detalhe', reservaId] })
  queryClient.invalidateQueries({ queryKey: ['quartos-disponiveis'] })
  queryClient.invalidateQueries({ queryKey: ['reservas-lista'] })
  // Situação financeira e status mudam a cor da célula no Mapa (Issue #33)
  queryClient.invalidateQueries({ queryKey: ['mapa-quartos'] })
}

interface LancarDespesaInput {
  reservaId: number
  descricao: string
  quantidade: number
  valorUnitario: number
  lancadaPor: string
}

export function useLancarDespesa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: LancarDespesaInput) => {
      const { error } = await supabase.from('despesas_extras').insert({
        reserva_id: input.reservaId,
        descricao: input.descricao,
        quantidade: input.quantidade,
        valor_unitario: input.valorUnitario,
        lancada_por: input.lancadaPor,
      })
      if (error) throw error
    },
    onSuccess: (_d, input) => invalidarDetalhe(queryClient, input.reservaId),
  })
}

interface RegistrarPagamentoInput {
  reservaId: number
  valor: number
  metodo: string
  recebidoPor: string
  observacao?: string
}

export function useRegistrarPagamento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RegistrarPagamentoInput) => {
      const { error } = await supabase.from('pagamentos').insert({
        reserva_id: input.reservaId,
        valor: input.valor,
        metodo: input.metodo,
        recebido_por: input.recebidoPor,
        observacao: input.observacao || null,
      })
      if (error) throw error
    },
    onSuccess: (_d, input) => invalidarDetalhe(queryClient, input.reservaId),
  })
}

export type StatusReserva = 'pre-reserva' | 'confirmada' | 'checkin' | 'checkout' | 'cancelada'

interface MudarStatusInput {
  reservaId: number
  status: StatusReserva
  observacoes?: string
}

/** Muda o status da reserva — o trigger da migration 0005 registra o evento
 *  na linha do tempo automaticamente, com o funcionário via auth.uid(). */
export function useMudarStatusReserva() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: MudarStatusInput) => {
      const campos: { status: StatusReserva; observacoes?: string } = { status: input.status }
      if (input.observacoes !== undefined) campos.observacoes = input.observacoes
      const { error } = await supabase.from('reservas').update(campos).eq('id', input.reservaId)
      if (error) throw error
    },
    onSuccess: (_d, input) => invalidarDetalhe(queryClient, input.reservaId),
  })
}
