import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  aberto: boolean
  aoFechar: () => void
}

/** Troca de senha do próprio funcionário logado — sem e-mail, só precisa
 *  estar logado. É o caminho mais confiável para trocar a senha. */
export function TrocarSenhaModal({ aberto, aoFechar }: Props) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setSenha('')
    setErro(null)
    setSalvando(false)
    setSucesso(false)
  }, [aberto])

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
          : 'Não foi possível trocar a senha. Tente de novo.',
      )
      return
    }
    setSucesso(true)
  }

  return (
    <Modal aberto={aberto} titulo="Trocar minha senha" aoFechar={aoFechar}>
      {sucesso ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-600">Senha trocada! Use a nova no próximo login.</p>
          <Button onClick={aoFechar}>Ok</Button>
        </div>
      ) : (
        <form onSubmit={salvar} className="flex flex-col gap-3">
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
    </Modal>
  )
}
