import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Badge } from '@/design/ui'
import { DAY_STATUS_LABEL, journalDayStatus, lastDays } from '@/domain/journalDays'
import { useAuth } from '@/features/auth/AuthProvider'
import { spDate } from '@/lib/dates'
import { useJournalEntries } from './hooks'
import { JournalForm } from './JournalForm'
import { MentorJournal } from './MentorJournal'

const ISO = /^\d{4}-\d{2}-\d{2}$/

/** `/caderno` e `/caderno/dia/:date`: a aluna escreve o dia; o mentor lê o caderno dela. */
export function JournalScreen() {
  const { date: param } = useParams()
  const { profile } = useAuth()
  const entries = useJournalEntries()
  const [now] = useState(() => new Date())
  const today = spDate(now)

  if (entries.isLoading) return <p role="status" className="p-2 text-muted">Carregando o caderno…</p>
  if (!entries.data) return <p role="alert" className="p-2 text-danger">Não foi possível carregar o caderno.</p>

  if (profile?.role === 'mentor') return <MentorJournal entries={entries.data} />

  if (param !== undefined && (!ISO.test(param) || param > today)) return <Navigate to="/caderno" replace />
  const date = param ?? today
  const byDate = new Map(entries.data.map((e) => [e.date, e]))

  return (
    <div className="flex flex-col gap-6">
      <JournalForm key={date} date={date} initial={byDate.get(date)} />
      <section aria-labelledby="dias" className="flex flex-col gap-2">
        <h2 id="dias" className="font-display text-2xl font-black">Últimos dias</h2>
        <ul className="flex flex-col gap-1">
          {lastDays(today, 14).map((d) => {
            const e = byDate.get(d)
            const status = journalDayStatus(d, now, e ? { complete: e.complete, late: e.late } : undefined)
            return (
              <li key={d}>
                <Link to={d === today ? '/caderno' : `/caderno/dia/${d}`} aria-current={d === date ? 'date' : undefined}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-control border border-edge bg-surface px-3">
                  <span className="tabular-nums">{d.split('-').reverse().join('/')}</span>
                  <Badge tone={status === 'done' ? 'success' : status === 'open' ? 'brand' : status === 'missing' ? 'muted' : 'streak'}>{DAY_STATUS_LABEL[status]}</Badge>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
