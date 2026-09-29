import type { ReactNode } from 'react'

const tones = {
  brand: 'bg-brand text-on-brand',
  success: 'bg-success text-on-brand',
  streak: 'bg-streak text-on-brand',
  muted: 'bg-raised text-muted',
}

export function Badge({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>
}
