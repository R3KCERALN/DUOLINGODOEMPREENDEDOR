import type { Difficulty, Draw } from './roulette'
import { shuffle, type Rng } from './rng'

export interface PlannedCard { kind: 'complicacao' | 'questionamento'; refId: string; atSec: number }

const FIRST_MIN = 30, FIRST_MAX = 90, GAP = 45, TAIL = 30

export function challengeCount(d: Difficulty): number {
  return d === 'dificil' ? 2 : 1
}

export function scheduleTimes(n: number, durationSec: number, rng: Rng): number[] {
  if (n === 0) return []
  const end = durationSec - TAIL
  if (FIRST_MIN + GAP * (n - 1) > end) throw new Error('Duração curta demais para as cartas')
  const times: number[] = []
  let min = FIRST_MIN
  for (let i = 0; i < n; i++) {
    const remaining = n - 1 - i
    const max = Math.min(i === 0 ? FIRST_MAX : end, end - GAP * remaining)
    const t = Math.floor(min + rng() * (max - min + 1))
    times.push(Math.min(t, max))
    min = times[i] + GAP
  }
  return times
}

export function planCards(
  draw: Draw, challengeIds: string[], d: Difficulty, durationSec: number,
  rng: Rng = Math.random, noneIds: ReadonlySet<string> = new Set(),
): PlannedCard[] {
  const comps = draw.complicationIds.filter((id) => !noneIds.has(id))
    .map((refId) => ({ kind: 'complicacao' as const, refId }))
  const qs = shuffle(challengeIds, rng).slice(0, challengeCount(d))
    .map((refId) => ({ kind: 'questionamento' as const, refId }))
  const ordered = shuffle([...comps, ...qs], rng)
  const times = scheduleTimes(ordered.length, durationSec, rng)
  return ordered.map((c, i) => ({ ...c, atSec: times[i] }))
}
