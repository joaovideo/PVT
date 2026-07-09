import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { useConfigPousada, useSalvarConfigPousada } from './useConfigPousada'

const NIVEIS = [
  { chave: 'desconto', rotulo: 'Desconto' },
  { chave: 'normal', rotulo: 'Normal' },
  { chave: 'full', rotulo: 'Full' },
] as const

/** Valores da diária, únicos para toda a pousada:
 *  valor por adulto e por criança, cada um nos 3 níveis, + idade limite. */
export function SecaoValores() {
  const config = useConfigPousada()
  const salvar = useSalvarConfigPousada()
  const [adulto, setAdulto] = useState({ desconto: '', normal: '', full: '' })
  const [crianca, setCrianca] = useState({ desconto: '', normal: '', full: '' })
  const [idade, setIdade] = useState('')
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    if (!config.data) return
    setAdulto({
      desconto: String(config.data.adulto_valor_desconto),
      normal: String(config.data.adulto_valor_normal),
      full: String(config.data.adulto_valor_full),
    })
    setCrianca({
      desconto: String(config.data.crianca_valor_desconto),
      normal: String(config.data.crianca_valor_normal),
      full: String(config.data.crianca_valor_full),
    })
    setIdade(String(config.data.crianca_idade_max))
  }, [config.data])

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setSalvo(false)
    await salvar.mutateAsync({
      adulto_valor_desconto: Number(adulto.desconto),
      adulto_valor_normal: Number(adulto.normal),
      adulto_valor_full: Number(adulto.full),
      crianca_valor_desconto: Number(crianca.desconto),
      crianca_valor_normal: Number(crianca.normal),
      crianca_valor_full: Number(crianca.full),
      crianca_idade_max: Number(idade),
    })
    setSalvo(true)
  }

  function linhaValores(
    titulo: string,
    valores: { desconto: string; normal: string; full: string },
    definir: (v: { desconto: string; normal: string; full: string }) => void,
  ) {
    return (
      <div>
        <p className="mb-1 text-sm font-semibold text-slate-700">{titulo}</p>
        <div className="grid grid-cols-3 gap-2">
          {NIVEIS.map((nivel) => (
            <label
              key={nivel.chave}
              className="flex flex-col gap-1 text-xs font-medium text-slate-600"
            >
              {nivel.rotulo}
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                required
                value={valores[nivel.chave]}
                onChange={(e) => definir({ ...valores, [nivel.chave]: e.target.value })}
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-base outline-none focus:border-slate-500"
              />
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-lg bg-white p-3">
      <p className="text-sm text-slate-500">
        A diária é{' '}
        <strong>valor por adulto × nº de adultos + valor por criança × nº de crianças</strong>,
        igual em qualquer quarto.
      </p>
      {linhaValores('Valor por adulto (diária)', adulto, setAdulto)}
      {linhaValores('Valor por criança (diária)', crianca, setCrianca)}
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        Criança até
        <input
          type="number"
          min={0}
          max={17}
          required
          value={idade}
          onChange={(e) => setIdade(e.target.value)}
          className="min-h-11 w-16 rounded-lg border border-slate-300 bg-white px-2 text-base outline-none focus:border-slate-500"
        />
        anos (acima disso conta como adulto)
      </label>
      <Button type="submit" variante="secundario" disabled={salvar.isPending}>
        {salvar.isPending ? 'Salvando…' : salvo ? 'Salvo ✓' : 'Salvar valores'}
      </Button>
    </form>
  )
}
