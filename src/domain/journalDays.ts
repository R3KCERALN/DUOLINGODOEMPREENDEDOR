import { addDays, spDate } from '@/lib/dates'
import { writeWindow } from './journal'

export type DayStatus = 'done' | 'done_late' | 'open' | 'late_window' | 'missing' | 'future'
export interface DayEntry { complete: boolean; late: boolean }

export const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  done: 'Completo',
  done_late: 'Preenchido com atraso',
  open: 'Pendente',
  late_window: 'Ainda dá para preencher, até 12:00',
  missing: 'Em falta',
  future: '',
}

/** RF-50: situação de um dia do caderno. O dia D fica aberto até 12:00 (SP) de D+1; depois disso, sem entrada completa, está "em falta". */
export function journalDayStatus(date: string, now: Date, entry: DayEntry | undefined): DayStatus {
  if (date > spDate(now)) return 'future'
  if (entry?.complete) return entry.late ? 'done_late' : 'done'
  const w = writeWindow(date, now)
  return w === 'on_time' ? 'open' : w === 'late' ? 'late_window' : 'missing'
}

/** Hoje e os `n - 1` dias anteriores, do mais novo para o mais antigo. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, -i))
}

/**
 * Aviso da tela Hoje: o caderno de ontem em falta (ou ainda dentro do prazo até 12:00).
 * `startDate` é o primeiro dia de uso: antes dele não havia caderno esperado, então não há aviso.
 */
export function yesterdayNotice(
  completeDates: ReadonlySet<string>, now: Date, startDate?: string,
): { kind: 'missing' | 'late_window'; date: string } | null {
  const date = addDays(spDate(now), -1)
  if (startDate !== undefined && date < startDate) return null
  const status = journalDayStatus(date, now, completeDates.has(date) ? { complete: true, late: false } : undefined)
  return status === 'missing' || status === 'late_window' ? { kind: status, date } : null
}
