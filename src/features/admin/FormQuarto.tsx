import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { useQuartosAdmin } from '../quartos/useQuartosAdmin'
import type { Quarto } from '../quartos/useQuartos'

interface Props {
  aberto: boolean
  quarto: Quarto | null // null = novo quarto
  aoFechar: () => void
}

export function FormQuarto({ aberto, quarto, aoFechar }: Props) {
  const { criar, atualizar } = useQuartosAdmin()
  const [nome, setNome] = useState('')
  const [camasCasal, setCamasCasal] = useState(0)
  const [camasSolteiro, setCamasSolteiro] = useState(0)
  const [capacidade, setCapacidade] = useState(2)
  const [observacoes, setObservacoes] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    setNome(quarto?.nome ?? '')
    setCamasCasal(quarto?.camas_casal ?? 0)
    setCamasSolteiro(quarto?.camas_solteiro ?? 0)
    setCapacidade(quarto?.capacidade_max ?? 2)
    setObservacoes(quarto?.observacoes ?? '')
    setAtivo(quarto?.ativo ?? true)
    setErro(null)
  }, [aberto, quarto])

  const salvando = criar.isPending || atualizar.isPending

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    const campos = {
      nome,
      camas_casal: camasCasal,
      camas_solteiro: camasSolteiro,
      capacidade_max: capacidade,
      observacoes: observacoes || null,
      ativo,
    }
    try {
      if (quarto) await atualizar.mutateAsync({ id: quarto.id, ...campos })
      else await criar.mutateAsync(campos)
      aoFechar()
    } catch {
      setErro('Não foi possível salvar. Verifique a conexão e tente de novo.')
    }
  }

  return (
    <Modal aberto={aberto} titulo={quarto ? 'Editar quarto' : 'Novo quarto'} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <Input rotulo="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <Input
            rotulo="Camas casal"
            type="number"
            min={0}
            required
            value={camasCasal}
            onChange={(e) => setCamasCasal(Number(e.target.value))}
          />
          <Input
            rotulo="Camas solteiro"
            type="number"
            min={0}
            required
            value={camasSolteiro}
            onChange={(e) => setCamasSolteiro(Number(e.target.value))}
          />
          <Input
            rotulo="Capacidade"
            type="number"
            min={1}
            required
            value={capacidade}
            onChange={(e) => setCapacidade(Number(e.target.value))}
          />
        </div>
        <Input
          rotulo="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
        {quarto && (
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-5 w-5"
            />
            Quarto ativo (desmarque para desativar)
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
