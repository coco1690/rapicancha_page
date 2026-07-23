export function LoadingScreen({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-zinc-50 px-6">
      <div className="flex items-center gap-3 text-sm font-medium text-zinc-600">
        <span className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600" />
        {label}
      </div>
    </div>
  )
}
