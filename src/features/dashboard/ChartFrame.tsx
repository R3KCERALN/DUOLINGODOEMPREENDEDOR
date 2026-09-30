import { useId, type ReactNode } from 'react'
import { Card } from '@/design/ui'

export interface ChartTable { head: string[]; rows: (string | number)[][] }

/** Cartão de gráfico com alternativa acessível: resumo em texto sempre visível e tabela com os dados; o SVG é só decoração. */
export function ChartFrame({ title, summary, table, children }: { title: string; summary: string; table?: ChartTable; children?: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id}>
      <Card className="flex flex-col gap-3">
        <h2 id={id} className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted">{summary}</p>
        {children && <div aria-hidden className="h-60 w-full">{children}</div>}
        {table && (
          <details className="text-sm">
            <summary className="w-fit cursor-pointer font-bold text-brand underline underline-offset-4">Ver os dados em tabela</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">{title}</caption>
                <thead>
                  <tr>{table.head.map((h) => <th key={h} scope="col" className="border-b border-edge py-1 pr-3 font-bold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {table.rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((cell, j) => (j === 0
                        ? <th key={j} scope="row" className="border-b border-edge py-1 pr-3 font-normal">{cell}</th>
                        : <td key={j} className="border-b border-edge py-1 pr-3 tabular-nums">{cell}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </Card>
    </section>
  )
}
