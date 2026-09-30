import { formatWhen, mmss } from './format'

test('mm:ss', () => {
  expect(mmss(0)).toBe('0:00')
  expect(mmss(125)).toBe('2:05')
  expect(mmss(600)).toBe('10:00')
  expect(mmss(-3)).toBe('0:00')
})

test('data e hora no fuso de São Paulo, não no do aparelho', () => {
  expect(formatWhen('2026-09-30T02:30:00Z')).toBe('29/09, 23:30')
})
