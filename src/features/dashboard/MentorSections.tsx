import { useState, type ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { activityStart, journalOverview, pendingTrainings, storageSummary, trainingsPerWeek } from '@/domain/dashboard'
import { useJournalEntries } from '@/features/journal/hooks'
import { useBooks } from '@/features/library/hooks'
import { useSimulations } from '@/features/simulations/hooks'
import { spDate } from '@/lib/dates'
import { JournalCompliance } from './JournalCompliance'
import { ReadingProgress } from './ReadingProgress'
import { RecentSimulations } from './RecentSimulations'
import { StorageCard } from './StorageCard'
import { TrainingsPanel } from './TrainingsPanel'
import { useActivityDays, useStorageUsage } from './hooks'

/** Cada bloco carrega e falha sozinho: um erro em um deles não esconde os outros. */
function Async<T>({ query, label, children }: { query: UseQueryResult<T>; label: string; children: (data: T) => ReactNode }) {
  if (query.isLoading) return <p role="status" className="text-sm text-muted">Carregando {label}…</p>
  if (query.data === undefined) return <p role="alert" className="text-sm text-danger">Não foi possível carregar {label}.</p>
  return <>{children(query.data)}</>
}

/** Só o mentor (RF-96, RF-97, RF-97a, RF-97b, RNF-11). Os hooks daqui nunca rodam na tela da aluna. */
export function MentorSections() {
  const [now] = useState(() => new Date())
  const today = spDate(now)
  const entries = useJournalEntries()
  const activity = useActivityDays()
  const sims = useSimulations()
  const books = useBooks()
  const storage = useStorageUsage()
  return (
    <>
      <Async query={entries} label="o caderno">
        {(list) => (
          <JournalCompliance
            overview={journalOverview(list, activityStart(activity.data ?? [], list), now)}
            lateEntries={list.filter((e) => e.complete && e.late)}
          />
        )}
      </Async>
      <Async query={sims} label="os treinos">
        {(list) => <TrainingsPanel weeks={trainingsPerWeek(list, today)} pending={pendingTrainings(list)} />}
      </Async>
      <Async query={books} label="a leitura">{(list) => <ReadingProgress books={list} />}</Async>
      <Async query={sims} label="os simulados">{(list) => <RecentSimulations sims={list} />}</Async>
      <Async query={storage} label="o uso do armazenamento">{(rows) => <StorageCard summary={storageSummary(rows)} />}</Async>
    </>
  )
}
