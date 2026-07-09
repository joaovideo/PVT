import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if ((!url || !anonKey) && import.meta.env.PROD) {
  throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente de build')
}

// Em dev/teste sem .env.local o cliente aponta para um host inexistente;
// o login exibirá erro de conexão até as variáveis serem configuradas.
// detectSessionInUrl: false — o token de recuperação de senha vem no hash
// (#access_token=...), o que colide com o HashRouter. Tratamos isso à mão
// em main.tsx antes do React montar, para não perder o token na corrida.
export const supabase = createClient<Database>(
  url ?? 'http://localhost:54321',
  anonKey ?? 'chave-dev',
  {
    auth: { detectSessionInUrl: false },
  },
)

/** Base pública do app (ex.: https://joaovideo.github.io/PVT/). Usada como
 *  destino dos links de e-mail. Quando disparado pelo site publicado,
 *  window.location.origin já é o domínio de produção. */
export const urlBaseApp = `${window.location.origin}${import.meta.env.BASE_URL}`
