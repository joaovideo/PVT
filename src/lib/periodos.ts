import { addDays, differenceInCalendarDays, format, isBefore, parseISO } from 'date-fns'

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

/** `dataIso` deslocada em `n` dias (aceita negativo), em yyyy-MM-dd. */
export function addDiasStr(dataIso: string, n: number): string {
  return format(addDays(parseISO(dataIso), n), 'yyyy-MM-dd')
}

/** Lista de dias (yyyy-MM-dd) em [inicioIncl, fimExcl). */
export function diasEntre(inicioIncl: string, fimExcl: string): string[] {
  const dias: string[] = []
  let cursor = inicioIncl
  while (cursor < fimExcl) {
    dias.push(cursor)
    cursor = addDiasStr(cursor, 1)
  }
  return dias
}
