import { dailyRoutine, routineItemId, weekday } from './routine'

const keys = (date: string, phase: 'f1' | 'f2', journalDone: boolean) => dailyRoutine(date, phase, journalDone).map((i) => i.key)

test('weekday usa a data do calendário, sem fuso', () => {
  expect(weekday('2026-09-29')).toBe(2)
  expect(weekday('2026-10-04')).toBe(0)
  expect(() => weekday('2026-02-30')).toThrow('Data inválida')
  expect(() => weekday('29/09/2026')).toThrow('Data inválida')
})

test('caderno fica no topo até ser preenchido e depois vai para o fim', () => {
  expect(keys('2026-09-29', 'f1', false)).toEqual(['caderno', 'voz', 'voz_alta', 'leitura', 'desafio', 'simulado', 'video'])
  expect(keys('2026-09-29', 'f1', true)).toEqual(['voz', 'voz_alta', 'leitura', 'desafio', 'simulado', 'video', 'caderno'])
})

test('sábado tem simulado chefe e domingo tem revisão da semana', () => {
  expect(keys('2026-10-03', 'f1', true)).toContain('chefe')
  expect(keys('2026-10-03', 'f1', true)).not.toContain('revisao')
  expect(keys('2026-10-04', 'f1', true)).toContain('revisao')
  expect(keys('2026-10-04', 'f1', true)).not.toContain('chefe')
})

test('Fase 1 usa a escada do medo; depois vira abordagem real com a regra 70/30', () => {
  const f1 = dailyRoutine('2026-09-29', 'f1', true).find((i) => i.key === 'desafio')!
  const f2 = dailyRoutine('2026-09-29', 'f2', true).find((i) => i.key === 'desafio')!
  expect(f1.label).toBe('Desafio da escada do medo')
  expect(f1.hint).toBeUndefined()
  expect(f2.label).toBe('1 abordagem real')
  expect(f2.hint).toMatch(/70\/30/)
  expect(dailyRoutine('2026-09-29', 'f1', true).find((i) => i.key === 'simulado')!.hint).toMatch(/70\/30/)
})

test('leitura em voz alta faz parte da rotina', () => {
  expect(dailyRoutine('2026-09-29', 'f2', true).find((i) => i.key === 'voz_alta')).toEqual({ key: 'voz_alta', label: 'Leitura em voz alta', minutes: 5 })
})

test('id do item da rotina inclui o dia', () => {
  expect(routineItemId('2026-09-29', 'voz')).toBe('day.2026-09-29.voz')
})
