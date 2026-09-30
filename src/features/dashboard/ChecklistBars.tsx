import { useId } from 'react'
import { Card, ProgressBar } from '@/design/ui'
import { trailPercent, type PhaseProgress } from '@/domain/dashboard'

/** RF-95: % concluído por fase (itens obrigatórios das semanas + itens do portão). */
export function ChecklistBars({ progress }: { progress: PhaseProgress[] }) {
  const id = useId()
  const percent = Math.round(trailPercent(progress) * 100)
  return (
    <section aria-labelledby={id}>
      <Card className="flex flex-col gap-4">
        <h2 id={id} className="text-lg font-bold">Checklists por fase</h2>
        <p className="text-sm text-muted">{percent}% da trilha concluída (itens obrigatórios das semanas e itens de portão).</p>
        <ul className="flex flex-col gap-3">
          {progress.map((p) => (
            <li key={p.phase} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-bold">Fase {p.phase.slice(1)} · {p.title}</span>
                <span className="tabular-nums text-muted">{p.done} de {p.total}</span>
              </div>
              <ProgressBar value={p.ratio} label={`Progresso da Fase ${p.phase.slice(1)}`} tone={p.phase} />
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}
