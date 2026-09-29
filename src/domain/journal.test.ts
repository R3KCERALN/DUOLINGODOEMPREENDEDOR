import { writeWindow, isJournalComplete, fieldOk } from './journal'

test('janela igual à do banco (Review Focus 1)', () => {
  expect(writeWindow('2026-09-29', new Date('2026-09-30T02:59:00Z'))).toBe('on_time')
  expect(writeWindow('2026-09-29', new Date('2026-09-30T14:59:00Z'))).toBe('late')
  expect(writeWindow('2026-09-29', new Date('2026-09-30T15:00:00Z'))).toBe('closed')
  expect(writeWindow('2026-10-01', new Date('2026-09-30T10:00:00Z'))).toBe('closed')
})

test('mínimo de 15 caracteres ignorando espaços nas pontas', () => {
  expect(fieldOk('   curto   ')).toBe(false)
  expect(fieldOk('exatamente 15 c')).toBe(true)
  expect(isJournalComplete({ learned: 'aprendi a ouvir mais', practiced: 'pratiquei o pitch hoje', tomorrow: 'x' })).toBe(false)
})
