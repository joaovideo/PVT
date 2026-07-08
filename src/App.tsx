import { AuthGate } from './features/auth/AuthGate'

function App() {
  return (
    <AuthGate>
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-4">
        <h1 className="text-center text-3xl font-bold text-slate-800">PVT — Sistema de Reservas</h1>
        <p className="text-center text-slate-500">Gestão de reservas da pousada</p>
      </main>
    </AuthGate>
  )
}

export default App
