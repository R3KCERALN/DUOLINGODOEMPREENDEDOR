import { planCards, challengeCount } from './cards'
import { seeded } from './rng'

const draw = (comps: string[]) => ({ objectiveId: 'o', profileId: 'p', productId: 'd', complicationIds: comps })
const challenges = ['q1', 'q2', 'q3', 'q4']

test('quantidade de questionamentos por dificuldade', () => {
  expect(challengeCount('facil')).toBe(1)
  expect(challengeCount('medio')).toBe(1)
  expect(challengeCount('dificil')).toBe(2)
})

test('fácil: "Nenhuma" não vira carta; 1 questionamento', () => {
  const c = planCards(draw(['none']), challenges, 'facil', 300, seeded(1), new Set(['none']))
  expect(c.map((x) => x.kind)).toEqual(['questionamento'])
})

test('horários respeitam as regras do RF-76c', () => {
  for (let s = 0; s < 200; s++) {
    const c = planCards(draw(['c1', 'c2', 'c3']), challenges, 'dificil', 300, seeded(s), new Set())
    expect(c).toHaveLength(5)
    expect(c[0].atSec).toBeGreaterThanOrEqual(30)
    expect(c[0].atSec).toBeLessThanOrEqual(90)
    for (let i = 1; i < c.length; i++) expect(c[i].atSec - c[i - 1].atSec).toBeGreaterThanOrEqual(45)
    expect(c[c.length - 1].atSec).toBeLessThanOrEqual(270)
  }
})

test('simulado chefe de 10 min também cabe', () => {
  const c = planCards(draw(['c1', 'c2']), challenges, 'dificil', 600, seeded(9), new Set())
  expect(c.at(-1)!.atSec).toBeLessThanOrEqual(570)
})

test('questionamentos não repetem no mesmo treino', () => {
  const c = planCards(draw(['c1']), challenges, 'dificil', 300, seeded(4), new Set())
  const q = c.filter((x) => x.kind === 'questionamento').map((x) => x.refId)
  expect(new Set(q).size).toBe(q.length)
})
