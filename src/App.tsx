import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './features/auth/AuthGate'
import { AppShell } from './components/AppShell'
import { PaginaPlaceholder } from './components/PaginaPlaceholder'

// HashRouter: as rotas funcionam no GitHub Pages sem fallback de servidor
function App() {
  return (
    <AuthGate>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/mapa" replace />} />
            <Route path="/mapa" element={<PaginaPlaceholder titulo="Mapa de quartos" />} />
            <Route path="/chegadas" element={<PaginaPlaceholder titulo="Chegadas do dia" />} />
            <Route path="/reservas" element={<PaginaPlaceholder titulo="Reservas" />} />
            <Route path="/admin" element={<PaginaPlaceholder titulo="Administração" />} />
            <Route path="*" element={<Navigate to="/mapa" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthGate>
  )
}

export default App
