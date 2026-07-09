import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useAvisosRealtime } from './useAvisosRealtime'

export function SinoAvisos() {
  const { avisos, toast, fecharToast } = useAvisosRealtime()
  const [painelAberto, setPainelAberto] = useState(false)

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setPainelAberto((v) => !v)}
          aria-label="Avisos"
          className="relative flex min-h-11 min-w-11 items-center justify-center text-slate-500"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {avisos.length > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>

        {painelAberto && (
          <div className="absolute right-0 top-12 z-20 max-h-96 w-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <p className="mb-1 px-2 text-xs font-semibold text-slate-500">Avisos das últimas 24h</p>
            {avisos.length === 0 && (
              <p className="px-2 py-3 text-sm text-slate-400">Nenhum aviso ainda.</p>
            )}
            <ul className="flex flex-col gap-1">
              {avisos.map((a) => (
                <li key={a.id} className="rounded-lg px-2 py-2 text-sm text-slate-700">
                  <p>{a.mensagem}</p>
                  <p className="text-xs text-slate-400">
                    {format(parseISO(a.ocorridoEm), 'HH:mm')}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 top-16 z-30 flex items-center justify-between gap-2 rounded-lg bg-slate-800 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>{toast.mensagem}</span>
          <button onClick={fecharToast} aria-label="Fechar aviso" className="min-h-9 min-w-9 px-2">
            ✕
          </button>
        </div>
      )}
    </>
  )
}
