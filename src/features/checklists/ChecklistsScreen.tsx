import { useState } from 'react'
import { Badge, Button, Card, Checkbox, ProgressBar } from '@/design/ui'
import { NODES } from '@/content/trail'
import { checklistProgress } from '@/domain/checklists'
import { useAuth } from '@/features/auth/AuthProvider'
import { ChecklistEditor } from './ChecklistEditor'
import { useChecklists, useDeleteChecklist, useToggleChecklistItem } from './hooks'
import type { Checklist } from './types'

const dueFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })

/** `/caderno/checklists` (RF-42): listas manuais das duas contas; cada uma edita só as suas. */
export function ChecklistsScreen() {
  const { profile } = useAuth()
  const otherName = profile?.role === 'mentor' ? 'Lista da aluna' : 'Lista do mentor'
  const lists = useChecklists()
  const toggle = useToggleChecklistItem()
  const remove = useDeleteChecklist()
  const [editing, setEditing] = useState<Checklist | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  if (lists.isLoading) return <p role="status" className="p-6 text-muted">Carregando as listas…</p>
  if (!lists.data) return <p role="alert" className="p-6 text-danger">Não foi possível carregar as listas.</p>

  return (
    <div className="flex flex-col gap-4">
      {editing ? (
        <ChecklistEditor key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
      ) : (
        <Button variant="secondary" onClick={() => setEditing('new')}>Nova lista</Button>
      )}
      {lists.data.length === 0 && <p className="text-muted">Nenhuma lista ainda.</p>}
      {toggle.error && <p role="alert" className="text-danger">{toggle.error.message}</p>}
      {remove.error && <p role="alert" className="text-danger">{remove.error.message}</p>}
      {lists.data.map((l) => {
        const p = checklistProgress(l.items)
        const week = NODES.find((n) => n.id === l.weekId)
        return (
          <Card key={l.id} className="flex flex-col gap-3">
            <header className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold">{l.title}</h2>
              {!l.mine && <Badge tone="muted">{otherName}</Badge>}
              {week?.week !== undefined && <Badge tone="brand">Semana {week.week}</Badge>}
              {l.dueDate && <Badge tone="streak">Até {dueFormat.format(new Date(`${l.dueDate}T12:00:00Z`))}</Badge>}
            </header>
            <ProgressBar value={p.ratio} label={`${l.title}: ${p.done} de ${p.total}`} />
            <ul className="flex flex-col gap-1">
              {l.items.map((i) => (
                <li key={i.id}>
                  <Checkbox checked={i.done} label={i.text} disabled={!l.mine} onChange={(done) => toggle.mutate({ itemId: i.id, done })} />
                </li>
              ))}
            </ul>
            {l.mine && (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(l)}>Editar {l.title}</Button>
                {confirming === l.id
                  ? <Button size="sm" variant="danger" onClick={() => { remove.mutate(l.id); setConfirming(null) }}>Confirmar exclusão</Button>
                  : <Button size="sm" variant="ghost" onClick={() => setConfirming(l.id)}>Apagar {l.title}</Button>}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
