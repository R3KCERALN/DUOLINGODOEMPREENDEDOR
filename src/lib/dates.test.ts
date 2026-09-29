import { spDate, spHour, addDays, daysBetween } from './dates'

test('spDate usa o fuso de SP, não o do aparelho', () => {
  // 2026-09-30T02:30Z = 29/09 23:30 em SP (UTC-3)
  expect(spDate(new Date('2026-09-30T02:30:00Z'))).toBe('2026-09-29')
  expect(spDate(new Date('2026-09-30T03:00:00Z'))).toBe('2026-09-30')
})

test('spHour', () => {
  expect(spHour(new Date('2026-09-30T14:59:00Z'))).toBe(11)
  expect(spHour(new Date('2026-09-30T15:00:00Z'))).toBe(12)
})

test('addDays atravessa mês e ano', () => {
  expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
  expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
})

test('daysBetween é inclusivo e vazio se invertido', () => {
  expect(daysBetween('2026-09-28', '2026-09-30')).toEqual(['2026-09-28', '2026-09-29', '2026-09-30'])
  expect(daysBetween('2026-09-30', '2026-09-28')).toEqual([])
})
