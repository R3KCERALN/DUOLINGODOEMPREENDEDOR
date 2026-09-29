import { addDays, daysBetween } from '@/lib/dates'

export function currentStreak(completeDates: ReadonlySet<string>, today: string): number {
  let day = completeDates.has(today) ? today : addDays(today, -1)
  let n = 0
  while (completeDates.has(day)) {
    n++
    day = addDays(day, -1)
  }
  return n
}

export function journalCompliance(completeDates: ReadonlySet<string>, startDate: string, today: string) {
  const past = daysBetween(startDate, addDays(today, -1))
  if (past.length === 0) return { rate: 1, missing: [] as string[] }
  const missing = past.filter((d) => !completeDates.has(d))
  return { rate: (past.length - missing.length) / past.length, missing }
}
