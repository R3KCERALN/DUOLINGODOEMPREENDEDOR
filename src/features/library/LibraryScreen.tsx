import { Link } from 'react-router'
import { Badge, Card, ProgressBar } from '@/design/ui'
import { phaseLabel } from '@/domain/library'
import { useBooks } from './hooks'

/** `/biblioteca` (RF-60/64): os materiais na ordem da trilha; cursos abrem por link externo. */
export function LibraryScreen() {
  const books = useBooks()
  if (books.isLoading) return <p role="status" className="p-6 text-muted">Carregando a biblioteca…</p>
  if (!books.data) return <p role="alert" className="p-6 text-danger">Não foi possível carregar a biblioteca.</p>

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-8">
      <h1 className="font-display text-5xl leading-none font-black text-brand text-glow">Biblioteca</h1>
      <ul className="flex flex-col gap-3">
        {books.data.map((b) => {
          const ratio = b.progress?.totalPages ? b.progress.page / b.progress.totalPages : 0
          return (
            <li key={b.id}>
              <Card className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={b.kind === 'livro' ? 'brand' : 'success'}>{b.kind === 'livro' ? 'Livro' : 'Curso'}</Badge>
                  <Badge tone="muted">{phaseLabel(b.phase)}</Badge>
                </div>
                <h2 className="font-bold">{b.title}</h2>
                {b.author && <p className="text-sm text-muted">{b.author}</p>}
                {b.kind === 'curso' ? (
                  b.externalUrl && <a href={b.externalUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-4">Abrir curso</a>
                ) : (
                  <>
                    {b.progress && b.progress.totalPages && (
                      <ProgressBar value={ratio} label={`${b.title}: página ${b.progress.page} de ${b.progress.totalPages}`} />
                    )}
                    <Link to={`/biblioteca/${b.id}`} className="font-bold text-brand underline underline-offset-4">
                      {b.filePath ? (b.progress ? `Continuar na página ${b.progress.page}` : 'Ler') : 'Ver detalhes'}
                    </Link>
                    {!b.filePath && <p className="text-sm text-muted">PDF ainda não disponível</p>}
                  </>
                )}
              </Card>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
