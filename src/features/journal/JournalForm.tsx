import { useState } from 'react'
import { Badge, Card, TextArea } from '@/design/ui'
import { fieldOk, MIN_FIELD, writeWindow } from '@/domain/journal'
import { DAY_STATUS_LABEL, journalDayStatus, type DayStatus } from '@/domain/journalDays'
import { useAutosave } from '@/lib/useAutosave'
import { useSaveJournalEntry } from './hooks'
import type { JournalEntry } from './types'

const TONE: Record<DayStatus, 'brand' | 'success' | 'streak' | 'muted'> = {
  done: 'success', done_late: 'streak', open: 'brand', late_window: 'streak', missing: 'muted', future: 'muted',
}
const longDate = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
const SAVE_TEXT = { idle: '', saving: 'Salvando…', saved: 'Salvo', error: '' } as const

/** Um dia do caderno (RF-50/54): 3 campos de pelo menos 15 caracteres, salvamento automático e marca de atraso. */
export function JournalForm({ date, initial }: { date: string; initial: JournalEntry | undefined }) {
  const [now] = useState(() => new Date())
  const save = useSaveJournalEntry()
  const [fields, setFields] = useState({ learned: initial?.learned ?? '', practiced: initial?.practiced ?? '', tomorrow: initial?.tomorrow ?? '' })
  const closed = writeWindow(date, now) === 'closed'
  const autosave = useAutosave({ value: fields, save: (v) => save.mutateAsync({ date, ...v }), enabled: !closed })

  // O banco decide `complete` e `late`; enquanto nada foi salvo, vale o que já existia.
  const server = save.data ?? initial
  const status = journalDayStatus(date, now, server ? { complete: server.complete, late: server.late } : undefined)
  const set = (k: keyof typeof fields) => (v: string) => setFields((f) => ({ ...f, [k]: v }))
  const shortFields = Object.values(fields).some((v) => !fieldOk(v))

  return (
    <Card className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl leading-tight font-black first-letter:uppercase">{longDate.format(new Date(`${date}T12:00:00Z`))}</h2>
        <Badge tone={TONE[status]}>{DAY_STATUS_LABEL[status]}</Badge>
      </header>

      {closed && <p role="status" className="font-bold text-muted">Este dia está fechado: o prazo era até 12:00 do dia seguinte (horário de São Paulo).</p>}
      {status === 'late_window' && <p role="status" className="text-streak">Você ainda pode preencher este dia até 12:00. Ele vai constar como preenchido com atraso.</p>}

      <TextArea label="Uma coisa que aprendi" value={fields.learned} onChange={set('learned')} minChars={MIN_FIELD} disabled={closed} />
      <TextArea label="Uma coisa que pratiquei" value={fields.practiced} onChange={set('practiced')} minChars={MIN_FIELD} disabled={closed} />
      <TextArea label="Uma coisa para amanhã" value={fields.tomorrow} onChange={set('tomorrow')} minChars={MIN_FIELD} disabled={closed} />

      {!closed && shortFields && <p className="text-sm text-muted">O dia só conta como completo com os 3 campos de pelo menos {MIN_FIELD} caracteres.</p>}
      <p aria-live="polite" className="text-sm text-success">{SAVE_TEXT[autosave.status]}</p>
      {autosave.error && <p role="alert" className="text-danger">{autosave.error}</p>}
    </Card>
  )
}
