import { formatarData, formatarMoeda, reaisParaCentavos } from './formatadores'

// O Intl separa "R$" do valor com espaço não separável (U+00A0)
const normalizar = (valor: string) => valor.replace(/\u00a0/g, ' ')

describe('formatarMoeda', () => {
  it('formata centavos como BRL', () => {
    expect(normalizar(formatarMoeda(78000))).toBe('R$ 780,00')
    expect(normalizar(formatarMoeda(50))).toBe('R$ 0,50')
    expect(normalizar(formatarMoeda(0))).toBe('R$ 0,00')
  })
})

describe('reaisParaCentavos', () => {
  it('converte o numeric do banco sem erro de ponto flutuante', () => {
    expect(reaisParaCentavos(780)).toBe(78000)
    expect(reaisParaCentavos(1140.5)).toBe(114050)
    expect(reaisParaCentavos(0.1 + 0.2)).toBe(30)
  })
})

describe('formatarData', () => {
  it('formata ISO como dd/MM/yyyy', () => {
    expect(formatarData('2026-07-10')).toBe('10/07/2026')
  })
})
