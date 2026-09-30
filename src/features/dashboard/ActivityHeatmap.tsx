import { useId } from 'react'
import { Card } from '@/design/ui'
import { heatmapSummary, shortDate, type HeatCell, type HeatKind } from '@/domain/dashboard'

// Contorno sempre presente para o tamanho não mudar; "sem caderno" é vazado (borda laranja, sem preenchimento).
const CELL: Record<HeatKind, string> = {
  future: 'border-2 border-transparent',
  none: 'border-2 border-transparent bg-raised',
  journal: 'border-2 border-brand bg-brand',
  no_journal: 'border-2 border-streak bg-bg',
}

const KIND_LABEL: Partial<Record<HeatKind, string>> = { journal: 'com caderno', no_journal: 'sem caderno' }

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function detail(c: HeatCell): string {
  const what = [
    c.items > 0 ? count(c.items, 'item', 'itens') : null,
    c.simulations > 0 ? count(c.simulations, 'simulado', 'simulados') : null,
  ].filter((x) => x !== null).join(', ')
  return [KIND_LABEL[c.kind], what].filter(Boolean).join(' · ')
}

/** RF-94 e RF-99a: atividade dos últimos dias; os dias com atividade e sem caderno completo aparecem com contorno vazado. */
export function ActivityHeatmap({ weeks }: { weeks: HeatCell[][] }) {
  const id = useId()
  const summary = heatmapSummary(weeks)
  const active = weeks.flat().filter((c) => c.kind === 'journal' || c.kind === 'no_journal').reverse()
  return (
    <section aria-labelledby={id}>
      <Card className="flex flex-col gap-3">
        <h2 id={id} className="text-lg font-bold">Atividade</h2>
        <p className="text-sm text-muted">{summary.text}</p>
        <div aria-hidden className="overflow-x-auto pb-1">
          <div className="grid w-max grid-flow-col grid-rows-7 gap-[3px]">
            {weeks.flat().map((c) => (
              <span key={c.date} data-kind={c.kind} title={shortDate(c.date)} className={`size-3 rounded-[2px] ${CELL[c.kind]}`} />
            ))}
          </div>
        </div>
        <ul aria-label="Legenda" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1.5"><span aria-hidden className={`size-3 rounded-[2px] ${CELL.journal}`} />Com caderno</li>
          <li className="flex items-center gap-1.5"><span aria-hidden className={`size-3 rounded-[2px] ${CELL.no_journal}`} />Sem caderno</li>
          <li className="flex items-center gap-1.5"><span aria-hidden className={`size-3 rounded-[2px] ${CELL.none}`} />Sem atividade</li>
        </ul>
        {active.length > 0 && (
          <details className="text-sm">
            <summary className="w-fit cursor-pointer font-bold text-brand underline underline-offset-4">Ver os dias em lista</summary>
            <ul className="mt-2 flex flex-col gap-1 tabular-nums">
              {active.map((c) => <li key={c.date}>{shortDate(c.date)} · {detail(c)}</li>)}
            </ul>
          </details>
        )}
      </Card>
    </section>
  )
}
