import type { ActivityDay, ScoreRow, StorageUsage } from '@/domain/dashboard'

export { asyncMutationOf, mutationOf, queryOf } from './simulationMocks'

export function scoreRowOf(over: Partial<ScoreRow> = {}): ScoreRow {
  return {
    simulationId: 'sim-1', day: '2026-09-29', weekStart: '2026-09-28', mode: 'surpresa', difficulty: 'medio', phase: 'f2', isBoss: false,
    studentTotal: 20, mentorTotal: 16, official: 18,
    byCriterion: { abertura: 3, tom: 3, perguntas: 3, escuta: 3, objecao: 3, fechamento: 3 },
    ...over,
  }
}

export const activityOf = (over: Partial<ActivityDay> = {}): ActivityDay => ({ day: '2026-09-29', items: 2, simulations: 0, journal: true, ...over })

export const usageOf = (over: Partial<StorageUsage> = {}): StorageUsage => ({ bucket: 'books', bytes: 52_428_800, files: 1, ...over })
