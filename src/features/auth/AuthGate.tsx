import type { ReactNode } from 'react'
import { useFuncionarioAtual } from './useFuncionarioAtual'
import { TelaLogin } from './TelaLogin'

/**
 * Guarda de acesso: exige sessão válida E funcionário ativo.
 * O shell definitivo com navegação chega na Issue #5; por ora o cabeçalho
 * mínimo aqui cumpre o critério "nome do funcionário no cabeçalho".
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { carregando, session, funcionario, sair } = useFuncionarioAtual()

  if (carregando) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50">
        <p className="text-slate-500">Carregando…</p>
      </main>
    )
  }

  if (!session) return <TelaLogin />

  if (!funcionario || !funcionario.ativo) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 px-4">
        <p className="text-center text-slate-700">
          Seu usuário não tem acesso ao sistema. Fale com a administração da pousada.
        </p>
        <button
          onClick={sair}
          className="min-h-11 rounded-lg bg-slate-800 px-6 font-semibold text-white"
        >
          Sair
        </button>
      </main>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="flex min-h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4">
        <span className="font-bold text-slate-800">PVT</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{funcionario.nome}</span>
          <button onClick={sair} className="min-h-11 px-2 text-sm font-medium text-slate-500">
            Sair
          </button>
        </div>
      </header>
      {children}
    </div>
  )
}
