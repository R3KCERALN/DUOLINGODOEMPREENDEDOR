import type { PhaseId } from '@/content/types'
import type { Difficulty } from './roulette'
import type { SimulationFacts } from './trailState'

/** Uma linha de `v_simulation_results`: simulado com as duas fichas enviadas. */
export interface ResultRow { objectiveId: string | null; phase: PhaseId; difficulty: Difficulty; totalOfficial: number }

/** Fatos de simulados que alimentam os itens automáticos de portão (RF-40). */
export function simulationFactsOf(rows: ResultRow[], originalObjectiveIds: string[]): SimulationFacts {
  return {
    originalObjectiveIds,
    evaluatedObjectiveIds: new Set(rows.flatMap((r) => (r.objectiveId ? [r.objectiveId] : []))),
    f2Officials: rows.filter((r) => r.phase === 'f2').map((r) => r.totalOfficial),
    hardOfficials: rows.filter((r) => r.difficulty === 'dificil').map((r) => r.totalOfficial),
  }
}
