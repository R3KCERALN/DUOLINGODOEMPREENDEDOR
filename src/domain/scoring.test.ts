import { officialScore, isValidScores, total, average, type Scores } from './scoring'

const all = (n: number): Scores => ({ abertura: n, tom: n, perguntas: n, escuta: n, objecao: n, fechamento: n })

test('total soma os 6 critérios', () => expect(total(all(3))).toBe(18))

test('oficial é a média das duas fichas, 1 casa', () => {
  const r = officialScore({ ...all(3), tom: 4 }, all(4))!
  expect(r.byCriterion.tom).toBe(4)
  expect(r.byCriterion.abertura).toBe(3.5)
  expect(r.total).toBe(21.5)
})

test('sem uma das fichas não há nota oficial (Review Focus 4)', () => {
  expect(officialScore(all(3), null)).toBeNull()
  expect(officialScore(null, all(3))).toBeNull()
})

test('valida faixa 1–5 e inteiros', () => {
  expect(isValidScores(all(5))).toBe(true)
  expect(isValidScores({ ...all(5), tom: 6 })).toBe(false)
  expect(isValidScores({ ...all(5), tom: 2.5 })).toBe(false)
  expect(isValidScores({ abertura: 1 })).toBe(false)
})

test('average', () => {
  expect(average([])).toBeNull()
  expect(average([15, 16])).toBe(15.5)
})
