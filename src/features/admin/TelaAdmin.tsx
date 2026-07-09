import { useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { useQuartos, type Quarto } from '../quartos/useQuartos'
import { useQuartosAdmin } from '../quartos/useQuartosAdmin'
import { useBloqueios, useBloqueiosAdmin } from './useBloqueios'
import { formatarData, formatarMoeda, reaisParaCentavos } from '../../lib/formatadores'
import { FormQuarto } from './FormQuarto'
import { FormBloqueio } from './FormBloqueio'
import { FormItemExtra } from './FormItemExtra'
import { SecaoValores } from './SecaoValores'
import { SecaoFuncionarios } from './SecaoFuncionarios'
import { useItensExtras, useItensExtrasAdmin, type ItemExtra } from './useItensExtras'
import { useFuncionarioAtual } from '../auth/useFuncionarioAtual'

export function TelaAdmin() {
  const quartos = useQuartos()
  const bloqueios = useBloqueios()
  const itensExtras = useItensExtras()
  const { apagar: apagarQuarto } = useQuartosAdmin()
  const { apagar: apagarItem } = useItensExtrasAdmin()
  const { funcionario: eu } = useFuncionarioAtual()
  const { excluir: desbloquear } = useBloqueiosAdmin()

  const [modalQuarto, setModalQuarto] = useState<{ quarto: Quarto | null } | null>(null)
  const [modalBloqueio, setModalBloqueio] = useState(false)
  const [modalItem, setModalItem] = useState<{ item: ItemExtra | null } | null>(null)
  const [confirmarQuarto, setConfirmarQuarto] = useState<number | null>(null)
  const [confirmarItem, setConfirmarItem] = useState<number | null>(null)

  const ehAdmin = eu?.admin === true

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
      {ehAdmin && (
        <section>
          <h1 className="mb-2 text-lg font-bold text-slate-800">Valores da diária</h1>
          <SecaoValores />
        </section>
      )}

      {ehAdmin && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Quartos</h2>
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
                      onClick={() => setConfirmarQuarto(quarto.id)}
                      className="min-h-11 rounded-lg px-3 text-sm font-medium text-red-600 active:bg-red-50"
                    >
                      Apagar
                    </button>
                  </div>
                </div>
                {confirmarQuarto === quarto.id && (
                  <div className="mt-2 flex flex-col gap-2 rounded-lg bg-red-50 p-2 text-sm">
                    <p className="text-red-700">
                      Apagar <strong>{quarto.nome}</strong> de vez? Reservas antigas continuam
                      registradas com o nome do quarto. Não dá para desfazer.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await apagarQuarto.mutateAsync(quarto.id)
                          setConfirmarQuarto(null)
                        }}
                        disabled={apagarQuarto.isPending}
                        className="min-h-9 rounded-lg bg-red-600 px-3 font-medium text-white active:bg-red-700"
                      >
                        {apagarQuarto.isPending ? 'Apagando…' : 'Apagar de vez'}
                      </button>
                      <button
                        onClick={() => setConfirmarQuarto(null)}
                        className="min-h-9 rounded-lg px-3 font-medium text-slate-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {ehAdmin && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Itens extras</h2>
            <Button variante="secundario" onClick={() => setModalItem({ item: null })}>
              + Novo item
            </Button>
          </div>
          <ul className="flex flex-col gap-2">
            {itensExtras.data?.map((item) => (
              <li key={item.id} className="rounded-lg bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.nome}
                      {!item.ativo && (
                        <span className="ml-2 align-middle">
                          <Badge variante="nao_pago">Fora do cardápio</Badge>
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatarMoeda(reaisParaCentavos(item.valor_unitario))}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setModalItem({ item })}
                      className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-600 active:bg-slate-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmarItem(item.id)}
                      className="min-h-11 rounded-lg px-3 text-sm font-medium text-red-600 active:bg-red-50"
                    >
                      Apagar
                    </button>
                  </div>
                </div>
                {confirmarItem === item.id && (
                  <div className="mt-2 flex flex-col gap-2 rounded-lg bg-red-50 p-2 text-sm">
                    <p className="text-red-700">
                      Apagar <strong>{item.nome}</strong> do cardápio? Despesas já lançadas não são
                      afetadas.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await apagarItem.mutateAsync(item.id)
                          setConfirmarItem(null)
                        }}
                        disabled={apagarItem.isPending}
                        className="min-h-9 rounded-lg bg-red-600 px-3 font-medium text-white active:bg-red-700"
                      >
                        {apagarItem.isPending ? 'Apagando…' : 'Apagar'}
                      </button>
                      <button
                        onClick={() => setConfirmarItem(null)}
                        className="min-h-9 rounded-lg px-3 font-medium text-slate-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ehAdmin && <SecaoFuncionarios />}

      <FormQuarto
        aberto={modalQuarto !== null}
        quarto={modalQuarto?.quarto ?? null}
        aoFechar={() => setModalQuarto(null)}
      />
      <FormItemExtra
        aberto={modalItem !== null}
        item={modalItem?.item ?? null}
        aoFechar={() => setModalItem(null)}
      />
      <FormBloqueio
        aberto={modalBloqueio}
        quartos={ativos}
        aoFechar={() => setModalBloqueio(false)}
      />
    </div>
  )
}
