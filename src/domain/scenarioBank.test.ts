import { nextChallengeId, nextReelId, validateChallengeText, validateReelItem } from './scenarioBank'

test('próximo id continua a numeração do rolo', () => {
  expect(nextReelId(1, ['obj-01', 'obj-30', 'prof-01'])).toBe('obj-31')
  expect(nextReelId(2, ['prof-01', 'prof-15'])).toBe('prof-16')
  expect(nextReelId(4, ['comp-00', 'comp-11'])).toBe('comp-12')
  expect(nextReelId(3, [])).toBe('prod-01')
  expect(nextChallengeId(['card-01', 'card-15'])).toBe('card-16')
})

test('objetivo exige papel do mentor e meta (RF-85)', () => {
  expect(validateReelItem({ reel: 1, label: 'Follow-up' })).toMatch(/papel do mentor/)
  expect(validateReelItem({ reel: 1, label: 'Follow-up', mentorRole: 'Lead que sumiu', studentGoal: 'Retomar' })).toBeNull()
})

test('complicação exige a fala do cliente; perfil e produto só o nome', () => {
  expect(validateReelItem({ reel: 4, label: 'Tá caro' })).toMatch(/fala do cliente/)
  expect(validateReelItem({ reel: 4, label: 'Tá caro', clientLine: 'Achei caro.' })).toBeNull()
  expect(validateReelItem({ reel: 2, label: 'Apressado' })).toBeNull()
  expect(validateReelItem({ reel: 3, label: '  ' })).toMatch(/nome/)
})

test('limites de tamanho', () => {
  expect(validateReelItem({ reel: 2, label: 'x'.repeat(81) })).toMatch(/80/)
  expect(validateChallengeText('')).toMatch(/pergunta/)
  expect(validateChallengeText('x'.repeat(201))).toMatch(/200/)
  expect(validateChallengeText('Tem nota fiscal?')).toBeNull()
})
