import { calcularEstadia, precoDiariaCentavos, type NivelPreco } from './precos'
import type { Tables } from './database.types'

const quarto = {
  id: 1,
  nome: 'Quarto 1',
  camas_casal: 1,
  camas_solteiro: 0,
  capacidade_max: 2,
  observacoes: null,
  ativo: true,
  preco_baixa: 180,
  preco_alta: 260,
  preco_fds: 220,
} as Tables<'quartos'>

describe('precoDiariaCentavos', () => {
  it('retorna o preço do quarto no nível escolhido, em centavos', () => {
    expect(precoDiariaCentavos(quarto, 'baixa')).toBe(18000)
    expect(precoDiariaCentavos(quarto, 'alta')).toBe(26000)
    expect(precoDiariaCentavos(quarto, 'fds')).toBe(22000)
  })

  it('retorna null no nível custom (valor manual)', () => {
    expect(precoDiariaCentavos(quarto, 'custom')).toBeNull()
  })
})

describe('calcularEstadia', () => {
  it('multiplica a diária do quarto pelo nº de diárias', () => {
    expect(calcularEstadia(quarto, 'baixa', 3)).toBe(54000)
    expect(calcularEstadia(quarto, 'alta', 2)).toBe(52000)
  })

  it('retorna null no nível custom', () => {
    const nivel: NivelPreco = 'custom'
    expect(calcularEstadia(quarto, nivel, 3)).toBeNull()
  })
})
