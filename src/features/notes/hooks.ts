import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NoteLink, NoteLinkType } from '@/domain/notes'
import { fail, myId } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Note, SaveNoteVars } from './types'

const NOTES = ['notes'] as const
const COLUMNS = 'id, author, title, body, private, link_type, link_id, updated_at'

interface Row { id: string; author: string; title: string; body: string; private: boolean; link_type: NoteLinkType | null; link_id: string | null; updated_at: string }
const toNote = (r: Row, me: string): Note => ({
  id: r.id, title: r.title, body: r.body, private: r.private, updatedAt: r.updated_at, mine: r.author === me,
  link: r.link_type && r.link_id ? ({ type: r.link_type, id: r.link_id } satisfies NoteLink) : null,
})

/** RF-51/53: notas que o usuário pode ver (as próprias e, para o mentor, as compartilhadas), com busca em português. */
export function useNotes(search: string) {
  const term = search.trim()
  return useQuery({
    queryKey: [...NOTES, term],
    queryFn: async (): Promise<Note[]> => {
      const me = await myId()
      let q = supabase.from('notes').select(COLUMNS).order('updated_at', { ascending: false })
      if (term) q = q.textSearch('search', term, { config: 'portuguese', type: 'websearch' })
      const { data, error } = await q
      if (error) throw error
      return (data as Row[]).map((r) => toNote(r, me))
    },
  })
}

export function useNote(id: string | undefined) {
  return useQuery({
    queryKey: ['note', id],
    enabled: id !== undefined,
    queryFn: async (): Promise<Note | null> => {
      const me = await myId()
      const { data, error } = await supabase.from('notes').select(COLUMNS).eq('id', id!).maybeSingle()
      if (error) throw error
      return data ? toNote(data as Row, me) : null
    },
  })
}

const FRIENDLY = {
  '23514': 'Título (até 200 caracteres) ou texto (até 20.000) grande demais.',
  '42501': 'Só quem escreveu a nota pode editá-la.',
}

/** Cria ou atualiza pelo `id` do cliente: salvar duas vezes (autosave, toque duplo) nunca duplica a nota. */
export function useSaveNote() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveNoteVars>({
    mutationFn: async ({ id, title, body, private: isPrivate, link }) => {
      const { error } = await supabase.from('notes').upsert(
        { id, title, body, private: isPrivate, link_type: link?.type ?? null, link_id: link?.id ?? null },
        { onConflict: 'id' },
      )
      if (error) fail(error, FRIENDLY)
    },
    onSuccess: (_d, v) => Promise.all([qc.invalidateQueries({ queryKey: NOTES }), qc.invalidateQueries({ queryKey: ['note', v.id] })]),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { data, error } = await supabase.from('notes').delete().eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Só quem escreveu a nota pode apagá-la.')
    },
    onSuccess: (_d, id) => Promise.all([qc.invalidateQueries({ queryKey: NOTES }), qc.removeQueries({ queryKey: ['note', id] })]),
  })
}
