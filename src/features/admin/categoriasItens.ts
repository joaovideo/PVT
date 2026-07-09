/** Categorias do cardápio de itens extras. A ordem desta lista define a
 *  ordem de exibição na tela (não alfabética) e deve bater exatamente com a
 *  constraint `itens_extras_categoria_valida` da migration 0010. */
export const CATEGORIAS_ITENS = [
  'Pratos',
  'Risotos',
  'Caldos',
  'Porções',
  'Pizzas',
  'Bebidas',
  'Outros',
] as const

export type CategoriaItem = (typeof CATEGORIAS_ITENS)[number]

/** Índice da categoria para ordenar (categorias fora da lista vão para o fim). */
export function ordemCategoria(categoria: string): number {
  const i = CATEGORIAS_ITENS.indexOf(categoria as CategoriaItem)
  return i === -1 ? CATEGORIAS_ITENS.length : i
}
