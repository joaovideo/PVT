import { calcularDiaria, calcularEstadia, type ConfigPousada } from './precos'

const config: ConfigPousada = {
  id: 1,
  adulto_valor_desconto: 100,
  adulto_valor_normal: 120,
  adulto_valor_full: 150,
  crianca_valor_desconto: 40,
  crianca_valor_normal: 50,
  crianca_valor_full: 60,
  crianca_idade_max: 12,
}

describe('calcularDiaria', () => {
  it('1 adulto no normal = valor unitário do adulto (em centavos)', () => {
    expect(calcularDiaria(config, 'normal', 1, 0)).toBe(12000)
  })

  it('2 adultos = 2× o valor (linear na ocupação)', () => {
    expect(calcularDiaria(config, 'normal', 2, 0)).toBe(24000)
  })

  it('casal + 1 criança no normal = 2×120 + 1×50', () => {
    expect(calcularDiaria(config, 'normal', 2, 1)).toBe(29000)
  })

  it('respeita o nível de preço (desconto e full)', () => {
    expect(calcularDiaria(config, 'desconto', 2, 1)).toBe(24000)
    expect(calcularDiaria(config, 'full', 2, 1)).toBe(36000)
  })
})

describe('calcularEstadia', () => {
  it('multiplica a diária pelo nº de diárias', () => {
    expect(calcularEstadia(config, 'normal', 2, 1, 3)).toBe(87000)
  })
})
