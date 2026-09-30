import { useId } from 'react'
import { Card, ProgressBar } from '@/design/ui'
import { formatBytes, type StorageSummary } from '@/domain/dashboard'

const files = (n: number) => `${n} ${n === 1 ? 'arquivo' : 'arquivos'}`

/** RNF-11 (só mentor): quanto do 1 GB do plano gratuito está em uso, separado entre livros e gravações. */
export function StorageCard({ summary }: { summary: StorageSummary }) {
  const id = useId()
  const percent = Math.round(summary.ratio * 100)
  return (
    <section aria-labelledby={id}>
      <Card className="flex flex-col gap-3">
        <h2 id={id} className="text-lg font-bold">Uso do armazenamento</h2>
        <p className="text-sm text-muted tabular-nums">{formatBytes(summary.usedBytes)} de {formatBytes(summary.limitBytes)} ({percent}%)</p>
        <ProgressBar value={summary.ratio} label="Uso do armazenamento" tone={summary.level === 'ok' ? 'success' : 'f3'} />
        <ul className="flex flex-col gap-1 text-sm tabular-nums">
          <li>Livros: {formatBytes(summary.books.bytes)} ({files(summary.books.files)})</li>
          <li>Gravações: {formatBytes(summary.recordings.bytes)} ({files(summary.recordings.files)})</li>
        </ul>
        {summary.level === 'warn' && (
          <p role="status" className="text-sm font-bold text-streak">Mais de 80% do plano gratuito em uso. Remova gravações já avaliadas ou livros que não usa mais.</p>
        )}
        {summary.level === 'danger' && (
          <p role="alert" className="text-sm font-bold text-danger">Quase no limite do plano gratuito. Libere espaço antes de enviar novos arquivos.</p>
        )}
      </Card>
    </section>
  )
}
