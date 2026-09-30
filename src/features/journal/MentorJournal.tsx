import { useState } from 'react'
import { Badge, Card } from '@/design/ui'
import { DAY_STATUS_LABEL, journalDayStatus, lastDays } from '@/domain/journalDays'
import { formatWhen } from '@/features/simulations/format'
import { spDate } from '@/lib/dates'
import type { JournalEntry } from './types'

/** Visão do mentor (RF-50/52): o caderno da aluna, sempre visível, com os horários gravados pelo banco e os dias em falta. */
export function MentorJournal({ entries }: { entries: JournalEntry[] }) {
  const [now] = useState(() => new Date())
  const byDate = new Map(entries.map((e) => [e.date, e]))
  return (
    <ul className="flex flex-col gap-3">
      {lastDays(spDate(now), 30).map((date) => {
        const e = byDate.get(date)
        const status = journalDayStatus(date, now, e ? { complete: e.complete, late: e.late } : undefined)
        return (
          <li key={date}>
            <Card className="flex flex-col gap-2">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold tabular-nums">{date.split('-').reverse().join('/')}</h2>
                <Badge tone={status === 'done' ? 'success' : status === 'missing' ? 'muted' : 'streak'}>{DAY_STATUS_LABEL[status]}</Badge>
              </header>
              {e ? (
                <>
                  <p><span className="font-bold text-muted">Aprendi:</span> {e.learned || '—'}</p>
                  <p><span className="font-bold text-muted">Pratiquei:</span> {e.practiced || '—'}</p>
                  <p><span className="font-bold text-muted">Amanhã:</span> {e.tomorrow || '—'}</p>
                  <p className="text-sm text-muted">Criado {formatWhen(e.createdAt)} · atualizado {formatWhen(e.updatedAt)}</p>
                </>
              ) : (
                status !== 'open' && <p className="text-sm text-muted">Sem entrada neste dia.</p>
              )}
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
