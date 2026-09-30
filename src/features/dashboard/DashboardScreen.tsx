import { useState } from 'react'
import { headerFacts, heatmapWeeks, phaseProgress, radarByCriterion, selfVsMentor, weeklyOfficial } from '@/domain/dashboard'
import { useAuth } from '@/features/auth/AuthProvider'
import { useJournalDays, useNodeStates, useProgress } from '@/features/progress/hooks'
import { spDate } from '@/lib/dates'
import { ActivityHeatmap } from './ActivityHeatmap'
import { ChecklistBars } from './ChecklistBars'
import { CriteriaRadar } from './CriteriaRadar'
import { DashboardHeader } from './DashboardHeader'
import { EvolutionChart } from './EvolutionChart'
import { MentorSections } from './MentorSections'
import { PerceptionChart } from './PerceptionChart'
import { useActivityDays, useScoreSeries } from './hooks'

/** RF-90 a RF-95 (e RF-98): as mesmas seções para as duas contas; cada uma vê os próprios dados pela RLS. */
function CommonSections({ viewer }: { viewer: 'mentor' | 'aluna' }) {
  const [now] = useState(() => new Date())
  const today = spDate(now)
  const scores = useScoreSeries()
  const activity = useActivityDays()
  const trail = useNodeStates()
  const progress = useProgress()
  const journal = useJournalDays()

  if (scores.isLoading || activity.isLoading || trail.isLoading || progress.isLoading || journal.isLoading) {
    return <p role="status" className="text-muted">Carregando o painel…</p>
  }
  if (!scores.data || !activity.data || !trail.data || !progress.data || !journal.data) {
    return <p role="alert" className="text-danger">Não foi possível carregar o painel. Verifique a conexão e recarregue a página.</p>
  }

  const phases = phaseProgress(progress.data.doneItems, trail.data.gateDone)
  const facts = headerFacts({
    phase: trail.data.currentPhase, next: trail.data.next?.node ?? null, progress: phases, completeDates: journal.data, today,
  })
  return (
    <>
      <DashboardHeader facts={facts} />
      <EvolutionChart points={weeklyOfficial(scores.data)} />
      <PerceptionChart points={selfVsMentor(scores.data)} viewer={viewer} />
      <CriteriaRadar points={radarByCriterion(scores.data, today)} />
      <ActivityHeatmap weeks={heatmapWeeks(activity.data, today)} />
      <ChecklistBars progress={phases} />
    </>
  )
}

export function DashboardScreen() {
  const { profile } = useAuth()
  if (!profile) return <p role="status" className="p-6 text-muted">Carregando…</p>
  const mentor = profile.role === 'mentor'
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-8">
      <h1 className="font-display text-3xl font-black text-brand">{mentor ? 'Painel da aluna' : 'Seu painel'}</h1>
      <CommonSections viewer={profile.role} />
      {mentor && <MentorSections />}
    </main>
  )
}
