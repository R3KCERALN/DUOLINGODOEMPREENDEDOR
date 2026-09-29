import { useState } from 'react'
import type { Phase } from '@/content/types'
import { Badge, Checkbox, PixelIcon } from '@/design/ui'
import type { TrailState } from '@/domain/trailState'
import { useToggleItem } from '@/features/progress/hooks'

export function GateChest({ phase, phaseNumber, trail }: { phase: Phase; phaseNumber: number; trail: TrailState }) {
  const toggle = useToggleItem()
  const [open, setOpen] = useState(false)
  const total = phase.gate.length
  const done = phase.gate.filter((g) => trail.gateDone.has(g.id)).length
  const full = done === total
  const panelId = `bau-${phase.id}`
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button type="button" aria-expanded={open} aria-controls={panelId}
        aria-label={`Baú da Fase ${phaseNumber}, ${done} de ${total} itens`}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-3 rounded-card border-2 bg-surface px-4 py-3 font-bold
          focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink
          ${full ? 'border-brand text-brand glow' : 'border-line text-muted'}`}>
        <PixelIcon name="chest" className="size-8" />
        <span className="text-ink">Baú da Fase {phaseNumber}</span>
        <Badge tone={full ? 'brand' : 'muted'}>{done}/{total}</Badge>
      </button>
      {open && (
        <ul id={panelId} className="w-full rounded-card border border-edge bg-surface p-2">
          {phase.gate.map((g) => {
            const auto = trail.autoGate.has(g.id)
            return (
              <li key={g.id}>
                <Checkbox checked={trail.gateDone.has(g.id)} disabled={auto}
                  label={auto ? `${g.text} (automático)` : g.text}
                  onChange={(checked) => toggle.mutate({ itemId: g.id, done: checked })} />
              </li>
            )
          })}
        </ul>
      )}
      {toggle.error && <p role="alert" className="text-sm text-danger">{toggle.error.message}</p>}
    </div>
  )
}
