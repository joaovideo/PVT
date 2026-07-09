import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { Select } from '../../components/Select'
import { useFuncionarioAtual } from '../auth/useFuncionarioAtual'
import { useRegistrarPagamento } from './useAcoesReserva'

interface Props {
  aberto: boolean
  reservaId: number
  saldoSugerido: number // reais
  aoFechar: () => void
}

const METODOS = [
  { valor: 'pix', rotulo: 'Pix' },
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'cartao', rotulo: 'Cartão' },
  { valor: 'transferencia', rotulo: 'Transferência' },
  { valor: 'outro', rotulo: 'Outro' },
]

export function FormRegistrarPagamento({ aberto, reservaId, saldoSugerido, aoFechar }: Props) {
  const { funcionario } = useFuncionarioAtual()
  const registrar = useRegistrarPagamento()
  const [valor, setValor] = useState('')
  const [metodo, setMetodo] = useState('pix')
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    setValor(saldoSugerido > 0 ? saldoSugerido.toFixed(2) : '')
    setMetodo('pix')
    setObservacao('')
    setErro(null)
  }, [aberto, saldoSugerido])

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    if (!funcionario) return
    try {
      await registrar.mutateAsync({
        reservaId,
        valor: Number(valor),
        metodo,
        recebidoPor: funcionario.id,
        observacao,
      })
      aoFechar()
    } catch {
      setErro('Não foi possível registrar o pagamento. Tente de novo.')
    }
  }

  return (
    <Modal aberto={aberto} titulo="Registrar pagamento" aoFechar={aoFechar}>
      <form onSubmit={enviar} className="flex flex-col gap-3">
        <Input
          rotulo="Valor (R$)"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          required
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <Select rotulo="Forma" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
          {METODOS.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.rotulo}
            </option>
          ))}
        </Select>
        <Input
          rotulo="Observação (opcional)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <Button type="submit" disabled={registrar.isPending}>
          {registrar.isPending ? 'Registrando…' : 'Registrar pagamento'}
        </Button>
      </form>
    </Modal>
  )
}
