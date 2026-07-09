import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { useConfigPousada, useSalvarConfigPousada } from './useConfigPousada'

/** Valor por criança (até a idade limite) nos 3 níveis, somado à tarifa. */
export function SecaoConfigCrianca() {
  const config = useConfigPousada()
  const salvar = useSalvarConfigPousada()
  const [desconto, setDesconto] = useState('')
  const [normal, setNormal] = useState('')
  const [full, setFull] = useState('')
  const [idade, setIdade] = useState('')
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    if (!config.data) return
    setDesconto(String(config.data.crianca_valor_desconto))
    setNormal(String(config.data.crianca_valor_normal))
    setFull(String(config.data.crianca_valor_full))
    setIdade(String(config.data.crianca_idade_max))
  }, [config.data])

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setSalvo(false)
    await salvar.mutateAsync({
      crianca_valor_desconto: Number(desconto),
      crianca_valor_normal: Number(normal),
      crianca_valor_full: Number(full),
      crianca_idade_max: Number(idade),
    })
    setSalvo(true)
  }

  const campos = [
    { rotulo: 'Desconto', valor: desconto, definir: setDesconto },
    { rotulo: 'Normal', valor: normal, definir: setNormal },
    { rotulo: 'Full', valor: full, definir: setFull },
  ]

  return (
    <form onSubmit={enviar} className="flex flex-col gap-2 rounded-lg bg-white p-3">
      <p className="text-sm text-slate-500">
        Valor por criança (por diária), somado à tarifa do quarto. Acima da idade limite conta como
        adulto.
      </p>
      <div className="grid grid-cols-4 gap-2">
        {campos.map((campo) => (
          <label key={campo.rotulo} className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            {campo.rotulo}
            <input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              required
              value={campo.valor}
              onChange={(e) => campo.definir(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-base outline-none focus:border-slate-500"
            />
          </label>
        ))}
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Idade máx.
          <input
            type="number"
            min={0}
            max={17}
            required
            value={idade}
            onChange={(e) => setIdade(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-base outline-none focus:border-slate-500"
          />
        </label>
      </div>
      <Button type="submit" variante="secundario" disabled={salvar.isPending}>
        {salvar.isPending ? 'Salvando…' : salvo ? 'Salvo ✓' : 'Salvar valores de criança'}
      </Button>
    </form>
  )
}
