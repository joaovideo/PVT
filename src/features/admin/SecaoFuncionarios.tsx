import { useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { FormFuncionario } from './FormFuncionario'
import { useFuncionarioAtual } from '../auth/useFuncionarioAtual'
import {
  useApagarFuncionario,
  useAtualizarFuncionario,
  useEnviarResetSenha,
  useFuncionarios,
  type Funcionario,
} from './useFuncionarios'

export function SecaoFuncionarios() {
  const funcionarios = useFuncionarios()
  const atualizar = useAtualizarFuncionario()
  const apagar = useApagarFuncionario()
  const resetSenha = useEnviarResetSenha()
  const { funcionario: eu } = useFuncionarioAtual()

  const [modal, setModal] = useState<{ funcionario: Funcionario | null } | null>(null)
  const [confirmarApagar, setConfirmarApagar] = useState<Funcionario | null>(null)
  const [avisoReset, setAvisoReset] = useState<string | null>(null)

  async function enviarReset(funcionario: Funcionario) {
    setAvisoReset(null)
    if (!funcionario.email) {
      setAvisoReset(`${funcionario.nome} não tem e-mail cadastrado.`)
      return
    }
    try {
      await resetSenha.mutateAsync(funcionario.email)
      setAvisoReset(`Link de redefinição enviado para ${funcionario.email}.`)
    } catch {
      setAvisoReset('Não foi possível enviar o link agora. Tente de novo.')
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Funcionários</h2>
        <Button variante="secundario" onClick={() => setModal({ funcionario: null })}>
          + Novo funcionário
        </Button>
      </div>

      {avisoReset && (
        <p role="status" className="mb-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
          {avisoReset}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {funcionarios.data?.map((f) => {
          const ehVoce = f.id === eu?.id
          return (
            <li key={f.id} className="rounded-lg bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800">
                    {f.nome}
                    {ehVoce && (
                      <span className="ml-2 text-xs font-normal text-slate-400">você</span>
                    )}
                  </p>
                  <p className="flex gap-1 text-sm text-slate-500">
                    {f.email ?? 'sem e-mail'}
                    {f.admin && (
                      <span className="rounded bg-slate-200 px-1.5 text-xs text-slate-600">
                        admin
                      </span>
                    )}
                    {!f.ativo && <Badge variante="nao_pago">Inativo</Badge>}
                  </p>
                </div>
                <button
                  onClick={() => setModal({ funcionario: f })}
                  className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-600 active:bg-slate-100"
                >
                  Editar
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-100 pt-2 text-sm font-medium">
                <button
                  onClick={() => atualizar.mutate({ id: f.id, ativo: !f.ativo })}
                  disabled={ehVoce || atualizar.isPending}
                  title={ehVoce ? 'Você não pode desativar a si mesmo' : undefined}
                  className="min-h-9 rounded-lg px-2 text-slate-600 active:bg-slate-100 disabled:opacity-40"
                >
                  {f.ativo ? 'Desativar' : 'Reativar'}
                </button>
                <button
                  onClick={() => atualizar.mutate({ id: f.id, admin: !f.admin })}
                  disabled={ehVoce || atualizar.isPending}
                  title={ehVoce ? 'Você não pode mudar o próprio nível' : undefined}
                  className="min-h-9 rounded-lg px-2 text-slate-600 active:bg-slate-100 disabled:opacity-40"
                >
                  {f.admin ? 'Tornar comum' : 'Tornar admin'}
                </button>
                <button
                  onClick={() => enviarReset(f)}
                  disabled={resetSenha.isPending}
                  className="min-h-9 rounded-lg px-2 text-slate-600 active:bg-slate-100 disabled:opacity-40"
                >
                  Resetar senha
                </button>
                <button
                  onClick={() => setConfirmarApagar(f)}
                  disabled={ehVoce}
                  title={ehVoce ? 'Você não pode apagar a si mesmo' : undefined}
                  className="min-h-9 rounded-lg px-2 text-red-600 active:bg-red-50 disabled:opacity-40"
                >
                  Apagar
                </button>
              </div>

              {confirmarApagar?.id === f.id && (
                <div className="mt-2 flex flex-col gap-2 rounded-lg bg-red-50 p-2 text-sm">
                  <p className="text-red-700">
                    Apagar <strong>{f.nome}</strong> de vez? O histórico dele (reservas, pagamentos,
                    log) continua registrado com o nome. Não dá para desfazer.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await apagar.mutateAsync(f.id)
                        setConfirmarApagar(null)
                      }}
                      disabled={apagar.isPending}
                      className="min-h-9 rounded-lg bg-red-600 px-3 font-medium text-white active:bg-red-700"
                    >
                      {apagar.isPending ? 'Apagando…' : 'Apagar de vez'}
                    </button>
                    <button
                      onClick={() => setConfirmarApagar(null)}
                      className="min-h-9 rounded-lg px-3 font-medium text-slate-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <FormFuncionario
        aberto={modal !== null}
        funcionario={modal?.funcionario ?? null}
        aoFechar={() => setModal(null)}
      />
    </section>
  )
}
