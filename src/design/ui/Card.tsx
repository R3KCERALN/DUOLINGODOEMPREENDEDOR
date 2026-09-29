import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border-2 border-line bg-surface p-4 ${className}`}>{children}</div>
}
