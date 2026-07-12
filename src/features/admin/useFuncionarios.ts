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
  sem_sessao: 'Sua sessão expirou. Entre de novo e tente.',
  nao_admin: 'Só administradores podem criar funcionários.',
  senha_curta: 'Senha muito curta — use pelo menos 6 caracteres.',
  dados_invalidos: 'Preencha nome, e-mail e senha.',
}

/** Cria (ou reativa) o funcionário via Edge Function `admin-criar-funcionario`,
 *  que usa a service_role no servidor: define a senha inicial e já deixa a
 *  conta ATIVA e com e-mail confirmado — funciona mesmo se o e-mail já existia
 *  no Auth (ex.: funcionário apagado e recriado). Não depende de e-mail de
 *  confirmação e não troca a sessão do admin atual. */
export function useCriarFuncionario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      nome,
      email,
      senha,
    }: NovoFuncionario): Promise<ResultadoCriarFuncionario> => {
      const { data, error } = await supabase.functions.invoke('admin-criar-funcionario', {
        body: { nome, email, senha },
      })
      // Erros esperados voltam como { ok:false, erro } com status !=2xx → o
      // invoke marca `error`, mas o corpo com o código vem em error.context.
      if (error) {
        let codigo: string | undefined
        try {
          codigo = (await (error as { context?: Response }).context?.json())?.erro
        } catch {
          codigo = undefined
        }
        throw new Error(codigo && MENSAGENS_ERRO[codigo] ? MENSAGENS_ERRO[codigo] : 'falha')
      }
      if (!data?.ok) {
        const codigo = data?.erro as string | undefined
        throw new Error(codigo && MENSAGENS_ERRO[codigo] ? MENSAGENS_ERRO[codigo] : 'falha')
      }
      return { reaproveitado: data.reaproveitado === true }
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
