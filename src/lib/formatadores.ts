import { format, parseISO } from 'date-fns'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Valores monetários circulam no frontend em CENTAVOS (inteiro). */
export function formatarMoeda(centavos: number): string {
  return formatoMoeda.format(centavos / 100)
}

/** Converte o numeric do banco (reais) para centavos inteiros. */
export function reaisParaCentavos(reais: number): number {
  return Math.round(reais * 100)
}

/** '2026-07-10' → '10/07/2026' */
export function formatarData(dataIso: string): string {
  return format(parseISO(dataIso), 'dd/MM/yyyy')
}
