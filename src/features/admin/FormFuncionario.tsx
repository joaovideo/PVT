import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { useCriarFuncionario } from './useFuncionarios'

interface Props {
  aberto: boolean
  aoFechar: () => void
}

export function FormFuncionario({ aberto, aoFechar }: Props) {
  const criar = useCriarFuncionario()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setNome('')
    setEmail('')
    setSenha('')
    setErro(null)
    setSucesso(false)
  }, [aberto])

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    try {
      await criar.mutateAsync({ nome, email, senha })
      setSucesso(true)
    } catch (e) {
      const mensagem = (e as { message?: string })?.message ?? ''
      if (mensagem.includes('already registered') || mensagem.includes('already been registered')) {
        setErro('Esse e-mail já está cadastrado.')
      } else if (mensagem.includes('Password')) {
        setErro('Senha muito curta — use pelo menos 6 caracteres.')
      } else {
        setErro('Não foi possível criar o funcionário. Tente de novo.')
      }
    }
  }

  if (sucesso) {
    return (
      <Modal aberto={aberto} titulo="Funcionário criado" aoFechar={aoFechar}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-600">
            <strong>{nome}</strong> foi criado. Peça para conferir o e-mail (
            <strong>{email}</strong>) e confirmar o cadastro antes de fazer o primeiro login.
          </p>
          <Button onClick={aoFechar}>Ok</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal aberto={aberto} titulo="Novo funcionário" aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <Input rotulo="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <Input
          rotulo="E-mail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          rotulo="Senha inicial"
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
        <Button type="submit" disabled={criar.isPending}>
          {criar.isPending ? 'Criando…' : 'Criar funcionário'}
        </Button>
      </form>
    </Modal>
  )
}
