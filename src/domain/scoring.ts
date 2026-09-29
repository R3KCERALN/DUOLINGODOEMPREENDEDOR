export const CRITERIA = ['abertura', 'tom', 'perguntas', 'escuta', 'objecao', 'fechamento'] as const
export type Criterion = (typeof CRITERIA)[number]
export type Scores = Record<Criterion, number>

export const CRITERIA_LABELS: Record<Criterion, { label: string; hint: string }> = {
  abertura:   { label: 'Abertura', hint: 'Disse quem é e o motivo em até 20 segundos?' },
  tom:        { label: 'Tom e energia', hint: 'Voz firme, sem pedir desculpas, sorriso na voz?' },
  perguntas:  { label: 'Perguntas', hint: 'Fez mais perguntas do que afirmações?' },
  escuta:     { label: 'Escuta', hint: 'Usou as palavras do cliente na proposta?' },
  objecao:    { label: 'Objeção', hint: 'Acolheu antes de rebater? Descobriu a objeção real?' },
  fechamento: { label: 'Fechamento', hint: 'Pediu a venda ou um próximo passo com data?' },
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function isValidScores(s: unknown): s is Scores {
  if (typeof s !== 'object' || s === null) return false
  return CRITERIA.every((c) => {
    const v = (s as Record<string, unknown>)[c]
    return Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5
  })
}

export function total(s: Scores): number {
  return CRITERIA.reduce((acc, c) => acc + s[c], 0)
}

export function officialScore(student: Scores | null, mentor: Scores | null) {
  if (!student || !mentor) return null
  const byCriterion = Object.fromEntries(CRITERIA.map((c) => [c, round1((student[c] + mentor[c]) / 2)])) as Scores
  return { byCriterion, total: round1((total(student) + total(mentor)) / 2) }
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null
  return round1(values.reduce((a, b) => a + b, 0) / values.length)
}
