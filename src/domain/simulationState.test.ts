import { canRespin, canSubmitScore, countsInOfficial, isScenarioHidden, needsMentorReview, statusLabel } from './simulationState'

test('só gira de novo antes de iniciar (RF-73)', () => {
  expect(canRespin('sorteado')).toBe(true)
  expect(canRespin('em_andamento')).toBe(false)
})

test('cenário surpresa fica oculto para a aluna até o encerramento (RF-75)', () => {
  expect(isScenarioHidden('surpresa', 'sorteado', 'aluna')).toBe(true)
  expect(isScenarioHidden('surpresa', 'em_andamento', 'aluna')).toBe(true)
  expect(isScenarioHidden('surpresa', 'aguardando_notas', 'aluna')).toBe(false)
  expect(isScenarioHidden('surpresa', 'em_andamento', 'mentor')).toBe(false)
  expect(isScenarioHidden('treino', 'em_andamento', 'aluna')).toBe(false)
})

test('rótulos: surpresa em andamento para a aluna, "Treino" sem nota do mentor', () => {
  expect(statusLabel('surpresa', 'em_andamento', 'aluna')).toBe('Simulado surpresa em andamento')
  expect(statusLabel('surpresa', 'em_andamento', 'mentor')).toBe('Em andamento')
  expect(statusLabel('treino', 'aguardando_notas', 'aluna')).toBe('Treino')
  expect(statusLabel('treino', 'concluido', 'aluna')).toBe('Concluído')
})

test('só simulado concluído conta na média oficial (RF-82)', () => {
  expect(countsInOfficial('concluido')).toBe(true)
  expect(countsInOfficial('aguardando_notas')).toBe(false)
})

test('treinos para avaliar: só o mentor, só treino terminado sem a ficha dele (RF-76h)', () => {
  const s = { mode: 'treino' as const, status: 'aguardando_notas' as const, myScoreDone: false }
  expect(needsMentorReview(s, 'mentor')).toBe(true)
  expect(needsMentorReview(s, 'aluna')).toBe(false)
  expect(needsMentorReview({ ...s, myScoreDone: true }, 'mentor')).toBe(false)
  expect(needsMentorReview({ ...s, mode: 'surpresa' }, 'mentor')).toBe(false)
})

test('ficha só depois de terminar e uma vez (RF-80)', () => {
  expect(canSubmitScore({ mode: 'treino', status: 'em_andamento', myScoreDone: false })).toBe(false)
  expect(canSubmitScore({ mode: 'treino', status: 'aguardando_notas', myScoreDone: false })).toBe(true)
  expect(canSubmitScore({ mode: 'treino', status: 'aguardando_notas', myScoreDone: true })).toBe(false)
})
