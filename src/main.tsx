import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { consumirHashDeRecuperacao } from './lib/recuperacaoSenha'

// O hash do link de recuperação é consumido antes de montar o React: assim a
// URL já está reescrita quando o HashRouter lê a rota, e a sessão já está
// estabelecida quando a tela de nova senha consulta o Supabase.
consumirHashDeRecuperacao().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
