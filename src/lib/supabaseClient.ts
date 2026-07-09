import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if ((!url || !anonKey) && import.meta.env.PROD) {
  throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente de build')
}

// Em dev/teste sem .env.local o cliente aponta para um host inexistente;
// o login exibirá erro de conexão até as variáveis serem configuradas.
export const supabase = createClient<Database>(
  url ?? 'http://localhost:54321',
  anonKey ?? 'chave-dev',
)
