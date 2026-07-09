import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Select } from '../../components/Select'
import { Input } from '../../components/Input'
import { formatarMoeda, reaisParaCentavos } from '../../lib/formatadores'
import { useItensExtrasAtivos } from '../admin/useItensExtras'
import { useFuncionarioAtual } from '../auth/useFuncionarioAtual'
import { useLancarDespesa } from './useAcoesReserva'

interface Props {
  aberto: boolean
  reservaId: number
  aoFechar: () => void
}

export function FormLancarDespesa({ aberto, reservaId, aoFechar }: Props) {
  const itens = useItensExtrasAtivos()
  const { funcionario } = useFuncionarioAtual()
  const lancar = useLancarDespesa()
  const [itemId, setItemId] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    setItemId('')
    setQuantidade(1)
    setErro(null)
  }, [aberto])

  const item = itens.data?.find((i) => String(i.id) === itemId)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    if (!item || !funcionario) {
      setErro('Escolha um item.')
      return
    }
    try {
      await lancar.mutateAsync({
        reservaId,
        descricao: item.nome,
        quantidade,
        valorUnitario: item.valor_unitario,
        lancadaPor: funcionario.id,
      })
      aoFechar()
    } catch {
      setErro('Não foi possível lançar a despesa. Tente de novo.')
    }
  }

  return (
    <Modal aberto={aberto} titulo="Lançar despesa" aoFechar={aoFechar}>
      <form onSubmit={enviar} className="flex flex-col gap-3">
        <Select rotulo="Item" required value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">Escolha…</option>
          {itens.data?.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome} — {formatarMoeda(reaisParaCentavos(i.valor_unitario))}
            </option>
          ))}
        </Select>
        <Input
          rotulo="Quantidade"
          type="number"
          min={1}
          required
          value={quantidade}
          onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
        />
        {item && (
          <p className="text-sm text-slate-500">
            Total:{' '}
            <strong>{formatarMoeda(reaisParaCentavos(item.valor_unitario * quantidade))}</strong>
          </p>
        )}
        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <Button type="submit" disabled={lancar.isPending}>
          {lancar.isPending ? 'Lançando…' : 'Lançar despesa'}
        </Button>
      </form>
    </Modal>
  )
}
