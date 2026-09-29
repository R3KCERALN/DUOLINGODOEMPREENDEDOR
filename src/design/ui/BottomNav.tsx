import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

export function BottomNav({ items }: { items: { to: string; label: string; icon: ReactNode }[] }) {
  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map((i) => (
          <li key={i.to}>
            <NavLink to={i.to} end={i.to === '/'}
              className={({ isActive }) => `flex min-h-14 min-w-14 flex-col items-center justify-center gap-0.5 px-2 text-xs font-bold
                ${isActive ? 'text-brand-strong' : 'text-muted'}`}>
              {i.icon}
              <span>{i.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
