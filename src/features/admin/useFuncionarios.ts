import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Tables } from '../../lib/database.types'

export type Funcionario = Tables<'funcionarios'>

export function useFuncionarios() {
  return useQuery({
    queryKey: ['funcionarios'],
    queryFn: async (): Promise<Funcionario[]> => {
      const { data, error } = await supabase.from('funcionarios').select('*').order('nome')
      if (error) throw error
      return data
    },
  })
}

interface NovoFuncionario {
  nome: string
  email: string
  senha: string
}

/** Cria o funcionário via Supabase Auth — o trigger da migration 0004 cria
 *  a linha em `funcionarios` automaticamente a partir do nome. Como este
 *  projeto exige confirmação de e-mail, o signUp NÃO substitui a sessão
 *  do admin atual (sem isso, criar um funcionário deslogaria quem criou). */
export function useCriarFuncionario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nome, email, senha }: NovoFuncionario) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['funcionarios'] }),
  })
}

export function useAtualizarFuncionarioAtivo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('funcionarios').update({ ativo }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['funcionarios'] }),
  })
}
