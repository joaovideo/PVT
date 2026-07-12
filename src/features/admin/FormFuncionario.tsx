import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { useAtualizarFuncionario, useCriarFuncionario, type Funcionario } from './useFuncionarios'

interface Props {
  aberto: boolean
  funcionario: Funcionario | null // null = novo; preenchido = editar nome
  aoFechar: () => void
}

export function FormFuncionario({ aberto, funcionario, aoFechar }: Props) {
  const criar = useCriarFuncionario()
  const atualizar = useAtualizarFuncionario()
  const editando = funcionario !== null

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<{ reaproveitado: boolean } | null>(null)

  useEffect(() => {
    if (!aberto) return
    setNome(funcionario?.nome ?? '')
    setEmail('')
    setSenha('')
    setErro(null)
    setSucesso(null)
  }, [aberto, funcionario])

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: funcionario.id, nome })
        aoFechar()
      } else {
        const resultado = await criar.mutateAsync({ nome, email, senha })
        setSucesso({ reaproveitado: resultado.reaproveitado })
      }
    } catch (e) {
      const mensagem = (e as { message?: string })?.message ?? ''
      // O hook já traduz os erros conhecidos; 'falha' é o genérico.
      setErro(
        mensagem && mensagem !== 'falha' ? mensagem : 'Não foi possível salvar. Tente de novo.',
      )
    }
  }

  if (sucesso) {
    return (
      <Modal aberto={aberto} titulo="Funcionário criado" aoFechar={aoFechar}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-600">
            <strong>{nome}</strong> foi {sucesso.reaproveitado ? 'reativado' : 'criado'} e já está{' '}
            <strong>ativo</strong>. A senha que você definiu já funciona — passe o e-mail (
            <strong>{email}</strong>) e a senha para a pessoa entrar. Não é preciso confirmar
            e-mail.
          </p>
          <Button onClick={aoFechar}>Ok</Button>
        </div>
      </Modal>
    )
  }

  const salvando = criar.isPending || atualizar.isPending

  return (
    <Modal
      aberto={aberto}
      titulo={editando ? 'Editar funcionário' : 'Novo funcionário'}
      aoFechar={aoFechar}
    >
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <Input rotulo="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        {!editando && (
          <>
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
          </>
        )}
        {editando && (
          <p className="text-xs text-slate-400">
            O e-mail de login não é editável por aqui. Para trocar a senha, use “Resetar senha” na
            lista.
          </p>
        )}
        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Criar funcionário'}
        </Button>
      </form>
    </Modal>
  )
}
