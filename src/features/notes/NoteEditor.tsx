import { useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Badge, Button, Card, Checkbox, TextArea } from '@/design/ui'
import { noteLinkFromParams, noteLinkLabel, noteLinkPath, type NoteLink } from '@/domain/notes'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAutosave } from '@/lib/useAutosave'
import { useDeleteNote, useNote, useSaveNote } from './hooks'
import { Markdown } from './Markdown'
import type { Note } from './types'

const SAVE_TEXT = { idle: '', saving: 'Salvando…', saved: 'Salvo', error: '' } as const

function NoteForm({ id, initial, link }: { id: string; initial: Note | null; link: NoteLink | null }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const save = useSaveNote()
  const remove = useDeleteNote()
  const editable = initial === null || initial.mine
  const [draft, setDraft] = useState({ title: initial?.title ?? '', body: initial?.body ?? '', private: initial?.private ?? true, link: initial?.link ?? link })
  const [preview, setPreview] = useState(false)
  const [confirming, setConfirming] = useState(false)
  // Depois de pedir a exclusão, nenhum salvamento (nem o de sair da tela) pode recriar a nota.
  const deleting = useRef(false)
  const autosave = useAutosave({ value: draft, save: async (v) => { if (!deleting.current) await save.mutateAsync({ id, ...v }) }, enabled: editable })
  const confirmDelete = async () => {
    await autosave.flush()
    deleting.current = true
    remove.mutate(id, { onSuccess: () => navigate('/caderno/notas'), onError: () => { deleting.current = false } })
  }
  const isMentor = profile?.role === 'mentor'

  return (
    <Card className="flex flex-col gap-4">
      <Link to="/caderno/notas" className="font-bold text-brand underline underline-offset-4">Voltar às notas</Link>
      {!editable && <Badge tone="brand">Compartilhada pela aluna</Badge>}
      {draft.link && (
        <Link to={noteLinkPath(draft.link)} className="w-fit"><Badge tone="streak">{noteLinkLabel(draft.link)}</Badge></Link>
      )}

      {editable ? (
        <>
          <label className="flex flex-col gap-1 font-bold">Título
            <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} maxLength={200}
              className="h-12 rounded-control border-2 border-line bg-surface px-3 font-normal focus:border-brand focus:outline-none" />
          </label>
          {preview
            ? <section aria-label="Pré-visualização"><Markdown source={draft.body} /></section>
            : <TextArea label="Texto (Markdown simples)" value={draft.body} onChange={(body) => setDraft((d) => ({ ...d, body }))} />}
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" onClick={() => setPreview((p) => !p)}>{preview ? 'Editar' : 'Visualizar'}</Button>
            {isMentor
              ? <p className="text-sm text-muted">Só você vê esta nota.</p>
              : <Checkbox checked={!draft.private} label="Compartilhar com o mentor" onChange={(shared) => setDraft((d) => ({ ...d, private: !shared }))} />}
          </div>
          <p aria-live="polite" className="text-sm text-success">{SAVE_TEXT[autosave.status]}</p>
          {autosave.error && <p role="alert" className="text-danger">{autosave.error}</p>}
          {initial && (
            <div className="flex gap-2">
              {confirming
                ? <Button size="sm" variant="danger" loading={remove.isPending} onClick={() => { void confirmDelete() }}>Confirmar exclusão</Button>
                : <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>Apagar nota</Button>}
            </div>
          )}
          {remove.error && <p role="alert" className="text-danger">{remove.error.message}</p>}
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl font-black">{initial?.title || 'Sem título'}</h1>
          <Markdown source={initial?.body ?? ''} />
        </>
      )}
    </Card>
  )
}

/** `/caderno/notas/nova` e `/caderno/notas/:id` (RF-51/52/54): título, Markdown simples, privada por padrão e salvamento automático. */
export function NoteEditor() {
  const { id: param } = useParams()
  const [search] = useSearchParams()
  const [newId] = useState(() => crypto.randomUUID())
  const note = useNote(param)

  if (param !== undefined) {
    if (note.isLoading) return <p role="status" className="text-muted">Carregando a nota…</p>
    if (!note.data) return <p role="alert" className="text-danger">Nota não encontrada.</p>
    return <NoteForm key={param} id={param} initial={note.data} link={null} />
  }
  return <NoteForm id={newId} initial={null} link={noteLinkFromParams(search)} />
}
