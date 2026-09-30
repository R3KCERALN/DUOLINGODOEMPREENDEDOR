import { NODES, PHASES } from '@/content/trail'
import type { PhaseId, TrailNode } from '@/content/types'
import { addDays, daysBetween, spDate } from '@/lib/dates'
import { journalDayStatus } from './journalDays'
import type { Difficulty } from './roulette'
import { weekday } from './routine'
import { average, CRITERIA, CRITERIA_LABELS, type Criterion, type Scores } from './scoring'
import type { SimMode, SimStatus } from './simulationState'
import { currentStreak } from './streak'

/** Metas sobre o total de um simulado (soma dos 6 critérios, de 6 a 30): média ≥ 15 na Fase 2 e ≥ 22 nos difíceis da Fase 4 (RF-91). */
export const SCORE_GOALS = { f2: 15, f4: 22 } as const
export const SCORE_RANGE = { min: 6, max: 30 } as const
/** Plano gratuito do Supabase: 1 GB de Storage (RNF-04, RNF-11). */
export const STORAGE_LIMIT_BYTES = 1024 ** 3

const PERIOD_DAYS = 28
const NO_SCORES = 'Ainda não há simulados com as duas fichas.'

// ---------- linhas vindas do banco (já em America/Sao_Paulo) ----------

/** Uma linha de `v_score_series`: simulado com as duas fichas enviadas. */
export interface ScoreRow {
  simulationId: string
  day: string
  weekStart: string
  mode: SimMode
  difficulty: Difficulty
  phase: PhaseId
  isBoss: boolean
  studentTotal: number
  mentorTotal: number
  official: number
  /** Média oficial de cada critério (as duas fichas). */
  byCriterion: Scores
}

/** Uma linha de `v_activity_days`. `journal` = caderno completo naquele dia. */
export interface ActivityDay { day: string; items: number; simulations: number; journal: boolean }

export type StorageBucket = 'books' | 'recordings'
export interface StorageUsage { bucket: StorageBucket; bytes: number; files: number }

// ---------- formatação ----------

export const formatScore = (n: number): string => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',')

/** '2026-09-29' → '29/09'. */
export const shortDate = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB']
  let v = n
  let i = -1
  do { v /= 1024; i++ } while (v >= 1024 && i < units.length - 1)
  return `${v.toFixed(i === 0 ? 0 : 1).replace('.', ',')} ${units[i]}`
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

/** Segunda-feira da semana de uma data de calendário. */
export const mondayOf = (iso: string): string => addDays(iso, -((weekday(iso) + 6) % 7))

// ---------- notas (RF-91, RF-92, RF-93) ----------

export interface WeekPoint { weekStart: string; avg: number; count: number }

export function weeklyOfficial(rows: ScoreRow[]): WeekPoint[] {
  const byWeek = new Map<string, number[]>()
  for (const r of rows) byWeek.set(r.weekStart, [...(byWeek.get(r.weekStart) ?? []), r.official])
  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, values]) => ({ weekStart, avg: average(values) ?? 0, count: values.length }))
}

export function evolutionSummary(points: WeekPoint[]): string {
  if (points.length === 0) return NO_SCORES
  const last = points[points.length - 1]
  const goal = (label: string, g: number) => (last.avg >= g ? `${label}: atingida.` : `${label}: faltam ${formatScore(g - last.avg)}.`)
  return `Semana de ${shortDate(last.weekStart)}: média oficial ${formatScore(last.avg)} em ${plural(last.count, 'simulado', 'simulados')}. `
    + `${goal('Meta 15', SCORE_GOALS.f2)} ${goal('Meta 22', SCORE_GOALS.f4)}`
}

export interface PerceptionPoint { simulationId: string; day: string; student: number; mentor: number; gap: number }

export function selfVsMentor(rows: ScoreRow[]): PerceptionPoint[] {
  return [...rows]
    .sort((a, b) => a.day.localeCompare(b.day) || a.simulationId.localeCompare(b.simulationId))
    .map((r) => ({ simulationId: r.simulationId, day: r.day, student: r.studentTotal, mentor: r.mentorTotal, gap: r.studentTotal - r.mentorTotal }))
}

/** Positivo = ela se avalia acima do mentor. */
export const averageGap = (points: PerceptionPoint[]): number | null => average(points.map((p) => p.gap))

export function perceptionSummary(points: PerceptionPoint[], viewer: 'mentor' | 'aluna'): string {
  const gap = averageGap(points)
  if (gap === null) return NO_SCORES
  if (Math.abs(gap) < 1) return `As duas avaliações estão próximas (diferença média de ${formatScore(Math.abs(gap))}).`
  const who = viewer === 'mentor' ? 'Ela se avalia' : 'Você se avalia'
  return `${who}, em média, ${formatScore(Math.abs(gap))} pontos ${gap > 0 ? 'acima' : 'abaixo'} da nota do mentor.`
}

export interface RadarPoint { criterion: Criterion; label: string; recent: number | null; previous: number | null }

/** Média oficial por critério: últimos 28 dias (contando hoje) contra os 28 dias anteriores. */
export function radarByCriterion(rows: ScoreRow[], today: string): RadarPoint[] {
  const recentFrom = addDays(today, -(PERIOD_DAYS - 1))
  const previousFrom = addDays(today, -(2 * PERIOD_DAYS - 1))
  const recent = rows.filter((r) => r.day >= recentFrom && r.day <= today)
  const previous = rows.filter((r) => r.day >= previousFrom && r.day < recentFrom)
  return CRITERIA.map((c) => ({
    criterion: c,
    label: CRITERIA_LABELS[c].label,
    recent: average(recent.map((r) => r.byCriterion[c])),
    previous: average(previous.map((r) => r.byCriterion[c])),
  }))
}

export function radarSummary(points: RadarPoint[]): string {
  if (points.every((p) => p.recent === null)) return 'Sem simulados com as duas fichas nas últimas 4 semanas.'
  const part = (p: RadarPoint) => (p.recent === null
    ? `${p.label} sem notas`
    : `${p.label} ${formatScore(p.recent)} (${p.previous === null ? 'sem período anterior' : `antes ${formatScore(p.previous)}`})`)
  return `Últimas 4 semanas: ${points.map(part).join('; ')}.`
}

// ---------- trilha e checklists (RF-90, RF-95) ----------

export interface PhaseProgress { phase: PhaseId; title: string; done: number; total: number; ratio: number }

/** Por fase: itens obrigatórios das semanas + itens do portão. O portão vem de `TrailState.gateDone` (manual ou automático). */
export function phaseProgress(doneItems: ReadonlySet<string>, gateDone: ReadonlySet<string>): PhaseProgress[] {
  return PHASES.map((p) => {
    const items = NODES.filter((n) => n.phase === p.id).flatMap((n) => n.items).filter((i) => i.required).map((i) => i.id)
    const gates = p.gate.map((g) => g.id)
    const total = items.length + gates.length
    const done = items.filter((id) => doneItems.has(id)).length + gates.filter((id) => gateDone.has(id)).length
    return { phase: p.id, title: p.title, done, total, ratio: total === 0 ? 0 : done / total }
  })
}

/** 0 a 1, sobre todos os itens de todas as fases. */
export function trailPercent(progress: PhaseProgress[]): number {
  const total = progress.reduce((n, p) => n + p.total, 0)
  return total === 0 ? 0 : progress.reduce((n, p) => n + p.done, 0) / total
}

/** Dias estudados (caderno completo) em `today` e nos `n - 1` dias anteriores. */
export function studiedDays(completeDates: ReadonlySet<string>, today: string, n: number): number {
  let count = 0
  for (let i = 0; i < n; i++) if (completeDates.has(addDays(today, -i))) count++
  return count
}

export const currentWeekLabel = (node: TrailNode | null): string =>
  node === null ? 'Trilha concluída' : node.week !== undefined ? `Semana ${node.week}` : node.title

export interface HeaderFacts { phaseLabel: string; weekLabel: string; percent: number; streak: number; days7: number; days30: number }

export function headerFacts(i: {
  phase: PhaseId; next: TrailNode | null; progress: PhaseProgress[]; completeDates: ReadonlySet<string>; today: string
}): HeaderFacts {
  const title = PHASES.find((p) => p.id === i.phase)?.title ?? ''
  return {
    phaseLabel: `Fase ${i.phase.slice(1)} · ${title}`,
    weekLabel: currentWeekLabel(i.next),
    percent: Math.round(trailPercent(i.progress) * 100),
    streak: currentStreak(i.completeDates, i.today),
    days7: studiedDays(i.completeDates, i.today, 7),
    days30: studiedDays(i.completeDates, i.today, 30),
  }
}

// ---------- mapa de calor (RF-94, RF-99a) ----------

export type HeatKind = 'future' | 'none' | 'journal' | 'no_journal'
export interface HeatCell { date: string; kind: HeatKind; items: number; simulations: number }

/** Colunas = semanas (segunda a domingo), da mais antiga à atual; cada coluna tem 7 células, segunda em cima. */
export function heatmapWeeks(activity: ActivityDay[], today: string, weeks = 20): HeatCell[][] {
  const byDay = new Map(activity.map((a) => [a.day, a]))
  const first = addDays(mondayOf(today), -7 * (weeks - 1))
  return Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d): HeatCell => {
    const date = addDays(first, w * 7 + d)
    const a = byDay.get(date)
    const items = a?.items ?? 0
    const simulations = a?.simulations ?? 0
    const kind: HeatKind = date > today ? 'future' : a?.journal ? 'journal' : items + simulations > 0 ? 'no_journal' : 'none'
    return { date, kind, items, simulations }
  }))
}

export function heatmapSummary(weeks: HeatCell[][]): { withJournal: number; withoutJournal: number; activeDays: number; text: string } {
  const cells = weeks.flat()
  const withJournal = cells.filter((c) => c.kind === 'journal').length
  const withoutJournal = cells.filter((c) => c.kind === 'no_journal').length
  const activeDays = withJournal + withoutJournal
  const text = activeDays === 0
    ? 'Nenhuma atividade no período.'
    : `${plural(activeDays, 'dia com atividade', 'dias com atividade')}: ${withJournal} com caderno e ${withoutJournal} sem caderno.`
  return { withJournal, withoutJournal, activeDays, text }
}

// ---------- caderno em dia (RF-97a) ----------

export interface JournalEntryFact { date: string; complete: boolean; late: boolean }
export interface JournalOverview { since: string | null; rate: number | null; lateCount: number; missing: string[] }

/** Primeiro dia com atividade ou entrada de caderno: de onde se conta "desde o início". */
export function activityStart(activity: ActivityDay[], entries: { date: string }[]): string | null {
  const all = [...activity.map((a) => a.day), ...entries.map((e) => e.date)].sort()
  return all[0] ?? null
}

/**
 * Taxa de dias com caderno completo desde `start`, dias com atraso e dias em falta. Só conta como falta o dia já
 * fechado (RF-50: ontem só fecha às 12:00 de SP; hoje nunca é falta), por isso usa `journalDayStatus`.
 */
export function journalOverview(entries: JournalEntryFact[], start: string | null, now: Date): JournalOverview {
  const lateCount = entries.filter((e) => e.complete && e.late).length
  if (start === null) return { since: null, rate: null, lateCount, missing: [] }
  const byDate = new Map(entries.map((e) => [e.date, e]))
  const missing: string[] = []
  let closed = 0
  for (const date of daysBetween(start, spDate(now))) {
    const status = journalDayStatus(date, now, byDate.get(date))
    if (status === 'missing') { closed++; missing.push(date) } else if (status === 'done' || status === 'done_late') closed++
  }
  return { since: start, rate: closed === 0 ? null : (closed - missing.length) / closed, lateCount, missing }
}

// ---------- treinos (RF-97b) ----------

export interface TrainingFact { mode: SimMode; status: SimStatus; createdAt: string; myScoreDone: boolean }

/** Treinos criados por semana (segunda a domingo em SP), da mais antiga à atual. */
export function trainingsPerWeek(sims: TrainingFact[], today: string, weeks = 8): { weekStart: string; count: number }[] {
  const starts = Array.from({ length: weeks }, (_, i) => addDays(mondayOf(today), -7 * (weeks - 1 - i)))
  const counts = new Map(starts.map((s) => [s, 0]))
  for (const s of sims) {
    if (s.mode !== 'treino') continue
    const week = mondayOf(spDate(new Date(s.createdAt)))
    if (counts.has(week)) counts.set(week, (counts.get(week) ?? 0) + 1)
  }
  return starts.map((weekStart) => ({ weekStart, count: counts.get(weekStart) ?? 0 }))
}

/** Visão do mentor: treinos ainda sem a ficha dele (`myScoreDone` é a ficha de quem está logado). */
export const pendingTrainings = (sims: TrainingFact[]): number =>
  sims.filter((s) => s.mode === 'treino' && s.status === 'aguardando_notas' && !s.myScoreDone).length

// ---------- Storage (RNF-11) ----------

export type StorageLevel = 'ok' | 'warn' | 'danger'
export interface StorageSummary {
  usedBytes: number
  limitBytes: number
  /** 0 a 1 (limitado a 1 para a barra). */
  ratio: number
  level: StorageLevel
  books: StorageUsage
  recordings: StorageUsage
}

export function storageSummary(rows: StorageUsage[], limit: number = STORAGE_LIMIT_BYTES): StorageSummary {
  const pick = (bucket: StorageBucket): StorageUsage => rows.find((r) => r.bucket === bucket) ?? { bucket, bytes: 0, files: 0 }
  const books = pick('books')
  const recordings = pick('recordings')
  const usedBytes = books.bytes + recordings.bytes
  const raw = usedBytes / limit
  return { usedBytes, limitBytes: limit, ratio: Math.min(1, raw), level: raw >= 0.95 ? 'danger' : raw >= 0.8 ? 'warn' : 'ok', books, recordings }
}
