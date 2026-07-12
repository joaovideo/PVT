import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { useSuperAdmin, usePousadasTodas, useCriarPousada } from './usePlataforma'

const VAZIO = { slug: '', nome: '', endereco: '', adminNome: '', adminEmail: '', adminSenha: '' }

export function TelaPlataforma() {
  const sa = useSuperAdmin()
  const pousadas = usePousadasTodas(sa.data === true)
  const criar = useCriarPousada()

  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  if (sa.isLoading) return <p className="p-4 text-slate-500">Carregando…</p>
  if (sa.data !== true)
    return (
      <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
        Área restrita à administração da plataforma.
      </p>
    )

  function set(campo: keyof typeof VAZIO) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [campo]: e.target.value }))
      setOk(null)
      setErro(null)
    }
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    setOk(null)
    try {
      const r = await criar.mutateAsync(form)
      setOk(`Pousada "${r.slug}" criada. O admin (${r.admin_email}) já pode entrar.`)
      setForm(VAZIO)
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Plataforma</h1>
        <Link to="/mapa" className="text-sm text-slate-500">
          ‹ Voltar ao app
        </Link>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          Pousadas ({pousadas.data?.length ?? 0})
        </h2>
        {pousadas.isLoading ? (
          <p className="text-sm text-slate-500">Carregando…</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pousadas.data?.map((p) => (
              <li key={p.id} className="rounded-lg bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{p.nome_exibicao}</p>
                    <p className="truncate text-xs text-slate-400">
                      /{p.slug}
                      {p.endereco && ` · ${p.endereco}`}
                    </p>
                  </div>
                  {!p.ativo && (
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      inativa
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Nova pousada</h2>
        <form onSubmit={enviar} className="flex flex-col gap-3 rounded-lg bg-white p-3">
          <Input
            rotulo="Slug (URL, único)"
            placeholder="pousada-do-mar"
            required
            value={form.slug}
            onChange={set('slug')}
          />
          <Input rotulo="Nome da pousada" required value={form.nome} onChange={set('nome')} />
          <Input rotulo="Endereço (opcional)" value={form.endereco} onChange={set('endereco')} />
          <div className="border-t border-slate-100 pt-2">
            <p className="mb-2 text-xs font-medium text-slate-400">Primeiro admin da pousada</p>
            <div className="flex flex-col gap-3">
              <Input
                rotulo="Nome do admin"
                required
                value={form.adminNome}
                onChange={set('adminNome')}
              />
              <Input
                rotulo="E-mail do admin (login)"
                type="email"
                required
                value={form.adminEmail}
                onChange={set('adminEmail')}
              />
              <Input
                rotulo="Senha inicial (mín. 6)"
                type="password"
                required
                minLength={6}
                value={form.adminSenha}
                onChange={set('adminSenha')}
              />
            </div>
          </div>
          {erro && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </p>
          )}
          {ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{ok}</p>}
          <Button type="submit" disabled={criar.isPending}>
            {criar.isPending ? 'Criando…' : 'Criar pousada'}
          </Button>
        </form>
      </section>
    </div>
  )
}
