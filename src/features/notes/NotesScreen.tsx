import { useState } from 'react'
import { Link } from 'react-router'
import { Badge, Card } from '@/design/ui'
import { noteLinkLabel, snippet } from '@/domain/notes'
import { formatWhen } from '@/features/simulations/format'
import { useDebounced } from '@/lib/useDebounced'
import { useNotes } from './hooks'

/** `/caderno/notas` (RF-51/53): notas com busca. O mentor só vê as que a aluna compartilhou. */
export function NotesScreen() {
  const [search, setSearch] = useState('')
  const term = useDebounced(search, 300)
  const notes = useNotes(term)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1 font-bold">Buscar nas notas
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-12 rounded-control border-2 border-line bg-surface px-3 font-normal focus:border-brand focus:outline-none" />
        </label>
        <Link to="/caderno/notas/nova" className="inline-flex h-12 items-center rounded-control bg-brand px-5 font-bold text-on-brand">Nova nota</Link>
      </div>

      {notes.isLoading && <p role="status" className="text-muted">Carregando as notas…</p>}
      {notes.error && <p role="alert" className="text-danger">Não foi possível carregar as notas.</p>}
      {notes.data?.length === 0 && <p className="text-muted">{term ? 'Nenhuma nota encontrada.' : 'Nenhuma nota ainda.'}</p>}

      <ul className="flex flex-col gap-3">
        {notes.data?.map((n) => (
          <li key={n.id}>
            <Link to={`/caderno/notas/${n.id}`} className="block">
              <Card className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{n.title || 'Sem título'}</h2>
                  {n.mine
                    ? <Badge tone={n.private ? 'muted' : 'success'}>{n.private ? 'Privada' : 'Compartilhada'}</Badge>
                    : <Badge tone="brand">Compartilhada pela aluna</Badge>}
                  {n.link && <Badge tone="streak">{noteLinkLabel(n.link)}</Badge>}
                </div>
                {n.body && <p className="text-sm text-muted">{snippet(n.body)}</p>}
                <p className="text-xs text-muted">Atualizada {formatWhen(n.updatedAt)}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
