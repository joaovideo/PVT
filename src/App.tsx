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

// HashRouter: as rotas funcionam no GitHub Pages sem fallback de servidor
function App() {
  return (
    <QueryProvider>
      <AuthGate>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/mapa" replace />} />
              <Route path="/mapa" element={<TelaMapa />} />
              <Route path="/chegadas" element={<TelaChegadas />} />
              <Route path="/reservas" element={<TelaListaReservas />} />
              <Route path="/reservas/nova" element={<TelaOrcamento />} />
              <Route path="/reservas/:id" element={<TelaReservaDetalhe />} />
              <Route path="/admin" element={<TelaAdmin />} />
              {/* Rota temporária da Issue #6 (fora da navegação): valida os hooks */}
              <Route path="/dev-dados" element={<TelaTesteDados />} />
              <Route path="*" element={<Navigate to="/mapa" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthGate>
    </QueryProvider>
  )
}

export default App
