import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookFilePath, clampPage, normalizeExternalUrl, validatePdfFile } from '@/domain/library'
import { fail } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Book, BookProgress, RemoveBookFileVars, SaveBookLinkVars, SaveProgressVars, UploadBookVars } from './types'

const BOOKS = ['books'] as const
const ONLY_MENTOR = 'Só o mentor altera os materiais da biblioteca.'

interface ProgressRow { page: number; total_pages: number | null; updated_at: string }
interface Row {
  id: string; order: number; title: string; author: string | null; phase: string; kind: 'livro' | 'curso'
  file_path: string | null; external_url: string | null; book_progress: ProgressRow | ProgressRow[] | null
}

/** RF-60: os materiais na ordem da trilha, cada um com a última página lida. */
export function useBooks() {
  return useQuery({
    queryKey: BOOKS,
    queryFn: async (): Promise<Book[]> => {
      const { data, error } = await supabase.from('books')
        .select('id, order, title, author, phase, kind, file_path, external_url, book_progress(page, total_pages, updated_at)')
        .order('order')
      if (error) throw error
      return (data as unknown as Row[]).map((r) => {
        const p = Array.isArray(r.book_progress) ? r.book_progress[0] : r.book_progress
        return {
          id: r.id, order: r.order, title: r.title, author: r.author, phase: r.phase, kind: r.kind,
          filePath: r.file_path, externalUrl: r.external_url,
          progress: p ? { page: p.page, totalPages: p.total_pages, updatedAt: p.updated_at } : null,
        }
      })
    },
  })
}

/** RF-65: URL assinada de 1 h; nenhum PDF é público. */
export function useBookUrl(filePath: string | null) {
  return useQuery({
    queryKey: ['book_url', filePath],
    enabled: filePath !== null,
    staleTime: 50 * 60_000,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.storage.from('books').createSignedUrl(filePath!, 3600)
      if (error) throw error
      return data.signedUrl
    },
  })
}

/** RF-63: só a aluna grava a página. Atualiza o cache sem recarregar a lista a cada virada de página. */
export function useSaveBookProgress() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveProgressVars>({
    mutationFn: async ({ bookId, page, totalPages }) => {
      const safe = clampPage(page, totalPages)
      const { error } = await supabase.from('book_progress').upsert({ book_id: bookId, page: safe, total_pages: totalPages }, { onConflict: 'book_id' })
      if (error) fail(error, { '42501': 'Só a aluna salva a página de leitura.' })
    },
    onSuccess: (_d, { bookId, page, totalPages }) => {
      const progress: BookProgress = { page: clampPage(page, totalPages), totalPages, updatedAt: new Date().toISOString() }
      qc.setQueryData<Book[]>(BOOKS, (old) => old?.map((b) => (b.id === bookId ? { ...b, progress } : b)))
    },
  })
}

/** RF-61: só o mentor, só PDF, até 50 MB. Sobe com nome novo, aponta o livro para ele e só então apaga o arquivo anterior. */
export function useUploadBook() {
  const qc = useQueryClient()
  return useMutation<void, Error, UploadBookVars>({
    mutationFn: async ({ bookId, file, previousPath }) => {
      const problem = validatePdfFile(file)
      if (problem) throw new Error(problem)
      const path = bookFilePath(bookId, Date.now())
      const up = await supabase.storage.from('books').upload(path, file, { contentType: 'application/pdf', upsert: false })
      if (up.error) fail(up.error, { 'row-level security': ONLY_MENTOR })
      const row = await supabase.from('books').update({ file_path: path }).eq('id', bookId).select('id')
      if (row.error || !row.data || row.data.length === 0) {
        await supabase.storage.from('books').remove([path])
        if (row.error) fail(row.error)
        throw new Error(ONLY_MENTOR)
      }
      if (previousPath) await supabase.storage.from('books').remove([previousPath])
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BOOKS }),
  })
}

export function useRemoveBookFile() {
  const qc = useQueryClient()
  return useMutation<void, Error, RemoveBookFileVars>({
    mutationFn: async ({ bookId, filePath }) => {
      const row = await supabase.from('books').update({ file_path: null }).eq('id', bookId).select('id')
      if (row.error) throw row.error
      if (!row.data || row.data.length === 0) throw new Error(ONLY_MENTOR)
      await supabase.storage.from('books').remove([filePath])
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BOOKS }),
  })
}

/** RF-62: link externo opcional (compra ou audiolivro); `null` limpa. */
export function useSaveBookLink() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveBookLinkVars>({
    mutationFn: async ({ bookId, externalUrl }) => {
      const url = externalUrl === null || externalUrl.trim() === '' ? null : normalizeExternalUrl(externalUrl)
      if (externalUrl !== null && externalUrl.trim() !== '' && url === null) throw new Error('Use um link que comece com http:// ou https://.')
      const { data, error } = await supabase.from('books').update({ external_url: url }).eq('id', bookId).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error(ONLY_MENTOR)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BOOKS }),
  })
}
