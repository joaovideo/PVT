import { useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import {
  useCategorias,
  useCategoriasAdmin,
  CATEGORIA_PADRAO,
  type CategoriaItem,
} from './useCategoriasItens'

export function SecaoCategorias() {
  const categorias = useCategorias()
  const { criar, renomear, trocarOrdem, apagar } = useCategoriasAdmin()

  const [novoNome, setNovoNome] = useState('')
  const [editando, setEditando] = useState<{ id: number; nome: string } | null>(null)
  const [confirmar, setConfirmar] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const lista = categorias.data ?? []

  async function adicionar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    const nome = novoNome.trim()
    if (!nome) return
    if (lista.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
      setErro('Já existe uma categoria com esse nome.')
      return
    }
    try {
      await criar.mutateAsync(nome)
      setNovoNome('')
    } catch {
      setErro('Não foi possível criar a categoria.')
    }
  }

  async function salvarRenome() {
    if (!editando) return
    const nome = editando.nome.trim()
    if (!nome) return
    setErro(null)
    try {
      await renomear.mutateAsync({ id: editando.id, nome })
      setEditando(null)
    } catch {
      setErro('Não foi possível renomear (nome repetido?).')
    }
  }

  async function mover(indice: number, direcao: -1 | 1) {
    const a = lista[indice]
    const b = lista[indice + direcao]
    if (!a || !b) return
    setErro(null)
    await trocarOrdem.mutateAsync({ a, b })
  }

  async function confirmarApagar(cat: CategoriaItem) {
    setErro(null)
    try {
      await apagar.mutateAsync(cat.id)
      setConfirmar(null)
    } catch {
      // FK ON DELETE RESTRICT ou o gatilho de 'Outros' barram no banco.
      setErro(`"${cat.nome}" está em uso por itens ou é protegida — não dá para apagar.`)
      setConfirmar(null)
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Categorias do cardápio</h2>
      </div>

      <form onSubmit={adicionar} className="mb-3 flex items-end gap-2">
        <div className="flex-1">
          <Input
            rotulo="Nova categoria"
            placeholder="ex.: Sobremesas"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
          />
        </div>
        <Button type="submit" variante="secundario" disabled={criar.isPending}>
          {criar.isPending ? 'Criando…' : 'Adicionar'}
        </Button>
      </form>

      {erro && (
        <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {lista.map((cat, i) => (
          <li key={cat.id} className="rounded-lg bg-white p-3">
            {editando?.id === cat.id ? (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    rotulo="Nome"
                    value={editando.nome}
                    onChange={(e) => setEditando({ id: cat.id, nome: e.target.value })}
                  />
                </div>
                <Button variante="secundario" onClick={salvarRenome} disabled={renomear.isPending}>
                  Salvar
                </Button>
                <button
                  onClick={() => setEditando(null)}
                  className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-600"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-800">{cat.nome}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => mover(i, -1)}
                    disabled={i === 0 || trocarOrdem.isPending}
                    aria-label="Mover para cima"
                    className="min-h-11 min-w-11 rounded-lg text-slate-500 active:bg-slate-100 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => mover(i, 1)}
                    disabled={i === lista.length - 1 || trocarOrdem.isPending}
                    aria-label="Mover para baixo"
                    className="min-h-11 min-w-11 rounded-lg text-slate-500 active:bg-slate-100 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => setEditando({ id: cat.id, nome: cat.nome })}
                    className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-600 active:bg-slate-100"
                  >
                    Renomear
                  </button>
                  {cat.nome !== CATEGORIA_PADRAO && (
                    <button
                      onClick={() => setConfirmar(cat.id)}
                      className="min-h-11 rounded-lg px-3 text-sm font-medium text-red-600 active:bg-red-50"
                    >
                      Apagar
                    </button>
                  )}
                </div>
              </div>
            )}
            {confirmar === cat.id && (
              <div className="mt-2 flex flex-col gap-2 rounded-lg bg-red-50 p-2 text-sm">
                <p className="text-red-700">
                  Apagar a categoria <strong>{cat.nome}</strong>? Só é possível se nenhum item a
                  estiver usando.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmarApagar(cat)}
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
    </section>
  )
}
