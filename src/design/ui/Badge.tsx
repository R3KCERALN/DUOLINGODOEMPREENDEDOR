import type { ReactNode } from 'react'

const tones = {
  brand: 'bg-brand-strong text-white',
  success: 'bg-success text-white',
  streak: 'bg-streak text-ink',
  muted: 'bg-line text-ink',
}

export function Badge({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>
}
