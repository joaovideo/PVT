import type { ReactNode } from 'react'

export type BadgeVariante = 'livre' | 'pago' | 'parcial' | 'nao_pago'

const estilos: Record<BadgeVariante, string> = {
  livre: 'bg-livre-fundo text-livre-texto',
  pago: 'bg-pago-fundo text-pago-texto',
  parcial: 'bg-parcial-fundo text-parcial-texto',
  nao_pago: 'bg-naopago-fundo text-naopago-texto',
}

const rotulos: Record<BadgeVariante, string> = {
  livre: 'Livre',
  pago: 'Pago',
  parcial: 'Parcial',
  nao_pago: 'Não pago',
}

export function Badge({ variante, children }: { variante: BadgeVariante; children?: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${estilos[variante]}`}
    >
      {children ?? rotulos[variante]}
    </span>
  )
}
