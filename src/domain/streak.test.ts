import { currentStreak, journalCompliance } from './streak'

const set = (...d: string[]) => new Set(d)

test('hoje ainda aberto não quebra o streak', () => {
  expect(currentStreak(set('2026-09-27', '2026-09-28'), '2026-09-29')).toBe(2)
})

test('hoje feito conta', () => {
  expect(currentStreak(set('2026-09-28', '2026-09-29'), '2026-09-29')).toBe(2)
})

test('buraco ontem zera', () => {
  expect(currentStreak(set('2026-09-27'), '2026-09-29')).toBe(0)
})

test('compliance ignora hoje (ainda aberto) e lista dias em falta', () => {
  const r = journalCompliance(set('2026-09-26', '2026-09-28'), '2026-09-26', '2026-09-29')
  expect(r.missing).toEqual(['2026-09-27'])
  expect(r.rate).toBeCloseTo(2 / 3)
})

test('primeiro dia: taxa 1 sem dias passados', () => {
  expect(journalCompliance(set(), '2026-09-29', '2026-09-29')).toEqual({ rate: 1, missing: [] })
})
