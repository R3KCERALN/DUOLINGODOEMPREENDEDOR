import { useId } from 'react'
import { Link } from 'react-router'
import { Card, ProgressBar } from '@/design/ui'
import { shortDate, type JournalOverview } from '@/domain/dashboard'
import type { JournalEntry } from '@/features/journal/types'
import { formatWhen } from '@/features/simulations/format'

const MAX_MISSING = 10
const linkCls = 'font-bold text-brand underline underline-offset-4'

/** RF-97a (só mentor): taxa de dias com caderno completo, entradas com atraso e dias em falta, cada um com link para ler no caderno. */
export function JournalCompliance({ overview, lateEntries }: { overview: JournalOverview; lateEntries: JournalEntry[] }) {
  const id = useId()
  const missingNewestFirst = [...overview.missing].reverse()
  const shown = missingNewestFirst.slice(0, MAX_MISSING)
  const extra = missingNewestFirst.length - shown.length
  return (
    <section aria-labelledby={id}>
      <Card className="flex flex-col gap-4">
        <h2 id={id} className="text-lg font-bold">Caderno em dia</h2>

        {overview.rate === null || overview.since === null ? (
          <p className="text-sm text-muted">Ainda não há dias fechados para contar.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted">{Math.round(overview.rate * 100)}% dos dias fechados desde {shortDate(overview.since)} têm caderno completo.</p>
            <ProgressBar value={overview.rate} label="Caderno em dia" tone="success" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <h3 className="font-bold">Preenchidos com atraso</h3>
          {lateEntries.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma entrada preenchida com atraso.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {lateEntries.map((e) => (
                <li key={e.date}>
                  <Link to={`/caderno/dia/${e.date}`} className={linkCls}>{shortDate(e.date)}</Link>
                  <span className="text-muted"> · escrita em {formatWhen(e.createdAt)} · última edição {formatWhen(e.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-bold">Dias em falta</h3>
          {shown.length === 0 ? (
            <p className="text-sm text-muted">Nenhum dia em falta.</p>
          ) : (
            <>
              <ul aria-label="Dias em falta" className="flex flex-wrap gap-x-3 gap-y-1 text-sm tabular-nums">
                {shown.map((d) => <li key={d}><Link to={`/caderno/dia/${d}`} className={linkCls}>{shortDate(d)}</Link></li>)}
              </ul>
              {extra > 0 && <p className="text-sm text-muted">e mais {extra} {extra === 1 ? 'dia' : 'dias'}</p>}
            </>
          )}
        </div>

        <Link to="/caderno" className={`${linkCls} w-fit text-sm`}>Abrir o caderno</Link>
      </Card>
    </section>
  )
}
