import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

// Painel de máquina: cada aba é um botão com lâmpada, acesa na aba atual.
export function BottomNav({ items }: { items: { to: string; label: string; icon: ReactNode }[] }) {
  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 border-t-2 border-edge bg-surface pb-[env(safe-area-inset-bottom)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 scanlines" />
      <ul className="relative mx-auto flex max-w-md justify-around px-2 pt-1.5 pb-1">
        {items.map((i) => (
          <li key={i.to}>
            <NavLink to={i.to} end={i.to === '/'}
              className={({ isActive }) => `group flex min-h-14 min-w-16 flex-col items-center justify-center gap-1 rounded-control px-2 text-xs font-bold
                focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink
                ${isActive ? 'text-brand' : 'text-muted hover:text-ink'}`}>
              {({ isActive }) => (
                <>
                  <span aria-hidden className={`h-1 w-6 rounded-[1px] ${isActive ? 'bg-brand glow' : 'bg-raised'}`} />
                  {i.icon}
                  <span>{i.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
