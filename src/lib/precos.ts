import type { Tables } from './database.types'

/** Níveis de preço por quarto + 'custom' (valor digitado na reserva). */
export type NivelPreco = 'baixa' | 'alta' | 'fds' | 'custom'

export const NIVEIS_PRECO: { chave: Exclude<NivelPreco, 'custom'>; rotulo: string }[] = [
  { chave: 'baixa', rotulo: 'Baixa temporada' },
  { chave: 'alta', rotulo: 'Alta temporada' },
  { chave: 'fds', rotulo: 'Fim de semana' },
]

type Quarto = Tables<'quartos'>

/** Preço da diária do quarto no nível escolhido, em centavos.
 *  'custom' não tem preço fixo — retorna null (o funcionário digita). */
export function precoDiariaCentavos(quarto: Quarto, nivel: NivelPreco): number | null {
  const reais = {
    baixa: quarto.preco_baixa,
    alta: quarto.preco_alta,
    fds: quarto.preco_fds,
    custom: null,
  }[nivel]
  // null/undefined (nível custom, ou coluna ainda não migrada) → sem preço fixo
  return reais == null || Number.isNaN(reais) ? null : Math.round(reais * 100)
}

/** Total da estadia em centavos = diária do quarto × nº de diárias.
 *  Retorna null no nível 'custom' (valor definido manualmente). */
export function calcularEstadia(quarto: Quarto, nivel: NivelPreco, diarias: number): number | null {
  const diaria = precoDiariaCentavos(quarto, nivel)
  return diaria === null ? null : diaria * diarias
}
