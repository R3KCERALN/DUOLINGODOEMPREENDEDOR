import { Link, Outlet, useLocation } from 'react-router'

const TABS = [
  { to: '/caderno', label: 'Dia', active: (p: string) => p === '/caderno' || p.startsWith('/caderno/dia/') },
  { to: '/caderno/notas', label: 'Notas', active: (p: string) => p.startsWith('/caderno/notas') },
  { to: '/caderno/checklists', label: 'Listas', active: (p: string) => p.startsWith('/caderno/checklists') },
  { to: '/biblioteca', label: 'Biblioteca', active: () => false },
]

/** Moldura das telas do Caderno: título, abas (Dia, Notas, Listas e o atalho para a Biblioteca) e a tela da aba. */
export function CadernoLayout() {
  const { pathname } = useLocation()
  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-6 pb-8">
      <h1 className="font-display text-6xl leading-none font-black text-brand text-glow">Caderno</h1>
      <nav aria-label="Caderno" className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const on = t.active(pathname)
          return (
            <Link key={t.to} to={t.to} aria-current={on ? 'page' : undefined}
              className={`inline-flex h-10 items-center rounded-control border-2 px-3 text-sm font-bold ${on ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-ink'}`}>
              {t.label}
            </Link>
          )
        })}
      </nav>
      <Outlet />
    </main>
  )
}
