import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { formatarMoeda } from '../../lib/formatadores'
import type { NivelPreco } from '../../lib/precos'
import type { Quarto } from '../quartos/useQuartos'
import { useBuscarHospedes, type Hospede } from './useBuscarHospedes'
import { useCriarReserva } from './useCriarReserva'

interface Props {
  aberto: boolean
  quarto: Quarto
  checkin: string
  checkout: string
  adultos: number
  criancas: number
  nivel: NivelPreco
  valorSugeridoCentavos: number
  aoFechar: () => void
}

const METODOS = [
  { valor: 'pix', rotulo: 'Pix' },
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'cartao', rotulo: 'Cartão' },
  { valor: 'transferencia', rotulo: 'Transferência' },
  { valor: 'outro', rotulo: 'Outro' },
]

export function FormReservar({
  aberto,
  quarto,
  checkin,
  checkout,
  adultos,
  criancas,
  nivel,
  valorSugeridoCentavos,
  aoFechar,
}: Props) {
  const criar = useCriarReserva()

  const [buscaHospede, setBuscaHospede] = useState('')
  const [hospedeEscolhido, setHospedeEscolhido] = useState<Hospede | null>(null)
  const [hospedeNovoNome, setHospedeNovoNome] = useState('')
  const [hospedeNovoTelefone, setHospedeNovoTelefone] = useState('')
  const [horaChegada, setHoraChegada] = useState('')
  const [valorReais, setValorReais] = useState('')
  const [deuSinal, setDeuSinal] = useState(false)
  const [sinalValor, setSinalValor] = useState('')
  const [sinalMetodo, setSinalMetodo] = useState('pix')
  const [erro, setErro] = useState<string | null>(null)

  const resultadosBusca = useBuscarHospedes(hospedeEscolhido ? '' : buscaHospede)

  useEffect(() => {
    if (!aberto) return
    setBuscaHospede('')
    setHospedeEscolhido(null)
    setHospedeNovoNome('')
    setHospedeNovoTelefone('')
    setHoraChegada('')
    setValorReais((valorSugeridoCentavos / 100).toFixed(2))
    setDeuSinal(false)
    setSinalValor('')
    setSinalMetodo('pix')
    setErro(null)
  }, [aberto, valorSugeridoCentavos])

  const temHospede = hospedeEscolhido !== null || hospedeNovoNome.trim().length > 0

  async function confirmar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    if (!temHospede) {
      setErro('Informe o hóspede.')
      return
    }
    try {
      await criar.mutateAsync({
        hospedeId: hospedeEscolhido?.id ?? null,
        hospedeNome: hospedeEscolhido?.nome ?? hospedeNovoNome.trim(),
        hospedeTelefone: hospedeEscolhido?.telefone ?? hospedeNovoTelefone.trim(),
        quartoId: quarto.id,
        checkin,
        checkout,
        adultos,
        criancas,
        nivel,
        valorTotal: Number(valorReais),
        horaChegada: horaChegada || null,
        sinalValor: deuSinal && sinalValor ? Number(sinalValor) : null,
        sinalMetodo: deuSinal ? sinalMetodo : null,
      })
      aoFechar()
    } catch (e) {
      const codigo = (e as { code?: string })?.code
      if (codigo === '23P01') {
        setErro('Esse quarto acabou de ser reservado por outro funcionário para esse período.')
      } else {
        setErro('Não foi possível criar a reserva. Tente de novo.')
      }
    }
  }

  return (
    <Modal aberto={aberto} titulo={`Reservar — ${quarto.nome}`} aoFechar={aoFechar}>
      <form onSubmit={confirmar} className="flex flex-col gap-3">
        {!hospedeEscolhido && (
          <div className="flex flex-col gap-1">
            <Input
              rotulo="Buscar hóspede"
              placeholder="Nome do hóspede"
              value={buscaHospede}
              onChange={(e) => {
                setBuscaHospede(e.target.value)
                setHospedeNovoNome('')
              }}
            />
            {resultadosBusca.data && resultadosBusca.data.length > 0 && (
              <ul className="flex flex-col overflow-hidden rounded-lg border border-slate-200">
                {resultadosBusca.data.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => setHospedeEscolhido(h)}
                      className="min-h-11 w-full px-3 text-left text-sm active:bg-slate-100"
                    >
                      {h.nome}
                      {h.telefone && <span className="text-slate-400"> · {h.telefone}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {buscaHospede.trim().length >= 2 &&
              resultadosBusca.data &&
              resultadosBusca.data.length === 0 && (
                <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-2">
                  <p className="text-sm text-slate-500">Hóspede novo:</p>
                  <Input
                    rotulo="Nome"
                    value={hospedeNovoNome || buscaHospede}
                    onChange={(e) => setHospedeNovoNome(e.target.value)}
                  />
                  <Input
                    rotulo="Telefone (opcional)"
                    value={hospedeNovoTelefone}
                    onChange={(e) => setHospedeNovoTelefone(e.target.value)}
                  />
                </div>
              )}
          </div>
        )}
        {hospedeEscolhido && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-sm">
            <span>
              <strong>{hospedeEscolhido.nome}</strong>
              {hospedeEscolhido.telefone && ` · ${hospedeEscolhido.telefone}`}
            </span>
            <button
              type="button"
              onClick={() => setHospedeEscolhido(null)}
              className="min-h-11 px-2 text-slate-500"
            >
              Trocar
            </button>
          </div>
        )}

        <Input
          rotulo="Hora prevista de chegada (opcional)"
          type="time"
          value={horaChegada}
          onChange={(e) => setHoraChegada(e.target.value)}
        />

        <Input
          rotulo="Valor total da estadia (R$)"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={valorReais}
          onChange={(e) => setValorReais(e.target.value)}
        />

        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={deuSinal}
            onChange={(e) => setDeuSinal(e.target.checked)}
            className="h-5 w-5"
          />
          Cliente deu sinal?
        </label>
        {deuSinal && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              rotulo="Valor do sinal (R$)"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={sinalValor}
              onChange={(e) => setSinalValor(e.target.value)}
            />
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Forma
              <select
                value={sinalMetodo}
                onChange={(e) => setSinalMetodo(e.target.value)}
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-slate-500"
              >
                {METODOS.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.rotulo}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        <Button type="submit" disabled={criar.isPending}>
          {criar.isPending
            ? 'Confirmando…'
            : `Confirmar reserva — ${valorReais ? formatarMoeda(Math.round(Number(valorReais) * 100)) : ''}`}
        </Button>
      </form>
    </Modal>
  )
}
