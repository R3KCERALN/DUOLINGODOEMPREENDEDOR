import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Badge, Card } from '@/design/ui'
import { phaseLabel } from '@/domain/library'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDebounced } from '@/lib/useDebounced'
import { BookAdmin } from './BookAdmin'
import { useBooks, useBookUrl, useSaveBookProgress } from './hooks'
import { PdfReader } from './PdfReader'
import type { Book } from './types'

function Reader({ book, role }: { book: Book; role: 'aluna' | 'mentor' }) {
  const url = useBookUrl(book.filePath)
  const save = useSaveBookProgress()
  const [seen, setSeen] = useState<{ page: number; total: number } | null>(null)
  const settled = useDebounced(seen, 1000)
  const saved = book.progress?.page

  // RF-63: só a aluna grava a página; espera a leitura assentar (1 s) em vez de gravar a cada virada.
  useEffect(() => {
    if (role === 'aluna' && settled && (settled.page !== saved || book.progress?.totalPages !== settled.total)) {
      save.mutate({ bookId: book.id, page: settled.page, totalPages: settled.total })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled])

  if (url.isLoading) return <p role="status" className="text-muted">Preparando o PDF…</p>
  if (!url.data) return <p role="alert" className="text-danger">Não foi possível preparar o PDF.</p>
  return <PdfReader url={url.data} initialPage={book.progress?.page ?? 1} onPageChange={(page, total) => setSeen({ page, total })} />
}

/** `/biblioteca/:bookId`: leitor de PDF (RF-63), "PDF ainda não disponível" com link opcional (RF-62) e, para o mentor, a administração. */
export function BookScreen() {
  const { bookId } = useParams()
  const { profile } = useAuth()
  const role = profile?.role ?? 'aluna'
  const books = useBooks()

  if (books.isLoading) return <p role="status" className="p-6 text-muted">Carregando…</p>
  const book = books.data?.find((b) => b.id === bookId)
  if (!book) return <p role="alert" className="p-6 text-danger">Material não encontrado.</p>

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-8">
      <Link to="/biblioteca" className="font-bold text-brand underline underline-offset-4">Voltar à biblioteca</Link>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge tone={book.kind === 'livro' ? 'brand' : 'success'}>{book.kind === 'livro' ? 'Livro' : 'Curso'}</Badge>
          <Badge tone="muted">{phaseLabel(book.phase)}</Badge>
        </div>
        <h1 className="font-display text-3xl leading-tight font-black">{book.title}</h1>
        {book.author && <p className="text-muted">{book.author}</p>}
      </header>

      {book.kind === 'curso' && book.externalUrl && (
        <a href={book.externalUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-4">Abrir curso</a>
      )}

      {book.kind === 'livro' && (book.filePath
        ? <Reader key={book.filePath} book={book} role={role} />
        : (
          <Card className="flex flex-col gap-2">
            <p className="font-bold">PDF ainda não disponível</p>
            {book.externalUrl && <a href={book.externalUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-4">Abrir link (compra ou audiolivro)</a>}
          </Card>
        ))}

      {role === 'mentor' && book.kind === 'livro' && <BookAdmin key={`${book.id}:${book.filePath}`} book={book} />}
    </main>
  )
}
