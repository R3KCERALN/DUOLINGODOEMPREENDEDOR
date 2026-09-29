import type { AutoCheck } from '@/content/types'
import { average } from './scoring'

export interface AutoCheckInput {
  watchedVideoIds: ReadonlySet<string>
  f1VideoIds: string[]
  originalObjectiveIds: string[]
  evaluatedObjectiveIds: ReadonlySet<string>   // objetivos de simulados com nota oficial
  f2Officials: number[]                          // totais oficiais de simulados da Fase 2
  hardOfficials: number[]                        // totais oficiais de simulados difíceis
}

export function deriveAutoChecks(i: AutoCheckInput): Set<AutoCheck> {
  const out = new Set<AutoCheck>()
  if (i.f1VideoIds.length > 0 && i.f1VideoIds.every((v) => i.watchedVideoIds.has(v))) out.add('f1_all_videos')
  if (i.originalObjectiveIds.length > 0 && i.originalObjectiveIds.every((o) => i.evaluatedObjectiveIds.has(o))) out.add('f2_all_original_objectives')
  const f2 = average(i.f2Officials)
  if (f2 !== null && f2 >= 15) out.add('f2_avg_15')
  const hard = average(i.hardOfficials)
  if (hard !== null && hard >= 22) out.add('f4_hard_avg_22')
  return out
}
