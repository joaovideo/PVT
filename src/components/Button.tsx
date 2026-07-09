import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariante = 'primario' | 'secundario' | 'perigo'

const estilos: Record<ButtonVariante, string> = {
  primario: 'bg-marca text-white active:opacity-90',
  secundario: 'border border-slate-300 bg-white text-slate-700 active:bg-slate-100',
  perigo: 'bg-red-600 text-white active:bg-red-700',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: ButtonVariante
}

export function Button({ variante = 'primario', className = '', ...props }: Props) {
  return (
    <button
      className={`min-h-11 rounded-lg px-4 font-semibold disabled:opacity-60 ${estilos[variante]} ${className}`}
      {...props}
    />
  )
}
