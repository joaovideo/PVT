import type { Tables } from './database.types'

export type NivelPreco = 'desconto' | 'normal' | 'full'
export type ConfigPousada = Tables<'config_pousada'>

/** Valor unitário do adulto e da criança para um nível de preço, em centavos. */
export function valoresUnitarios(config: ConfigPousada, nivel: NivelPreco) {
  const adulto = {
    desconto: config.adulto_valor_desconto,
    normal: config.adulto_valor_normal,
    full: config.adulto_valor_full,
  }[nivel]
  const crianca = {
    desconto: config.crianca_valor_desconto,
    normal: config.crianca_valor_normal,
    full: config.crianca_valor_full,
  }[nivel]
  return {
    adultoCentavos: Math.round(adulto * 100),
    criancaCentavos: Math.round(crianca * 100),
  }
}

/** Diária em centavos = adultos × valor adulto + crianças × valor criança. */
export function calcularDiaria(
  config: ConfigPousada,
  nivel: NivelPreco,
  adultos: number,
  criancas: number,
): number {
  const { adultoCentavos, criancaCentavos } = valoresUnitarios(config, nivel)
  return adultos * adultoCentavos + criancas * criancaCentavos
}

/** Total da estadia em centavos = diária × nº de diárias. */
export function calcularEstadia(
  config: ConfigPousada,
  nivel: NivelPreco,
  adultos: number,
  criancas: number,
  diarias: number,
): number {
  return calcularDiaria(config, nivel, adultos, criancas) * diarias
}
