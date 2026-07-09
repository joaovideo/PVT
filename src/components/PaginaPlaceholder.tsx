export function PaginaPlaceholder({ titulo }: { titulo: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-16">
      <h1 className="text-xl font-bold text-slate-800">{titulo}</h1>
      <p className="text-sm text-slate-500">Em construção — chega num próximo sprint.</p>
    </div>
  )
}
