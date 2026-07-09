import { useMemo, useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { formatarMoeda, reaisParaCentavos } from '../../lib/formatadores'
import { FormItemExtra } from './FormItemExtra'
import { useItensExtras, useItensExtrasAdmin, type ItemExtra } from './useItensExtras'
import { ordemCategoria } from './categoriasItens'

export function SecaoItensExtras() {
  const itens = useItensExtras()
  const { apagar } = useItensExtrasAdmin()
  const [modal, setModal] = useState<{ item: ItemExtra | null } | null>(null)
  const [confirmar, setConfirmar] = useState<number | null>(null)

  // Agrupa por categoria, na ordem fixa de CATEGORIAS_ITENS (não alfabética).
  const grupos = useMemo(() => {
    const porCategoria = new Map<string, ItemExtra[]>()
    for (const item of itens.data ?? []) {
      const lista = porCategoria.get(item.categoria) ?? []
      lista.push(item)
      porCategoria.set(item.categoria, lista)
    }
    return [...porCategoria.entries()].sort((a, b) => ordemCategoria(a[0]) - ordemCategoria(b[0]))
  }, [itens.data])

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Itens extras</h2>
        <Button variante="secundario" onClick={() => setModal({ item: null })}>
          + Novo item
        </Button>
      </div>

      {grupos.length === 0 && <p className="text-sm text-slate-500">Nenhum item cadastrado.</p>}

      <div className="flex flex-col gap-4">
        {grupos.map(([categoria, lista]) => (
          <div key={categoria}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {categoria} · {lista.length}
            </p>
            <ul className="flex flex-col gap-2">
              {lista.map((item) => (
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
                        onClick={() => setModal({ item })}
                        className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-600 active:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmar(item.id)}
                        className="min-h-11 rounded-lg px-3 text-sm font-medium text-red-600 active:bg-red-50"
                      >
                        Apagar
                      </button>
                    </div>
                  </div>
                  {confirmar === item.id && (
                    <div className="mt-2 flex flex-col gap-2 rounded-lg bg-red-50 p-2 text-sm">
                      <p className="text-red-700">
                        Apagar <strong>{item.nome}</strong> do cardápio? Despesas já lançadas não
                        são afetadas.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await apagar.mutateAsync(item.id)
                            setConfirmar(null)
                          }}
                          disabled={apagar.isPending}
                          className="min-h-9 rounded-lg bg-red-600 px-3 font-medium text-white active:bg-red-700"
                        >
                          {apagar.isPending ? 'Apagando…' : 'Apagar'}
                        </button>
                        <button
                          onClick={() => setConfirmar(null)}
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
          </div>
        ))}
      </div>

      <FormItemExtra
        aberto={modal !== null}
        item={modal?.item ?? null}
        aoFechar={() => setModal(null)}
      />
    </section>
  )
}
