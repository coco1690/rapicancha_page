import { Link } from 'react-router-dom'

type PhasePlaceholderProps = {
  eyebrow: string
  title: string
  description: string
}

export function PhasePlaceholder({ eyebrow, title, description }: PhasePlaceholderProps) {
  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-16 text-zinc-950">
      <div className="mx-auto max-w-3xl border-y border-zinc-200 py-12">
        <p className="text-sm font-bold uppercase text-emerald-700">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600">{description}</p>
        <Link className="mt-8 inline-block font-semibold text-emerald-700 hover:text-emerald-900" to="/">
          Volver al marketplace
        </Link>
      </div>
    </main>
  )
}
