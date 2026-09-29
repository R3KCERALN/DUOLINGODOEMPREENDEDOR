import { drawScenario, difficultyForPhase, RouletteError, type ReelItem } from './roulette'
import { seeded } from './rng'

const mk = (reel: ReelItem['reel'], n: number, prefix: string): ReelItem[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, reel, label: prefix, active: true, isNone: false }))
const none: ReelItem = { id: 'none', reel: 4, label: 'Nenhuma', active: true, isNone: true }
const bank = [...mk(1, 5, 'o'), ...mk(2, 3, 'p'), ...mk(3, 3, 'd'), none, ...mk(4, 4, 'c')]

test('dificuldade por fase', () => {
  expect(difficultyForPhase('f1')).toBe('facil')
  expect(difficultyForPhase('f2')).toBe('medio')
  expect(difficultyForPhase('f3')).toBe('dificil')
  expect(difficultyForPhase('f4')).toBe('dificil')
})

test('fácil: complicação é só "Nenhuma"', () => {
  expect(drawScenario(bank, 'facil', [], seeded(1)).complicationIds).toEqual(['none'])
})

test('médio: 1 complicação real; difícil: 2 ou 3 distintas, sem "Nenhuma"', () => {
  for (let s = 0; s < 50; s++) {
    const m = drawScenario(bank, 'medio', [], seeded(s)).complicationIds
    expect(m).toHaveLength(1)
    expect(m).not.toContain('none')
    const h = drawScenario(bank, 'dificil', [], seeded(s)).complicationIds
    expect([2, 3]).toContain(h.length)
    expect(new Set(h).size).toBe(h.length)
    expect(h).not.toContain('none')
  }
})

test('não repete os últimos 3 objetivos', () => {
  for (let s = 0; s < 50; s++) {
    expect(['o0', 'o1', 'o2']).not.toContain(drawScenario(bank, 'facil', ['o0', 'o1', 'o2'], seeded(s)).objectiveId)
  }
})

test('se só restam objetivos recentes, usa-os mesmo assim', () => {
  const small = [...mk(1, 2, 'o'), ...mk(2, 1, 'p'), ...mk(3, 1, 'd'), none]
  expect(['o0', 'o1']).toContain(drawScenario(small, 'facil', ['o0', 'o1'], seeded(3)).objectiveId)
})

test('itens inativos nunca saem', () => {
  const b = bank.map((i) => (i.id === 'o4' ? { ...i, active: false } : i))
  for (let s = 0; s < 50; s++) expect(drawScenario(b, 'facil', [], seeded(s)).objectiveId).not.toBe('o4')
})

test('banco vazio gera erro legível (Review Focus 3)', () => {
  const b = bank.map((i) => (i.reel === 1 ? { ...i, active: false } : i))
  expect(() => drawScenario(b, 'facil', [])).toThrow(RouletteError)
  expect(() => drawScenario(b, 'facil', [])).toThrow(/objetivo/i)
})

test('difícil com só 1 complicação ativa usa o que houver', () => {
  const b = [...mk(1, 1, 'o'), ...mk(2, 1, 'p'), ...mk(3, 1, 'd'), none, ...mk(4, 1, 'c')]
  expect(drawScenario(b, 'dificil', [], seeded(2)).complicationIds).toEqual(['c0'])
})
