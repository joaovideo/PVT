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
