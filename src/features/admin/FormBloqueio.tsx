import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { Select } from '../../components/Select'
import { useBloqueiosAdmin } from './useBloqueios'
import { useFuncionarioAtual } from '../auth/useFuncionarioAtual'
import type { Quarto } from '../quartos/useQuartos'

interface Props {
  aberto: boolean
  quartos: Quarto[]
  aoFechar: () => void
}

export function FormBloqueio({ aberto, quartos, aoFechar }: Props) {
  const { criar } = useBloqueiosAdmin()
  const { funcionario } = useFuncionarioAtual()
  const [quartoId, setQuartoId] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    setQuartoId('')
    setInicio('')
    setFim('')
    setMotivo('')
    setErro(null)
  }, [aberto])

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    if (!funcionario) return
    if (fim <= inicio) {
      setErro('A data final precisa ser depois da inicial.')
      return
    }
    try {
      await criar.mutateAsync({
        quarto_id: Number(quartoId),
        data_inicio: inicio,
        data_fim: fim,
        motivo,
        criado_por: funcionario.id,
      })
      aoFechar()
    } catch {
      setErro('Não foi possível bloquear. Tente de novo.')
    }
  }

  return (
    <Modal aberto={aberto} titulo="Bloquear quarto" aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <Select
          rotulo="Quarto"
          required
          value={quartoId}
          onChange={(e) => setQuartoId(e.target.value)}
        >
          <option value="">Escolha…</option>
          {quartos.map((quarto) => (
            <option key={quarto.id} value={quarto.id}>
              {quarto.nome}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input
            rotulo="De"
            type="date"
            required
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
          <Input
            rotulo="Até (livre neste dia)"
            type="date"
            required
            value={fim}
            onChange={(e) => setFim(e.target.value)}
          />
        </div>
        <Input
          rotulo="Motivo"
          required
          placeholder="Reforma, manutenção…"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <Button type="submit" disabled={criar.isPending}>
          {criar.isPending ? 'Bloqueando…' : 'Bloquear'}
        </Button>
      </form>
    </Modal>
  )
}
