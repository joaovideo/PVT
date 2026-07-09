import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { useMudarStatusReserva } from './useAcoesReserva'

interface Props {
  aberto: boolean
  reservaId: number
  aoFechar: () => void
  aoCancelar: () => void
}

export function FormCancelarReserva({ aberto, reservaId, aoFechar, aoCancelar }: Props) {
  const mudarStatus = useMudarStatusReserva()
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto) return
    setMotivo('')
    setErro(null)
  }, [aberto])

  async function confirmar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    if (!motivo.trim()) {
      setErro('Informe o motivo do cancelamento.')
      return
    }
    try {
      await mudarStatus.mutateAsync({
        reservaId,
        status: 'cancelada',
        observacoes: `Cancelada: ${motivo.trim()}`,
      })
      aoCancelar()
    } catch {
      setErro('Não foi possível cancelar. Tente de novo.')
    }
  }

  return (
    <Modal aberto={aberto} titulo="Cancelar reserva" aoFechar={aoFechar}>
      <form onSubmit={confirmar} className="flex flex-col gap-3">
        <p className="text-sm text-slate-600">
          O quarto será liberado para esse período imediatamente. Essa ação não pode ser desfeita.
        </p>
        <Input
          rotulo="Motivo do cancelamento"
          required
          placeholder="Cliente desistiu, no-show, erro de lançamento…"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <Button type="submit" variante="perigo" disabled={mudarStatus.isPending}>
          {mudarStatus.isPending ? 'Cancelando…' : 'Cancelar reserva'}
        </Button>
      </form>
    </Modal>
  )
}
