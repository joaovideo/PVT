import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './features/auth/AuthGate'
import { AppShell } from './components/AppShell'
import { PaginaPlaceholder } from './components/PaginaPlaceholder'
import { QueryProvider } from './lib/QueryProvider'
import { TelaTesteDados } from './features/reservas/TelaTesteDados'
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
              <Route path="/mapa" element={<PaginaPlaceholder titulo="Mapa de quartos" />} />
              <Route path="/chegadas" element={<PaginaPlaceholder titulo="Chegadas do dia" />} />
              <Route path="/reservas" element={<PaginaPlaceholder titulo="Reservas" />} />
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
