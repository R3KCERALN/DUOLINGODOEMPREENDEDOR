import type { NoteLink } from '@/domain/notes'

export interface Note {
  id: string
  title: string
  body: string
  /** Padrão `true`: o mentor só vê notas com `private = false` (RF-52, garantido pelo RLS). */
  private: boolean
  link: NoteLink | null
  updatedAt: string
  /** A nota é de quem está logado (só o autor edita e apaga). */
  mine: boolean
}

/** `id` é gerado no cliente (`crypto.randomUUID()`), então salvar de novo nunca cria uma segunda nota. */
export interface SaveNoteVars { id: string; title: string; body: string; private: boolean; link: NoteLink | null }
