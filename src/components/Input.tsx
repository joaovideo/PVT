import { useId, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string
  erro?: string
}

export function Input({ rotulo, erro, className = '', ...props }: Props) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      <input
        id={id}
        className={`min-h-11 rounded-lg border bg-white px-3 text-base outline-none focus:border-slate-500 ${erro ? 'border-red-500' : 'border-slate-300'} ${className}`}
        {...props}
      />
      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  )
}
