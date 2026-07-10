import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Select } from '../../components/Select'
import { Input } from '../../components/Input'
import { formatarMoeda, reaisParaCentavos } from '../../lib/formatadores'
import { useItensExtrasAtivos, type ItemExtra } from '../admin/useItensExtras'
import { ordemCategoria } from '../admin/categoriasItens'
import { useFuncionarioAtual } from '../auth/useFuncionarioAtual'
import { useLancarDespesa } from './useAcoesReserva'

/** Agrupa os itens por categoria, na ordem do cardápio (não alfabética), com os
 *  itens de cada grupo em ordem alfabética. Espelha o que a tela de Admin faz. */
function agruparPorCategoria(itens: ItemExtra[]): [string, ItemExtra[]][] {
  const grupos = new Map<string, ItemExtra[]>()
  for (const item of itens) {
    const categoria = item.categoria ?? 'Outros'
    const grupo = grupos.get(categoria)
    if (grupo) grupo.push(item)
    else grupos.set(categoria, [item])
  }
  return [...grupos.entries()].sort(([a], [b]) => ordemCategoria(a) - ordemCategoria(b))
}

/** Valor do <option> do item avulso. Não colide com id do catálogo (números). */
const AVULSO = 'avulso'

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
  // Texto, não número: guardar número forçava o campo de volta para 1 assim que
  // ficava vazio, tornando o dígito impossível de apagar.
  const [quantidade, setQuantidade] = useState('1')
  const [descricaoAvulsa, setDescricaoAvulsa] = useState('')
  const [valorAvulso, setValorAvulso] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    setItemId('')
    setQuantidade('1')
    setDescricaoAvulsa('')
    setValorAvulso('')
    setErro(null)
  }, [aberto])

  const avulso = itemId === AVULSO
  const item = itens.data?.find((i) => String(i.id) === itemId)
  const grupos = agruparPorCategoria(itens.data ?? [])

  const qtd = Number(quantidade)
  const qtdValida = quantidade !== '' && Number.isInteger(qtd) && qtd >= 1

  // O catálogo guarda valor_unitario em reais (numeric); o avulso segue o mesmo.
  const valorUnitario = avulso ? Number(valorAvulso) : (item?.valor_unitario ?? 0)
  const avulsoValido =
    descricaoAvulsa.trim() !== '' &&
    valorAvulso !== '' &&
    Number.isFinite(valorUnitario) &&
    valorUnitario > 0
  const podeCalcular = qtdValida && (avulso ? avulsoValido : !!item)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    if (!funcionario || (!avulso && !item)) {
      setErro('Escolha um item.')
      return
    }
    if (!qtdValida) {
      setErro('Informe uma quantidade de pelo menos 1.')
      return
    }
    if (avulso && !avulsoValido) {
      setErro('Para "Outro", preencha a descrição e um valor maior que zero.')
      return
    }
    try {
      // O avulso não vai para o catálogo — vive só nesta despesa. A tabela
      // despesas_extras guarda descrição e valor próprios, sem FK para o item.
      await lancar.mutateAsync({
        reservaId,
        descricao: avulso ? descricaoAvulsa.trim() : item!.nome,
        quantidade: qtd,
        valorUnitario,
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
          {grupos.map(([categoria, itensDoGrupo]) => (
            <optgroup key={categoria} label={categoria}>
              {itensDoGrupo.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome} — {formatarMoeda(reaisParaCentavos(i.valor_unitario))}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={AVULSO}>Outro (digitar descrição e valor)</option>
        </Select>
        {avulso && (
          <>
            <Input
              rotulo="Descrição"
              required
              maxLength={120}
              placeholder="ex.: taxa de lavanderia"
              value={descricaoAvulsa}
              onChange={(e) => setDescricaoAvulsa(e.target.value)}
            />
            <Input
              rotulo="Valor unitário (R$)"
              type="number"
              inputMode="decimal"
              min={0.01}
              step={0.01}
              required
              placeholder="0,00"
              value={valorAvulso}
              onChange={(e) => setValorAvulso(e.target.value)}
            />
          </>
        )}
        <Input
          rotulo="Quantidade"
          type="number"
          inputMode="numeric"
          min={1}
          required
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
        {podeCalcular && (
          <p className="text-sm text-slate-500">
            Total: <strong>{formatarMoeda(reaisParaCentavos(valorUnitario * qtd))}</strong>
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
