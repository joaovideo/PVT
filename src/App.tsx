import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './features/auth/AuthGate'
import { AppShell } from './components/AppShell'
import { QueryProvider } from './lib/QueryProvider'
import { TelaTesteDados } from './features/reservas/TelaTesteDados'
import { TelaChegadas } from './features/reservas/TelaChegadas'
import { TelaMapa } from './features/mapa/TelaMapa'
import { TelaOrcamento } from './features/reservas/TelaOrcamento'
import { TelaListaReservas } from './features/reservas/TelaListaReservas'
import { TelaReservaDetalhe } from './features/reservas/TelaReservaDetalhe'
import { TelaAdmin } from './features/admin/TelaAdmin'
import { TelaPlataforma } from './features/plataforma/TelaPlataforma'
import { TelaNovaSenha } from './features/auth/TelaNovaSenha'

// HashRouter: as rotas funcionam no GitHub Pages sem fallback de servidor
function App() {
  return (
    <QueryProvider>
      <HashRouter>
        <Routes>
          {/* Redefinição de senha: fora do AuthGate — o link do e-mail precisa
              abrir mesmo para quem ainda não é funcionário ativo. */}
          <Route path="/nova-senha" element={<TelaNovaSenha />} />

          <Route
            element={
              <AuthGate>
                <AppShell />
              </AuthGate>
            }
          >
            <Route path="/" element={<Navigate to="/mapa" replace />} />
            <Route path="/mapa" element={<TelaMapa />} />
            <Route path="/chegadas" element={<TelaChegadas />} />
            <Route path="/reservas" element={<TelaListaReservas />} />
            <Route path="/reservas/nova" element={<TelaOrcamento />} />
            <Route path="/reservas/:id" element={<TelaReservaDetalhe />} />
            <Route path="/admin" element={<TelaAdmin />} />
            {/* Área de super-admin — a própria tela barra quem não é (eh_super_admin) */}
            <Route path="/plataforma" element={<TelaPlataforma />} />
            {/* Rota temporária da Issue #6 (fora da navegação): valida os hooks */}
            <Route path="/dev-dados" element={<TelaTesteDados />} />
            <Route path="*" element={<Navigate to="/mapa" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryProvider>
  )
}

export default App
