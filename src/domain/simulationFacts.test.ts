import { simulationFactsOf, type ResultRow } from './simulationFacts'
import { buildTrailState } from './trailState'

const row = (over: Partial<ResultRow> = {}): ResultRow => ({ objectiveId: 'obj-01', phase: 'f2', difficulty: 'medio', totalOfficial: 16, ...over })

test('separa objetivos avaliados, notas da Fase 2 e notas dos simulados difíceis', () => {
  const f = simulationFactsOf(
    [row(), row({ objectiveId: 'obj-02', phase: 'f3', difficulty: 'dificil', totalOfficial: 23 }), row({ objectiveId: null, totalOfficial: 10 })],
    ['obj-01', 'obj-02'],
  )
  expect([...f.evaluatedObjectiveIds].sort()).toEqual(['obj-01', 'obj-02'])
  expect(f.f2Officials).toEqual([16, 10])
  expect(f.hardOfficials).toEqual([23])
  expect(f.originalObjectiveIds).toEqual(['obj-01', 'obj-02'])
})

test('sem simulados nada é marcado, mesmo com o banco carregado', () => {
  const s = buildTrailState(new Set(), new Map(), simulationFactsOf([], ['obj-01']))
  expect(s.gateDone.has('f2.gate.2')).toBe(false)
  expect(s.gateDone.has('f2.gate.4')).toBe(false)
})

test('banco de originais vazio não marca "fez os 15 cenários" (Review Focus 2)', () => {
  expect(buildTrailState(new Set(), new Map(), simulationFactsOf([], [])).gateDone.has('f2.gate.2')).toBe(false)
})

test('média da Fase 2 com limite inclusivo entra no portão', () => {
  const s = buildTrailState(new Set(), new Map(), simulationFactsOf([row({ totalOfficial: 15 })], ['obj-01']))
  expect(s.gateDone.has('f2.gate.4')).toBe(true)
  expect(s.gateDone.has('f2.gate.2')).toBe(true)
})
