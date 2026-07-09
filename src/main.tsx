import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { supabase } from './lib/supabaseClient'

// Recuperação de senha: o link do e-mail volta para a raiz do site com o
// token no hash (#access_token=...&type=recovery). Como usamos HashRouter,
// esse hash colidiria com as rotas e o token se perderia. Então: capturamos
// o token AQUI (antes do React montar), estabelecemos a sessão de recuperação
// e reescrevemos a URL para a rota /nova-senha, já limpa.
const hashBruto = window.location.hash.replace(/^#/, '')
const inicioToken = hashBruto.indexOf('access_token=')
if (inicioToken !== -1 && hashBruto.includes('type=recovery')) {
  const params = new URLSearchParams(hashBruto.slice(inicioToken))
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  history.replaceState(null, '', `${import.meta.env.BASE_URL}#/nova-senha`)
  if (accessToken && refreshToken) {
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
