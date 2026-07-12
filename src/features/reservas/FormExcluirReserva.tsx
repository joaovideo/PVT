import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { useExcluirReserva } from './useExcluirReserva'

interface Props {
  aberto: boolean
  reservaId: number
  aoFechar: () => void
  aoExcluir: () => void
}

/** Exclusão definitiva de uma reserva pelo admin. A reserva sai de todas as
 *  telas e libera o quarto; o histórico financeiro é arquivado antes de apagar
 *  (migration 0014). Exige motivo para rastreabilidade no arquivo. */
export function FormExcluirReserva({ aberto, reservaId, aoFechar, aoExcluir }: Props) {
  const excluir = useExcluirReserva()
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
      setErro('Informe o motivo da exclusão.')
      return
    }
    try {
      await excluir.mutateAsync({ reservaId, motivo: motivo.trim() })
      aoExcluir()
    } catch (e) {
      const codigo = (e as { code?: string })?.code
      if (codigo === '42501') {
        setErro('Só administradores podem excluir reservas.')
      } else {
        setErro('Não foi possível excluir. Tente de novo.')
      }
    }
  }

  return (
    <Modal aberto={aberto} titulo="Excluir reserva" aoFechar={aoFechar}>
      <form onSubmit={confirmar} className="flex flex-col gap-3">
        <p className="text-sm text-slate-600">
          A reserva sai de todas as telas e o quarto é liberado. O histórico financeiro (pagamentos,
          despesas e log) é arquivado para auditoria antes de apagar.{' '}
          <strong>Esta ação não pode ser desfeita pelo app.</strong>
        </p>
        <Input
          rotulo="Motivo da exclusão"
          required
          placeholder="Reserva de teste, duplicada, erro de lançamento…"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <Button type="submit" variante="perigo" disabled={excluir.isPending}>
          {excluir.isPending ? 'Excluindo…' : 'Excluir reserva definitivamente'}
        </Button>
      </form>
    </Modal>
  )
}
