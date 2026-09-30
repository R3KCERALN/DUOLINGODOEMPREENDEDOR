import { NODES, nodeById, PHASES } from '@/content/trail'
import {
  activityStart, averageGap, currentWeekLabel, evolutionSummary, formatBytes, formatScore, headerFacts, heatmapSummary, heatmapWeeks,
  journalOverview, mondayOf, pendingTrainings, perceptionSummary, phaseProgress, radarByCriterion, radarSummary, SCORE_GOALS,
  selfVsMentor, shortDate, storageSummary, studiedDays, trailPercent, trainingsPerWeek, weeklyOfficial, type ScoreRow,
} from './dashboard'

const at = (iso: string) => new Date(iso)
const criteria = (n: number) => ({ abertura: n, tom: n, perguntas: n, escuta: n, objecao: n, fechamento: n })
const row = (over: Partial<ScoreRow> = {}): ScoreRow => ({
  simulationId: 'a', day: '2026-09-29', weekStart: '2026-09-28', mode: 'surpresa', difficulty: 'medio', phase: 'f2', isBoss: false,
  studentTotal: 20, mentorTotal: 16, official: 18, byCriterion: criteria(3), ...over,
})

test('formatação em pt-BR', () => {
  expect(formatScore(17)).toBe('17,0')
  expect(formatScore(3.5)).toBe('3,5')
  expect(shortDate('2026-09-29')).toBe('29/09')
  expect(formatBytes(0)).toBe('0 B')
  expect(formatBytes(2048)).toBe('2 KB')
  expect(formatBytes(52_428_800)).toBe('50,0 MB')
  expect(formatBytes(1024 ** 3)).toBe('1,0 GB')
  expect(SCORE_GOALS).toEqual({ f2: 15, f4: 22 })
})

test('média oficial por semana, em ordem, com a contagem (RF-91)', () => {
  const rows = [
    row({ weekStart: '2026-09-21', official: 17 }),
    row({ weekStart: '2026-09-14', official: 12 }),
    row({ weekStart: '2026-09-14', official: 14 }),
  ]
  expect(weeklyOfficial(rows)).toEqual([
    { weekStart: '2026-09-14', avg: 13, count: 2 },
    { weekStart: '2026-09-21', avg: 17, count: 1 },
  ])
  expect(weeklyOfficial([])).toEqual([])
})

test('resumo em texto da evolução, com as metas 15 e 22', () => {
  expect(evolutionSummary([])).toBe('Ainda não há simulados com as duas fichas.')
  expect(evolutionSummary([{ weekStart: '2026-09-21', avg: 17, count: 2 }]))
    .toBe('Semana de 21/09: média oficial 17,0 em 2 simulados. Meta 15: atingida. Meta 22: faltam 5,0.')
  expect(evolutionSummary([{ weekStart: '2026-09-21', avg: 23, count: 1 }]))
    .toBe('Semana de 21/09: média oficial 23,0 em 1 simulado. Meta 15: atingida. Meta 22: atingida.')
})

test('autoavaliação × mentor: um ponto por simulado, em ordem de dia (RF-92)', () => {
  const pts = selfVsMentor([
    row({ simulationId: 'b', day: '2026-09-29', studentTotal: 24, mentorTotal: 20 }),
    row({ simulationId: 'a', day: '2026-09-20', studentTotal: 16, mentorTotal: 20 }),
  ])
  expect(pts).toEqual([
    { simulationId: 'a', day: '2026-09-20', student: 16, mentor: 20, gap: -4 },
    { simulationId: 'b', day: '2026-09-29', student: 24, mentor: 20, gap: 4 },
  ])
  expect(averageGap(pts)).toBe(0)
  expect(averageGap([])).toBeNull()
})

test('resumo da diferença de percepção fala com quem está olhando', () => {
  const up = selfVsMentor([row({ studentTotal: 24, mentorTotal: 20 })])
  expect(perceptionSummary(up, 'mentor')).toBe('Ela se avalia, em média, 4,0 pontos acima da nota do mentor.')
  expect(perceptionSummary(up, 'aluna')).toBe('Você se avalia, em média, 4,0 pontos acima da nota do mentor.')
  const down = selfVsMentor([row({ studentTotal: 16, mentorTotal: 20 })])
  expect(perceptionSummary(down, 'mentor')).toBe('Ela se avalia, em média, 4,0 pontos abaixo da nota do mentor.')
  const near = selfVsMentor([row({ simulationId: 'a', studentTotal: 21, mentorTotal: 20 }), row({ simulationId: 'b', studentTotal: 19, mentorTotal: 20 })])
  expect(perceptionSummary(near, 'aluna')).toBe('As duas avaliações estão próximas (diferença média de 0,0).')
  expect(perceptionSummary([], 'aluna')).toBe('Ainda não há simulados com as duas fichas.')
})

test('radar: últimos 28 dias contra os 28 anteriores, com bordas exatas (RF-93)', () => {
  const rows = [
    row({ simulationId: 'r1', day: '2026-09-30', byCriterion: { ...criteria(3), abertura: 4 } }),
    row({ simulationId: 'r2', day: '2026-09-03', byCriterion: { ...criteria(3), abertura: 3 } }), // primeiro dia do período recente
    row({ simulationId: 'p1', day: '2026-09-02', byCriterion: { ...criteria(3), abertura: 2 } }), // último dia do anterior
    row({ simulationId: 'p2', day: '2026-08-06', byCriterion: { ...criteria(3), abertura: 4 } }), // primeiro dia do anterior
    row({ simulationId: 'old', day: '2026-08-05', byCriterion: { ...criteria(3), abertura: 1 } }), // fora
    row({ simulationId: 'fut', day: '2026-10-01', byCriterion: { ...criteria(3), abertura: 1 } }), // dado no futuro é ignorado
  ]
  const pts = radarByCriterion(rows, '2026-09-30')
  expect(pts).toHaveLength(6)
  expect(pts[0]).toEqual({ criterion: 'abertura', label: 'Abertura', recent: 3.5, previous: 3 })
  expect(pts[1]).toMatchObject({ criterion: 'tom', recent: 3, previous: 3 })
})

test('radar sem período anterior ou sem nada não inventa números', () => {
  const only = radarByCriterion([row({ day: '2026-09-30' })], '2026-09-30')
  expect(only.every((p) => p.recent === 3 && p.previous === null)).toBe(true)
  expect(radarSummary(only)).toContain('Abertura 3,0 (sem período anterior)')
  const none = radarByCriterion([], '2026-09-30')
  expect(none.every((p) => p.recent === null && p.previous === null)).toBe(true)
  expect(radarSummary(none)).toBe('Sem simulados com as duas fichas nas últimas 4 semanas.')
  const two = radarByCriterion([row({ simulationId: 'x', day: '2026-09-30' }), row({ simulationId: 'y', day: '2026-09-01' })], '2026-09-30')
  expect(radarSummary(two)).toContain('Abertura 3,0 (antes 3,0)')
})

test('progresso por fase conta itens obrigatórios e itens de portão (RF-95)', () => {
  const requiredIds = (phase: string) => NODES.filter((n) => n.phase === phase).flatMap((n) => n.items).filter((i) => i.required).map((i) => i.id)
  const empty = phaseProgress(new Set(), new Set())
  expect(empty.map((p) => p.phase)).toEqual(['f1', 'f2', 'f3', 'f4'])
  expect(empty.every((p) => p.done === 0 && p.total > 0 && p.ratio === 0)).toBe(true)
  expect(trailPercent(empty)).toBe(0)
  expect(trailPercent([])).toBe(0)

  const full = phaseProgress(new Set(requiredIds('f1')), new Set(PHASES[0].gate.map((g) => g.id)))
  expect(full[0]).toMatchObject({ phase: 'f1', title: 'Comunicação', ratio: 1 })
  expect(full[1].done).toBe(0)
  expect(trailPercent(full)).toBeGreaterThan(0)
  expect(trailPercent(full)).toBeLessThan(1)
})

test('item de portão só conta quando o portão está feito (manual ou automático), não por estar na lista de itens', () => {
  const p = phaseProgress(new Set(['f1.gate.2']), new Set())
  expect(p[0].done).toBe(0)
  expect(phaseProgress(new Set(), new Set(['f1.gate.2']))[0].done).toBe(1)
})

test('dias estudados nas janelas de 7 e 30 dias (RF-90)', () => {
  const days = new Set(['2026-09-30', '2026-09-28', '2026-09-01', '2026-08-31'])
  expect(studiedDays(days, '2026-09-30', 7)).toBe(2)
  expect(studiedDays(days, '2026-09-30', 30)).toBe(3)
  expect(studiedDays(new Set(), '2026-09-30', 30)).toBe(0)
})

test('rótulo da semana atual e cabeçalho', () => {
  expect(currentWeekLabel(nodeById('w05'))).toBe('Semana 5')
  expect(currentWeekLabel(nodeById('f4-marca'))).toBe(nodeById('f4-marca').title)
  expect(currentWeekLabel(null)).toBe('Trilha concluída')
  const facts = headerFacts({
    phase: 'f2', next: nodeById('w05'), progress: phaseProgress(new Set(), new Set()),
    completeDates: new Set(['2026-09-30', '2026-09-29']), today: '2026-09-30',
  })
  expect(facts).toEqual({ phaseLabel: 'Fase 2 · Vendas', weekLabel: 'Semana 5', percent: 0, streak: 2, days7: 2, days30: 2 })
})

test('mapa de calor: semanas de segunda a domingo, futuro vazio, dias sem caderno marcados (RF-94, RF-99a)', () => {
  const weeks = heatmapWeeks([
    { day: '2026-09-29', items: 2, simulations: 0, journal: true },
    { day: '2026-09-30', items: 1, simulations: 0, journal: false },
    { day: '2026-09-23', items: 0, simulations: 0, journal: true },
    { day: '2026-10-05', items: 9, simulations: 0, journal: true }, // dado no futuro não pinta nada
  ], '2026-09-30', 2)
  expect(weeks).toHaveLength(2)
  expect(weeks.every((w) => w.length === 7)).toBe(true)
  expect(weeks[0][0].date).toBe('2026-09-21') // segunda
  expect(weeks[1][0].date).toBe('2026-09-28')
  expect(weeks[1][1]).toEqual({ date: '2026-09-29', kind: 'journal', items: 2, simulations: 0 })
  expect(weeks[1][2].kind).toBe('no_journal') // 30/09: item marcado, sem caderno
  expect(weeks[1][3].kind).toBe('future') // 01/10
  expect(weeks[1][6]).toMatchObject({ date: '2026-10-04', kind: 'future' })
  expect(weeks[0][2].kind).toBe('journal') // 23/09: só o caderno
  expect(weeks[0][1].kind).toBe('none')
  const s = heatmapSummary(weeks)
  expect(s).toEqual({ withJournal: 2, withoutJournal: 1, activeDays: 3, text: '3 dias com atividade: 2 com caderno e 1 sem caderno.' })
  expect(heatmapSummary(heatmapWeeks([], '2026-09-30', 2)).text).toBe('Nenhuma atividade no período.')
  expect(heatmapSummary(heatmapWeeks([{ day: '2026-09-30', items: 1, simulations: 0, journal: false }], '2026-09-30', 1)).text)
    .toBe('1 dia com atividade: 0 com caderno e 1 sem caderno.')
})

test('hoje domingo: a última coluna termina hoje', () => {
  expect(mondayOf('2026-10-04')).toBe('2026-09-28')
  const weeks = heatmapWeeks([], '2026-10-04', 1)
  expect(weeks[0][0].date).toBe('2026-09-28')
  expect(weeks[0][6]).toMatchObject({ date: '2026-10-04', kind: 'none' })
})

test('caderno em dia: ontem antes das 12:00 de SP ainda não é falta (Review Focus 1)', () => {
  const entries = [
    { date: '2026-09-25', complete: true, late: false },
    { date: '2026-09-26', complete: true, late: true },
    { date: '2026-09-27', complete: false, late: false },
  ]
  const noon = journalOverview(entries, '2026-09-25', at('2026-09-30T15:00:00Z'))
  expect(noon.missing).toEqual(['2026-09-27', '2026-09-28', '2026-09-29'])
  expect(noon.rate).toBeCloseTo(2 / 5)
  expect(noon.lateCount).toBe(1)
  expect(noon.since).toBe('2026-09-25')
  const before = journalOverview(entries, '2026-09-25', at('2026-09-30T14:59:00Z'))
  expect(before.missing).toEqual(['2026-09-27', '2026-09-28'])
  expect(before.rate).toBeCloseTo(2 / 4)
  // 02:59Z do dia 30 ainda é dia 29 em SP: o dia 29 (hoje) não é falta e o dia 28 já fechou ao meio-dia do 29
  const night = journalOverview(entries, '2026-09-25', at('2026-09-30T02:59:00Z'))
  expect(night.missing).toEqual(['2026-09-27', '2026-09-28'])
})

test('caderno em dia sem nenhum dia fechado ou sem início não divide por zero', () => {
  expect(journalOverview([], null, at('2026-09-30T15:00:00Z'))).toEqual({ since: null, rate: null, lateCount: 0, missing: [] })
  expect(journalOverview([], '2026-09-30', at('2026-09-30T15:00:00Z')).rate).toBeNull()
})

test('início da contagem é o primeiro dia com atividade ou entrada', () => {
  expect(activityStart([{ day: '2026-09-20', items: 1, simulations: 0, journal: false }], [{ date: '2026-09-25' }])).toBe('2026-09-20')
  expect(activityStart([], [{ date: '2026-09-25' }, { date: '2026-09-24' }])).toBe('2026-09-24')
  expect(activityStart([], [])).toBeNull()
})

test('treinos por semana usam o dia de SP, não o de UTC (RF-97b)', () => {
  const sims = [
    { mode: 'treino' as const, status: 'concluido' as const, createdAt: '2026-09-28T02:00:00Z', myScoreDone: true }, // domingo 27/09 23:00 em SP
    { mode: 'treino' as const, status: 'concluido' as const, createdAt: '2026-09-27T15:00:00Z', myScoreDone: true },
    { mode: 'treino' as const, status: 'aguardando_notas' as const, createdAt: '2026-09-29T15:00:00Z', myScoreDone: false },
    { mode: 'surpresa' as const, status: 'concluido' as const, createdAt: '2026-09-29T15:00:00Z', myScoreDone: true },
  ]
  expect(trainingsPerWeek(sims, '2026-09-30', 3)).toEqual([
    { weekStart: '2026-09-14', count: 0 }, { weekStart: '2026-09-21', count: 2 }, { weekStart: '2026-09-28', count: 1 },
  ])
})

test('treinos aguardando a avaliação do mentor', () => {
  const base = { createdAt: '2026-09-29T15:00:00Z' }
  expect(pendingTrainings([
    { ...base, mode: 'treino', status: 'aguardando_notas', myScoreDone: false },
    { ...base, mode: 'treino', status: 'aguardando_notas', myScoreDone: true },
    { ...base, mode: 'treino', status: 'concluido', myScoreDone: true },
    { ...base, mode: 'surpresa', status: 'aguardando_notas', myScoreDone: false },
  ])).toBe(1)
})

test('uso do Storage: soma, nível e buckets ausentes (RNF-11)', () => {
  const s = storageSummary([{ bucket: 'books', bytes: 52_428_800, files: 1 }])
  expect(s).toMatchObject({ usedBytes: 52_428_800, limitBytes: 1024 ** 3, level: 'ok' })
  expect(s.recordings).toEqual({ bucket: 'recordings', bytes: 0, files: 0 })
  expect(s.ratio).toBeCloseTo(0.0488, 3)
  expect(storageSummary([]).usedBytes).toBe(0)
  expect(storageSummary([{ bucket: 'books', bytes: Math.round(0.85 * 1024 ** 3), files: 5 }]).level).toBe('warn')
  const full = storageSummary([{ bucket: 'recordings', bytes: 2 * 1024 ** 3, files: 9 }])
  expect(full.level).toBe('danger')
  expect(full.ratio).toBe(1)
})
