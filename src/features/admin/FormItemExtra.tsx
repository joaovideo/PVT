import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { Select } from '../../components/Select'
import { useItensExtrasAdmin } from './useItensExtras'
import type { ItemExtra } from './useItensExtras'
import { CATEGORIAS_ITENS, type CategoriaItem } from './categoriasItens'

interface Props {
  aberto: boolean
  item: ItemExtra | null // null = novo item
  aoFechar: () => void
}

export function FormItemExtra({ aberto, item, aoFechar }: Props) {
  const { criar, atualizar } = useItensExtrasAdmin()
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState<CategoriaItem>('Outros')
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    setNome(item?.nome ?? '')
    setValor(item ? String(item.valor_unitario) : '')
    setCategoria((item?.categoria as CategoriaItem) ?? 'Outros')
    setAtivo(item?.ativo ?? true)
    setErro(null)
  }, [aberto, item])

  const salvando = criar.isPending || atualizar.isPending

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    const campos = { nome, valor_unitario: Number(valor), categoria, ativo }
    try {
      if (item) await atualizar.mutateAsync({ id: item.id, ...campos })
      else await criar.mutateAsync(campos)
      aoFechar()
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    }
  }

  return (
    <Modal aberto={aberto} titulo={item ? 'Editar item' : 'Novo item extra'} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <Input rotulo="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <Select
          rotulo="Categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CategoriaItem)}
        >
          {CATEGORIAS_ITENS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Input
          rotulo="Valor unitário (R$)"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          required
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        {item && (
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-5 w-5"
            />
            Item ativo (desmarque para tirar do cardápio)
          </label>
        )}
        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </Modal>
  )
}
