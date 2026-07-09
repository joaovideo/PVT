import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useFuncionarioAtual } from '../features/auth/useFuncionarioAtual'
import { SinoAvisos } from '../features/avisos/SinoAvisos'
import { TrocarSenhaModal } from '../features/auth/TrocarSenhaModal'

const abas = [
  {
    para: '/mapa',
    rotulo: 'Mapa',
    icone: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-6 w-6"
      >
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 4v17M3 15h18" />
      </svg>
    ),
  },
  {
    para: '/chegadas',
    rotulo: 'Chegadas',
    icone: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-6 w-6"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    para: '/reservas',
    rotulo: 'Reservas',
    icone: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-6 w-6"
      >
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    para: '/admin',
    rotulo: 'Admin',
    icone: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-6 w-6"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2" />
      </svg>
    ),
  },
]

export function AppShell() {
  const { funcionario, sair } = useFuncionarioAtual()
  const [trocarSenha, setTrocarSenha] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col bg-fundo">
      <header className="sticky top-0 z-10 flex min-h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <span className="text-lg font-bold text-marca">PVT</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTrocarSenha(true)}
            className="min-h-11 px-1 text-sm text-slate-600 underline decoration-slate-300"
            title="Trocar minha senha"
          >
            {funcionario?.nome}
          </button>
          <SinoAvisos />
          <button onClick={sair} className="min-h-11 px-2 text-sm font-medium text-slate-500">
            Sair
          </button>
        </div>
      </header>

      <TrocarSenhaModal aberto={trocarSenha} aoFechar={() => setTrocarSenha(false)} />

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
      >
        {abas.map((aba) => (
          <NavLink
            key={aba.para}
            to={aba.para}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                isActive ? 'font-semibold text-marca' : 'text-slate-400'
              }`
            }
          >
            {aba.icone}
            {aba.rotulo}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
