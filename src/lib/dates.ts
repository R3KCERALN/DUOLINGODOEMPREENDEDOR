export const TZ = 'America/Sao_Paulo'

const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const hourFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' })

export function spDate(d: Date): string {
  return dateFmt.format(d)
}

export function spHour(d: Date): number {
  return Number(hourFmt.format(d))
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(fromIso: string, toIso: string): string[] {
  const out: string[] = []
  for (let cur = fromIso; cur <= toIso; cur = addDays(cur, 1)) out.push(cur)
  return out
}
