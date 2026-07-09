import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'

/** Tela onde o link de redefinição de senha (do e-mail) cai. O supabase-js
 *  processa o token da URL e estabelece uma sessão de recuperação; aqui a
 *  pessoa escolhe a senha nova. Fica FORA do AuthGate para funcionar mesmo
 *  para quem ainda não é funcionário ativo. */
export function TelaNovaSenha() {
  const [temSessaoRecuperacao, setTemSessaoRecuperacao] = useState<boolean | null>(null)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    // O evento PASSWORD_RECOVERY confirma que viemos de um link válido.
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'PASSWORD_RECOVERY') setTemSessaoRecuperacao(true)
    })
    // Também cobre o caso de a sessão já ter sido estabelecida antes do listener.
    supabase.auth.getSession().then(({ data: s }) => {
      setTemSessaoRecuperacao((atual) => atual ?? s.session !== null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)
    if (error) {
      setErro(
        error.message.includes('should be at least')
          ? 'Senha muito curta — use pelo menos 6 caracteres.'
          : 'Não foi possível salvar a senha. Peça um novo link e tente de novo.',
      )
      return
    }
    setSucesso(true)
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="text-center text-3xl font-bold text-slate-800">PVT — Nova senha</h1>

      {sucesso ? (
        <div className="mt-6 flex w-full max-w-sm flex-col gap-3 text-center">
          <p className="text-slate-600">Senha atualizada! Já pode entrar com a senha nova.</p>
          <a href="#/mapa">
            <Button>Ir para o app</Button>
          </a>
        </div>
      ) : temSessaoRecuperacao === false ? (
        <p className="mt-6 max-w-sm text-center text-slate-500">
          Link inválido ou expirado. Volte ao login e use “Esqueci minha senha” para receber um
          novo.
        </p>
      ) : (
        <form onSubmit={salvar} className="mt-6 flex w-full max-w-sm flex-col gap-3">
          <Input
            rotulo="Nova senha"
            type="password"
            required
            minLength={6}
            placeholder="mínimo 6 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {erro && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </p>
          )}
          <Button type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </form>
      )}
    </main>
  )
}
