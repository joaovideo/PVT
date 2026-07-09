import type { ReactNode } from 'react'

interface Props {
  aberto: boolean
  titulo: string
  aoFechar: () => void
  children: ReactNode
}

export function Modal({ aberto, titulo, aoFechar, children }: Props) {
  if (!aberto) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={aoFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 sm:rounded-2xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800">{titulo}</h2>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="min-h-11 min-w-11 rounded-lg text-slate-500 active:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}
