import { useId } from 'react'
import { Link } from 'react-router'
import { Card, ProgressBar } from '@/design/ui'
import type { Book } from '@/features/library/types'

/** RF-97 (só mentor): página atual de cada livro. Cursos (link externo) não têm página. */
export function ReadingProgress({ books }: { books: Book[] }) {
  const id = useId()
  const list = books.filter((b) => b.kind === 'livro')
  return (
    <section aria-labelledby={id}>
      <Card className="flex flex-col gap-3">
        <h2 id={id} className="text-lg font-bold">Leitura</h2>
        {list.length === 0 ? (
          <p className="text-sm text-muted">Nenhum livro na biblioteca.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((b) => {
              const p = b.progress
              const total = p?.totalPages ?? null
              return (
                <li key={b.id} className="flex flex-col gap-1">
                  <Link to={`/biblioteca/${b.id}`} className="w-fit font-bold text-brand underline underline-offset-4">{b.title}</Link>
                  <span className="text-sm text-muted tabular-nums">
                    {b.filePath === null ? 'PDF ainda não disponível' : p === null ? 'ainda não começou' : total === null ? `página ${p.page}` : `página ${p.page} de ${total}`}
                  </span>
                  {p !== null && total !== null && total > 0 && (
                    <ProgressBar value={p.page / total} label={`Leitura de ${b.title}`} />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </section>
  )
}
