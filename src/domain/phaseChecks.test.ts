import { deriveAutoChecks, type AutoCheckInput } from './phaseChecks'

const base: AutoCheckInput = {
  watchedVideoIds: new Set(), f1VideoIds: ['v1', 'v2'],
  originalObjectiveIds: ['o1', 'o2'], evaluatedObjectiveIds: new Set(),
  f2Officials: [], hardOfficials: [],
}

test('nada marcado sem dados', () => expect(deriveAutoChecks(base).size).toBe(0))

test('lista vazia de objetivos não libera o portão', () => {
  expect(deriveAutoChecks({ ...base, originalObjectiveIds: [] }).has('f2_all_original_objectives')).toBe(false)
})

test('vídeos da F1', () => {
  expect(deriveAutoChecks({ ...base, watchedVideoIds: new Set(['v1', 'v2']) }).has('f1_all_videos')).toBe(true)
})

test('15 cenários originais', () => {
  expect(deriveAutoChecks({ ...base, evaluatedObjectiveIds: new Set(['o1', 'o2', 'x']) }).has('f2_all_original_objectives')).toBe(true)
})

test('médias com limite inclusivo', () => {
  const r = deriveAutoChecks({ ...base, f2Officials: [14, 16], hardOfficials: [22] })
  expect(r.has('f2_avg_15')).toBe(true)
  expect(r.has('f4_hard_avg_22')).toBe(true)
  expect(deriveAutoChecks({ ...base, f2Officials: [14.9] }).has('f2_avg_15')).toBe(false)
})
