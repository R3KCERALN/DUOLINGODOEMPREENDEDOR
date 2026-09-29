import type { PhaseId } from '@/content/types'
import { pick, shuffle, type Rng } from './rng'

export type Difficulty = 'facil' | 'medio' | 'dificil'

export interface ReelItem { id: string; reel: 1 | 2 | 3 | 4; label: string; active: boolean; isNone: boolean }
export interface Draw { objectiveId: string; profileId: string; productId: string; complicationIds: string[] }

export class RouletteError extends Error {}

export function difficultyForPhase(phase: PhaseId): Difficulty {
  return phase === 'f1' ? 'facil' : phase === 'f2' ? 'medio' : 'dificil'
}

const REEL_NAMES = { 1: 'objetivo', 2: 'perfil de cliente', 3: 'produto' } as const

export function drawScenario(items: ReelItem[], d: Difficulty, recentObjectiveIds: string[], rng: Rng = Math.random): Draw {
  const active = (reel: ReelItem['reel']) => items.filter((i) => i.reel === reel && i.active)
  for (const reel of [1, 2, 3] as const) {
    if (active(reel).length === 0) throw new RouletteError(`Nenhum ${REEL_NAMES[reel]} ativo no banco de cenários.`)
  }
  const recent = new Set(recentObjectiveIds.slice(-3))
  const fresh = active(1).filter((i) => !recent.has(i.id))
  const objective = pick(fresh.length > 0 ? fresh : active(1), rng)

  let complicationIds: string[]
  if (d === 'facil') {
    const none = items.find((i) => i.reel === 4 && i.isNone)
    complicationIds = none ? [none.id] : []
  } else {
    const real = active(4).filter((i) => !i.isNone)
    if (real.length === 0) throw new RouletteError('Nenhuma complicação ativa no banco de cenários.')
    const wanted = d === 'medio' ? 1 : 2 + Math.floor(rng() * 2)
    complicationIds = shuffle(real, rng).slice(0, wanted).map((i) => i.id)
  }

  return {
    objectiveId: objective.id,
    profileId: pick(active(2), rng).id,
    productId: pick(active(3), rng).id,
    complicationIds,
  }
}
