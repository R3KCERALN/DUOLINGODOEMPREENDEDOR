import type { PhaseId } from '@/content/types'

const fills: Record<string, string> = {
  brand: 'bg-brand', success: 'bg-success', f1: 'bg-f1', f2: 'bg-f2', f3: 'bg-f3', f4: 'bg-f4',
}

export function ProgressBar({ value, label, tone = 'brand' }: { value: number; label: string; tone?: 'brand' | 'success' | PhaseId }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
      className="h-4 w-full overflow-hidden rounded-pill bg-line">
      <div className={`h-full rounded-pill ${fills[tone]} transition-[width] duration-[var(--duration-slow)]`} style={{ width: `${pct}%` }} />
    </div>
  )
}
