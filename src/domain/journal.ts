import { addDays, spDate, spHour } from '@/lib/dates'

export const MIN_FIELD = 15

export interface JournalFields { learned: string; practiced: string; tomorrow: string }
export type WriteWindow = 'on_time' | 'late' | 'closed'

export function fieldOk(text: string): boolean {
  return text.trim().length >= MIN_FIELD
}

export function isJournalComplete(e: JournalFields): boolean {
  return fieldOk(e.learned) && fieldOk(e.practiced) && fieldOk(e.tomorrow)
}

/** Espelho de public.journal_window — o banco é a autoridade. */
export function writeWindow(entryDate: string, now: Date): WriteWindow {
  const today = spDate(now)
  if (entryDate === today) return 'on_time'
  if (entryDate === addDays(today, -1) && spHour(now) < 12) return 'late'
  return 'closed'
}
