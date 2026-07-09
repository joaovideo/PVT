import { differenceInCalendarDays, isBefore, parseISO } from 'date-fns'

/**
 * Período de hospedagem com fim EXCLUSIVO: o dia de `fim` é o checkout,
 * e o quarto já pode receber outro hóspede nesse dia.
 */
export interface Periodo {
  inicio: string // yyyy-MM-dd
  fim: string // yyyy-MM-dd (exclusivo)
}

/** Sobreposição de intervalos meio-abertos [inicio, fim). */
export function periodosSobrepoem(a: Periodo, b: Periodo): boolean {
  return (
    isBefore(parseISO(a.inicio), parseISO(b.fim)) && isBefore(parseISO(b.inicio), parseISO(a.fim))
  )
}

/** Nº de diárias = noites entre inicio e fim (fim exclusivo). */
export function numeroDeDiarias(periodo: Periodo): number {
  return differenceInCalendarDays(parseISO(periodo.fim), parseISO(periodo.inicio))
}

/** Data de hoje em yyyy-MM-dd no fuso LOCAL do navegador.
 *  Não usa toISOString() (converte para UTC e adianta o dia à noite
 *  em fusos atrás de UTC, como o do Brasil). */
export function hoje(): string {
  const d = new Date()
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}
