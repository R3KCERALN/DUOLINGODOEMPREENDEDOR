import { useState } from 'react'
import { Button, Card } from '@/design/ui'
import { NODES } from '@/content/trail'
import { validateChecklistDraft } from '@/domain/checklists'
import { useSaveChecklist } from './hooks'
import type { Checklist } from './types'

const WEEKS = NODES.filter((n) => n.week !== undefined)
const inputClass = 'h-12 rounded-control border-2 border-line bg-surface px-3 font-normal focus:border-brand'

/** Cria ou edita uma lista (RF-42): título, itens, semana e data opcionais. Os ids nascem aqui, então salvar de novo é seguro. */
export function ChecklistEditor({ initial, onDone }: { initial?: Checklist; onDone(): void }) {
  const save = useSaveChecklist()
  const [id] = useState(() => initial?.id ?? crypto.randomUUID())
  const [title, setTitle] = useState(initial?.title ?? '')
  const [weekId, setWeekId] = useState(initial?.weekId ?? '')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [items, setItems] = useState<{ id: string; text: string }[]>(
    initial?.items.map((i) => ({ id: i.id, text: i.text })) ?? [{ id: crypto.randomUUID(), text: '' }],
  )

  const draft = { title, weekId: weekId || null, dueDate: dueDate || null, items }
  const problem = validateChecklistDraft(draft)
  const setText = (itemId: string, text: string) => setItems((xs) => xs.map((x) => (x.id === itemId ? { ...x, text } : x)))

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-black">{initial ? 'Editar lista' : 'Nova lista'}</h2>
      <label className="flex flex-col gap-1 font-bold">Título
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </label>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 font-bold">Semana (opcional)
          <select value={weekId} onChange={(e) => setWeekId(e.target.value)} className={inputClass}>
            <option value="">Nenhuma</option>
            {WEEKS.map((w) => <option key={w.id} value={w.id}>Semana {w.week}: {w.title}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-bold">Data (opcional)
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-bold">Itens</legend>
        {items.map((it, n) => (
          <div key={it.id} className="flex gap-2">
            <input aria-label={`Item ${n + 1}`} value={it.text} onChange={(e) => setText(it.id, e.target.value)} className={`${inputClass} flex-1`} />
            <Button variant="ghost" size="sm" aria-label={`Remover item ${n + 1}`} onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}>Remover</Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => setItems((xs) => [...xs, { id: crypto.randomUUID(), text: '' }])}>Adicionar item</Button>
      </fieldset>

      {problem && title !== '' && <p aria-live="polite" className="text-sm text-muted">{problem}</p>}
      {save.error && <p role="alert" className="text-danger">{save.error.message}</p>}
      <div className="flex gap-2">
        <Button disabled={problem !== null} loading={save.isPending} onClick={() => save.mutate({ id, ...draft }, { onSuccess: onDone })}>Salvar lista</Button>
        <Button variant="ghost" onClick={onDone}>Cancelar</Button>
      </div>
    </Card>
  )
}
