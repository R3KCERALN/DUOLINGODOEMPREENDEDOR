import type { CSSProperties } from 'react'
import type { PhaseId } from '@/content/types'

// Barra de energia: trilho escuro com células acesas na cor do tom.
export function ProgressBar({ value, label, tone = 'brand' }: { value: number; label: string; tone?: 'brand' | 'success' | PhaseId }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
      className="h-5 w-full overflow-hidden rounded-[4px] border-2 border-line bg-bg p-[2px]">
      <div className="h-full energy-cells transition-[width] duration-[var(--duration-slow)]"
        style={{ width: `${pct}%`, '--fill': `var(--color-${tone})` } as CSSProperties} />
    </div>
  )
}
