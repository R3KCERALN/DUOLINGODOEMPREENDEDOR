import type { ReactNode } from 'react'
import { parseMarkdown, type Block, type Inline } from '@/domain/markdown'

function inline(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case 'text': return n.v
      case 'strong': return <strong key={i}>{inline(n.c)}</strong>
      case 'em': return <em key={i}>{inline(n.c)}</em>
      case 'code': return <code key={i} className="rounded-control bg-raised px-1 font-mono text-[0.9em]">{n.v}</code>
      case 'link': return <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-4">{inline(n.c)}</a>
    }
  })
}

function block(b: Block, i: number): ReactNode {
  switch (b.t) {
    case 'p': return <p key={i} className="whitespace-pre-line">{inline(b.c)}</p>
    case 'h': {
      const cls = b.level === 1 ? 'text-2xl' : b.level === 2 ? 'text-xl' : 'text-lg'
      return <p key={i} role="heading" aria-level={b.level + 1} className={`${cls} font-bold`}>{inline(b.c)}</p>
    }
    case 'ul': return <ul key={i} className="list-disc pl-6">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>
    case 'ol': return <ol key={i} className="list-decimal pl-6">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ol>
  }
}

/** Markdown simples da nota (RF-51), desenhado como elementos React: nenhum HTML cru chega ao DOM. */
export function Markdown({ source }: { source: string }) {
  return <div className="flex flex-col gap-3">{parseMarkdown(source).map(block)}</div>
}
