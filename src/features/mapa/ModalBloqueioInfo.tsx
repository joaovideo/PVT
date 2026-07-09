import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { formatarData } from '../../lib/formatadores'
import { useBloqueiosAdmin } from '../admin/useBloqueios'

interface Props {
  aberto: boolean
  bloqueioId: number | null
  motivo: string | null
  dataInicio: string | null
  dataFim: string | null
  aoFechar: () => void
}

export function ModalBloqueioInfo({
  aberto,
  bloqueioId,
  motivo,
  dataInicio,
  dataFim,
  aoFechar,
}: Props) {
  const { excluir } = useBloqueiosAdmin()

  async function desbloquear() {
    if (bloqueioId === null) return
    await excluir.mutateAsync(bloqueioId)
    aoFechar()
  }

  return (
    <Modal aberto={aberto} titulo="Quarto bloqueado" aoFechar={aoFechar}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-600">
          {motivo}
          {dataInicio && dataFim && (
            <>
              <br />
              {formatarData(dataInicio)} → {formatarData(dataFim)}
            </>
          )}
        </p>
        <Button variante="perigo" onClick={desbloquear} disabled={excluir.isPending}>
          {excluir.isPending ? 'Desbloqueando…' : 'Desbloquear'}
        </Button>
      </div>
    </Modal>
  )
}
