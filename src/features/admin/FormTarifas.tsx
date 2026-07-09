import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { useTarifas, useSalvarTarifa } from '../quartos/useTarifas'
import type { Quarto } from '../quartos/useQuartos'

interface Props {
  aberto: boolean
  quarto: Quarto | null
  aoFechar: () => void
}

interface Linha {
  adultos: number
  desconto: string
  normal: string
  full: string
}

/** Edita os 3 níveis de valor por nº de adultos (1 até a capacidade do quarto). */
export function FormTarifas({ aberto, quarto, aoFechar }: Props) {
  const tarifas = useTarifas(quarto?.id)
  const salvarTarifa = useSalvarTarifa()
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto || !quarto || !tarifas.data) return
    setErro(null)
    setLinhas(
      Array.from({ length: quarto.capacidade_max }, (_, i) => {
        const adultos = i + 1
        const existente = tarifas.data.find((t) => t.adultos === adultos)
        return {
          adultos,
          desconto: existente ? String(existente.valor_desconto) : '',
          normal: existente ? String(existente.valor_normal) : '',
          full: existente ? String(existente.valor_full) : '',
        }
      }),
    )
  }, [aberto, quarto, tarifas.data])

  function editar(indice: number, campo: keyof Omit<Linha, 'adultos'>, valor: string) {
    setLinhas((atual) => atual.map((l, i) => (i === indice ? { ...l, [campo]: valor } : l)))
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!quarto) return
    setErro(null)
    const preenchidas = linhas.filter((l) => l.desconto && l.normal && l.full)
    try {
      for (const linha of preenchidas) {
        await salvarTarifa.mutateAsync({
          quarto_id: quarto.id,
          adultos: linha.adultos,
          valor_desconto: Number(linha.desconto),
          valor_normal: Number(linha.normal),
          valor_full: Number(linha.full),
        })
      }
      aoFechar()
    } catch {
      setErro('Não foi possível salvar as tarifas. Tente de novo.')
    }
  }

  return (
    <Modal aberto={aberto} titulo={`Tarifas — ${quarto?.nome ?? ''}`} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <p className="text-sm text-slate-500">
          Valor da diária por nº de adultos. Linhas em branco não são salvas. Criança soma o valor
          configurado na seção “Criança”.
        </p>
        <div className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-2 text-sm">
          <span />
          <span className="font-medium text-slate-600">Desconto</span>
          <span className="font-medium text-slate-600">Normal</span>
          <span className="font-medium text-slate-600">Full</span>
          {linhas.map((linha, i) => (
            <>
              <span key={`rotulo-${linha.adultos}`} className="font-medium text-slate-700">
                {linha.adultos} ad.
              </span>
              {(['desconto', 'normal', 'full'] as const).map((campo) => (
                <input
                  key={`${linha.adultos}-${campo}`}
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  aria-label={`${linha.adultos} adultos — ${campo}`}
                  value={linha[campo]}
                  onChange={(e) => editar(i, campo, e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-base outline-none focus:border-slate-500"
                />
              ))}
            </>
          ))}
        </div>
        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <Button type="submit" disabled={salvarTarifa.isPending}>
          {salvarTarifa.isPending ? 'Salvando…' : 'Salvar tarifas'}
        </Button>
      </form>
    </Modal>
  )
}
