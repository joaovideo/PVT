import type { Pousada } from './usePousada'

/** Aplica as cores da pousada como CSS custom properties no root, sobrescrevendo
 *  os tokens do tema (`--color-marca`, `--color-fundo`) definidos no index.css.
 *  Cor vazia → remove a sobrescrita e volta ao padrão do tema. */
export function aplicarTemaPousada(p: Pousada | null | undefined): void {
  const root = document.documentElement
  const mapa: [string, string | null | undefined][] = [
    ['--color-marca', p?.cor_primaria],
    ['--color-fundo', p?.cor_fundo],
  ]
  for (const [nome, valor] of mapa) {
    if (valor) root.style.setProperty(nome, valor)
    else root.style.removeProperty(nome)
  }
}
