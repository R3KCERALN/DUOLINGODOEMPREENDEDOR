import { TZ } from '@/lib/dates'

/** 125 → "2:05". */
export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const when = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
/** Data e hora no fuso de São Paulo, ex.: "29/09, 12:30". */
export const formatWhen = (iso: string): string => when.format(new Date(iso))

export const DIFFICULTY_LABEL = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' } as const
