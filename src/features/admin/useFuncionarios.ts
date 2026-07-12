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

export interface ResultadoCriarFuncionario {
  reaproveitado: boolean // true = e-mail já existia no Auth; conta reativada
}

const MENSAGENS_ERRO: Record<string, string> = {
  '42501': 'Só administradores podem criar funcionários.',
  '22004': 'Preencha nome e e-mail.',
  '22023': 'Senha muito curta — use pelo menos 6 caracteres.',
}

/** Cria (ou reativa) o funcionário via função `criar_ou_reativar_funcionario`
 *  (migration 0015): grava a senha inicial direto no Auth e deixa a conta já
 *  ATIVA e com e-mail confirmado. Funciona mesmo se o e-mail já existia (ex.:
 *  funcionário apagado e recriado) e não depende de e-mail de confirmação. */
export function useCriarFuncionario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      nome,
      email,
      senha,
    }: NovoFuncionario): Promise<ResultadoCriarFuncionario> => {
      const { data, error } = await supabase.rpc('criar_ou_reativar_funcionario', {
        p_nome: nome,
        p_email: email,
        p_senha: senha,
      })
      if (error) throw new Error(MENSAGENS_ERRO[error.code] ?? 'falha')
      const resultado = data as { ok?: boolean; reaproveitado?: boolean } | null
      if (!resultado?.ok) throw new Error('falha')
      return { reaproveitado: resultado.reaproveitado === true }
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
