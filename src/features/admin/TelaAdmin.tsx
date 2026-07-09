import { useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { useQuartos, type Quarto } from '../quartos/useQuartos'
import { useBloqueios, useBloqueiosAdmin } from './useBloqueios'
import { formatarData } from '../../lib/formatadores'
import { FormQuarto } from './FormQuarto'
import { FormTarifas } from './FormTarifas'
import { FormBloqueio } from './FormBloqueio'
import { SecaoConfigCrianca } from './SecaoConfigCrianca'

export function TelaAdmin() {
  const quartos = useQuartos()
  const bloqueios = useBloqueios()
  const { excluir: desbloquear } = useBloqueiosAdmin()

  const [modalQuarto, setModalQuarto] = useState<{ quarto: Quarto | null } | null>(null)
  const [modalTarifas, setModalTarifas] = useState<Quarto | null>(null)
  const [modalBloqueio, setModalBloqueio] = useState(false)

  if (quartos.isLoading) return <p className="p-4 text-slate-500">Carregando…</p>
  if (quartos.isError)
    return (
      <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
        Erro ao carregar os quartos. Verifique a conexão.
      </p>
    )

  const ativos = quartos.data?.filter((q) => q.ativo) ?? []

  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">Quartos</h1>
          <Button variante="secundario" onClick={() => setModalQuarto({ quarto: null })}>
            + Novo quarto
          </Button>
        </div>
        <ul className="flex flex-col gap-2">
          {quartos.data?.map((quarto) => (
            <li key={quarto.id} className="rounded-lg bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800">
                    {quarto.nome}
                    {!quarto.ativo && (
                      <span className="ml-2 align-middle">
                        <Badge variante="nao_pago">Desativado</Badge>
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {quarto.camas_casal} casal · {quarto.camas_solteiro} solteiro · até{' '}
                    {quarto.capacidade_max} pessoas
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setModalQuarto({ quarto })}
                    className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-600 active:bg-slate-100"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setModalTarifas(quarto)}
                    className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-600 active:bg-slate-100"
                  >
                    Tarifas
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-800">Criança (até 12 anos)</h2>
        <SecaoConfigCrianca />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Bloqueios</h2>
          <Button variante="secundario" onClick={() => setModalBloqueio(true)}>
            + Bloquear quarto
          </Button>
        </div>
        {bloqueios.data?.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum quarto bloqueado.</p>
        )}
        <ul className="flex flex-col gap-2">
          {bloqueios.data?.map((bloqueio) => (
            <li
              key={bloqueio.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-white p-3"
            >
              <div>
                <p className="font-semibold text-slate-800">{bloqueio.quartos?.nome}</p>
                <p className="text-sm text-slate-500">
                  {formatarData(bloqueio.data_inicio)} → {formatarData(bloqueio.data_fim)} ·{' '}
                  {bloqueio.motivo}
                </p>
              </div>
              <button
                onClick={() => desbloquear.mutate(bloqueio.id)}
                disabled={desbloquear.isPending}
                className="min-h-11 rounded-lg px-3 text-sm font-medium text-red-600 active:bg-red-50"
              >
                Desbloquear
              </button>
            </li>
          ))}
        </ul>
      </section>

      <FormQuarto
        aberto={modalQuarto !== null}
        quarto={modalQuarto?.quarto ?? null}
        aoFechar={() => setModalQuarto(null)}
      />
      <FormTarifas
        aberto={modalTarifas !== null}
        quarto={modalTarifas}
        aoFechar={() => setModalTarifas(null)}
      />
      <FormBloqueio
        aberto={modalBloqueio}
        quartos={ativos}
        aoFechar={() => setModalBloqueio(false)}
      />
    </div>
  )
}
