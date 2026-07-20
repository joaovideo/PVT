import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Select } from '../../components/Select'
import { formatarMoeda } from '../../lib/formatadores'
import { addDiasStr, hoje, numeroDeDiarias, type Periodo } from '../../lib/periodos'
import { calcularEstadia, NIVEIS_PRECO, type NivelPreco } from '../../lib/precos'
import { useQuartosDisponiveis } from '../disponibilidade/useQuartosDisponiveis'
import type { Quarto } from '../quartos/useQuartos'
import { FormReservar } from './FormReservar'

interface EstadoNavegacao {
  checkinSugerido?: string
  quartoIdSugerido?: number
}

export function TelaOrcamento() {
  const location = useLocation()
  const sugestao = (location.state as EstadoNavegacao | null) ?? null

  const [checkin, setCheckin] = useState(sugestao?.checkinSugerido ?? hoje())
  const [checkout, setCheckout] = useState(
    sugestao?.checkinSugerido ? addDiasStr(sugestao.checkinSugerido, 1) : '',
  )
  // Aceitam '' enquanto o usuário está digitando (permite apagar o campo);
  // o mínimo é reaplicado no onBlur.
  const [adultos, setAdultos] = useState<number | ''>(2)
  const [criancas, setCriancas] = useState<number | ''>(0)
  const [nivel, setNivel] = useState<NivelPreco>('baixa')
  const [quartoParaReservar, setQuartoParaReservar] = useState<Quarto | null>(null)

  const periodo: Periodo = { inicio: checkin, fim: checkout }
  const diarias = checkout ? numeroDeDiarias(periodo) : 0
  const totalPessoas = (adultos || 0) + (criancas || 0)

  const disponiveis = useQuartosDisponiveis(periodo, totalPessoas)

  const buscaValida = checkout > checkin && totalPessoas > 0

  // Valor da estadia do quarto no nível escolhido (null no 'custom').
  function valorDoQuarto(quarto: Quarto): number | null {
    if (diarias <= 0) return null
    return calcularEstadia(quarto, nivel, diarias)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-bold text-slate-800">Orçamento rápido</h1>

      <div className="grid grid-cols-2 gap-2">
        <Input
          rotulo="Check-in"
          type="date"
          value={checkin}
          onChange={(e) => setCheckin(e.target.value)}
        />
        <Input
          rotulo="Check-out"
          type="date"
          min={checkin}
          value={checkout}
          onChange={(e) => setCheckout(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          rotulo="Adultos"
          type="number"
          inputMode="numeric"
          min={1}
          value={adultos}
          onChange={(e) => {
            const v = e.target.value
            setAdultos(v === '' ? '' : Math.max(0, Math.floor(Number(v))))
          }}
          onBlur={() => setAdultos((n) => (n === '' || n < 1 ? 1 : n))}
        />
        <Input
          rotulo="Crianças"
          type="number"
          inputMode="numeric"
          min={0}
          value={criancas}
          onChange={(e) => {
            const v = e.target.value
            setCriancas(v === '' ? '' : Math.max(0, Math.floor(Number(v))))
          }}
          onBlur={() => setCriancas((n) => (n === '' ? 0 : n))}
        />
      </div>
      <Select
        rotulo="Tabela de preço"
        value={nivel}
        onChange={(e) => setNivel(e.target.value as NivelPreco)}
      >
        {NIVEIS_PRECO.map((n) => (
          <option key={n.chave} value={n.chave}>
            {n.rotulo}
          </option>
        ))}
        <option value="custom">Personalizado (digitar valor)</option>
      </Select>

      {buscaValida && diarias > 0 && (
        <p className="text-sm text-slate-500">
          {diarias} diária{diarias > 1 ? 's' : ''} · {totalPessoas} pessoa
          {totalPessoas > 1 ? 's' : ''}
        </p>
      )}

      {!buscaValida && (
        <p className="text-sm text-slate-400">
          Informe check-in, check-out e o nº de pessoas para ver os quartos disponíveis.
        </p>
      )}

      {buscaValida && disponiveis.isLoading && (
        <p className="text-sm text-slate-500">Buscando quartos…</p>
      )}

      {buscaValida && disponiveis.isError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Erro ao buscar disponibilidade. Tente de novo.
        </p>
      )}

      {buscaValida && disponiveis.data && disponiveis.data.length === 0 && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Nenhum quarto livre para esse período e ocupação.
        </p>
      )}

      {buscaValida && disponiveis.data && disponiveis.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {disponiveis.data.map((quarto) => {
            const valor = valorDoQuarto(quarto)
            return (
              <li
                key={quarto.id}
                className={`flex items-center justify-between gap-2 rounded-lg bg-white p-3 ${
                  quarto.id === sugestao?.quartoIdSugerido ? 'ring-2 ring-marca' : ''
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {quarto.nome}
                    {quarto.id === sugestao?.quartoIdSugerido && (
                      <span className="ml-2 text-xs font-normal text-marca">tocado no mapa</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">até {quarto.capacidade_max} pessoas</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-slate-800">
                    {valor !== null ? formatarMoeda(valor) : 'a definir'}
                  </p>
                  <Button onClick={() => setQuartoParaReservar(quarto)}>Reservar</Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {quartoParaReservar && (
        <FormReservar
          aberto
          quarto={quartoParaReservar}
          checkin={checkin}
          checkout={checkout}
          adultos={adultos || 1}
          criancas={criancas || 0}
          nivel={nivel}
          valorSugeridoCentavos={valorDoQuarto(quartoParaReservar)}
          aoFechar={() => setQuartoParaReservar(null)}
        />
      )}
    </div>
  )
}
