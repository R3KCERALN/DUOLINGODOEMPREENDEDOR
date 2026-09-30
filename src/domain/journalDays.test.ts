import { DAY_STATUS_LABEL, journalDayStatus, lastDays, yesterdayNotice } from './journalDays'

const at = (iso: string) => new Date(iso)
// 30/09 às 11:59 em SP = 14:59Z; ao meio-dia = 15:00Z
const NOON_MINUS = at('2026-09-30T14:59:00Z')
const NOON = at('2026-09-30T15:00:00Z')

test('fronteira das 12:00 de São Paulo (Review Focus 1)', () => {
  expect(journalDayStatus('2026-09-29', NOON_MINUS, undefined)).toBe('late_window')
  expect(journalDayStatus('2026-09-29', NOON, undefined)).toBe('missing')
})

test('o fuso do aparelho não muda o resultado: 02:59Z do dia 30 ainda é 29 em SP', () => {
  expect(journalDayStatus('2026-09-29', at('2026-09-30T02:59:00Z'), undefined)).toBe('open')
})

test('entrada completa: no prazo ou com atraso, mesmo depois de fechado', () => {
  expect(journalDayStatus('2026-09-29', NOON, { complete: true, late: false })).toBe('done')
  expect(journalDayStatus('2026-09-29', NOON, { complete: true, late: true })).toBe('done_late')
})

test('rascunho incompleto continua pendente até fechar', () => {
  expect(journalDayStatus('2026-09-30', NOON, { complete: false, late: false })).toBe('open')
  expect(journalDayStatus('2026-09-27', NOON, { complete: false, late: false })).toBe('missing')
})

test('dia futuro', () => {
  expect(journalDayStatus('2026-10-01', NOON, undefined)).toBe('future')
  expect(DAY_STATUS_LABEL.missing).toBe('Em falta')
})

test('últimos dias, do mais novo ao mais antigo', () => {
  expect(lastDays('2026-10-01', 3)).toEqual(['2026-10-01', '2026-09-30', '2026-09-29'])
})

test('aviso de ontem na tela Hoje', () => {
  expect(yesterdayNotice(new Set(), NOON)).toEqual({ kind: 'missing', date: '2026-09-29' })
  expect(yesterdayNotice(new Set(), NOON_MINUS)).toEqual({ kind: 'late_window', date: '2026-09-29' })
  expect(yesterdayNotice(new Set(['2026-09-29']), NOON)).toBeNull()
})

test('primeiro dia de uso: ontem ainda não era dia de caderno, então não há aviso', () => {
  expect(yesterdayNotice(new Set(), NOON, '2026-09-30')).toBeNull()
  expect(yesterdayNotice(new Set(), NOON_MINUS, '2026-09-30')).toBeNull()
  expect(yesterdayNotice(new Set(), NOON, '2026-09-29')).toEqual({ kind: 'missing', date: '2026-09-29' })
})
