import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'

export function TelaLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setEnviando(false)
    if (error) {
      setErro(
        error.message.includes('fetch')
          ? 'Não foi possível conectar ao servidor. Verifique a configuração.'
          : 'E-mail ou senha inválidos.',
      )
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="text-center text-3xl font-bold text-slate-800">PVT — Sistema de Reservas</h1>
      <p className="mt-1 text-center text-slate-500">Acesso de funcionários</p>

      <form onSubmit={entrar} className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-slate-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Senha
          <input
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-slate-500"
          />
        </label>

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="min-h-11 rounded-lg bg-slate-800 font-semibold text-white active:bg-slate-700 disabled:opacity-60"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
