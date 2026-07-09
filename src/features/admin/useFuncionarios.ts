import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, urlBaseApp } from '../../lib/supabaseClient'
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

/** Cria o funcionário via Supabase Auth — o trigger da migration 0004/0009
 *  cria a linha em `funcionarios` (a partir da 0009 nasce INATIVO até um
 *  admin ativar). Como este projeto exige confirmação de e-mail, o signUp
 *  NÃO substitui a sessão do admin atual. */
export function useCriarFuncionario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nome, email, senha }: NovoFuncionario) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome }, emailRedirectTo: urlBaseApp },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['funcionarios'] }),
  })
}

/** Atualiza campos editáveis do funcionário (nome, ativo, admin). O e-mail
 *  guardado aqui é só referência — não altera o login (que vive no Auth). */
export function useAtualizarFuncionario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...campos
    }: {
      id: string
      nome?: string
      ativo?: boolean
      admin?: boolean
    }) => {
      const { error } = await supabase.from('funcionarios').update(campos).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['funcionarios'] }),
  })
}

/** Apaga o funcionário de vez. O histórico dele sobrevive: reservas,
 *  pagamentos, despesas e log guardam o nome congelado (migration 0009) e
 *  as FKs viram NULL em vez de bloquear a exclusão. Só admin (RLS). */
export function useApagarFuncionario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('funcionarios').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['funcionarios'] }),
  })
}

/** Dispara o e-mail de redefinição de senha para um endereço. Serve tanto
 *  para o "Esqueci minha senha" (a própria pessoa) quanto para o admin
 *  resetar a senha de um funcionário. O link volta para a tela de definir
 *  nova senha do app. Ninguém digita a senha do outro — a pessoa escolhe. */
export function useEnviarResetSenha() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: urlBaseApp,
      })
      if (error) throw error
    },
  })
}
