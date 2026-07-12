import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import type { Pousada } from '../pousada/usePousada'

/** O usuário logado é super-admin (plano plataforma)? Via RPC eh_super_admin(). */
export function useSuperAdmin() {
  return useQuery({
    queryKey: ['eh-super-admin'],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('eh_super_admin')
      if (error) throw error
      return data === true
    },
  })
}

/** Lista TODAS as pousadas — o RLS (0018) só devolve tudo para super-admin. */
export function usePousadasTodas(habilitado: boolean) {
  return useQuery({
    queryKey: ['pousadas-todas'],
    enabled: habilitado,
    queryFn: async (): Promise<Pousada[]> => {
      const { data, error } = await supabase.from('pousadas').select('*').order('id')
      if (error) throw error
      return data
    },
  })
}

export interface NovaPousada {
  slug: string
  nome: string
  adminEmail: string
  adminSenha: string
  adminNome: string
  endereco: string
}

const MENSAGENS: Record<string, string> = {
  '42501': 'Sem permissão (só super-admin) ou e-mail já cadastrado.',
  '22004': 'Preencha slug, nome e e-mail do admin.',
  '22023': 'Senha do admin muito curta (mín. 6).',
  '23505': 'Esse slug já existe — escolha outro.',
}

/** Cria uma pousada + o primeiro admin, via RPC criar_pousada_com_admin.
 *  Funciona direto para um super-admin logado (o JWT informa o auth.uid). */
export function useCriarPousada() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: NovaPousada) => {
      const { data, error } = await supabase.rpc('criar_pousada_com_admin', {
        p_slug: p.slug.trim(),
        p_nome: p.nome.trim(),
        p_admin_email: p.adminEmail.trim(),
        p_admin_senha: p.adminSenha,
        p_admin_nome: p.adminNome.trim(),
        p_endereco: p.endereco.trim() || undefined,
      })
      if (error) throw new Error(MENSAGENS[error.code] ?? 'Não foi possível criar a pousada.')
      return data as { pousada_id: number; slug: string; admin_email: string }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pousadas-todas'] }),
  })
}
