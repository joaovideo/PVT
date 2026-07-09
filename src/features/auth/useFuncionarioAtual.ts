import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'

export interface Funcionario {
  id: string
  nome: string
  ativo: boolean
  admin: boolean
}

interface EstadoAuth {
  carregando: boolean
  session: Session | null
  funcionario: Funcionario | null
}

/**
 * Sessão do Supabase Auth + linha correspondente em `funcionarios`.
 * Com RLS ativo, um funcionário com `ativo = false` não consegue ler a
 * própria linha — nesse caso `funcionario` fica null mesmo com sessão válida.
 */
export function useFuncionarioAtual() {
  const [estado, setEstado] = useState<EstadoAuth>({
    carregando: true,
    session: null,
    funcionario: null,
  })

  useEffect(() => {
    // Bypass SÓ em dev (import.meta.env.DEV é false em build de produção):
    // permite ver o shell sem Supabase configurado. VITE_BYPASS_AUTH=1 no .env.local.
    if (
      import.meta.env.DEV &&
      import.meta.env.MODE !== 'test' &&
      import.meta.env.VITE_BYPASS_AUTH === '1'
    ) {
      setEstado({
        carregando: false,
        session: {} as Session,
        funcionario: { id: 'dev', nome: 'Dev (sem auth)', ativo: true, admin: true },
      })
      return
    }

    let montado = true

    async function carregar(session: Session | null) {
      if (!session) {
        if (montado) setEstado({ carregando: false, session: null, funcionario: null })
        return
      }
      // select('*') (não colunas nomeadas) para o login não quebrar caso a
      // migration 0009 — que adiciona `admin` — ainda não tenha sido aplicada.
      const { data } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      const funcionario: Funcionario | null = data
        ? { id: data.id, nome: data.nome, ativo: data.ativo, admin: data.admin ?? false }
        : null
      if (montado) setEstado({ carregando: false, session, funcionario })
    }

    supabase.auth.getSession().then(({ data }) => carregar(data.session))
    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento, session) => {
      carregar(session)
    })

    return () => {
      montado = false
      assinatura.subscription.unsubscribe()
    }
  }, [])

  return {
    ...estado,
    sair: () => supabase.auth.signOut(),
  }
}
