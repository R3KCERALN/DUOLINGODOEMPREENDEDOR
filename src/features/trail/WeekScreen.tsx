import { Link, useParams } from 'react-router'
import { NODES, PHASES } from '@/content/trail'
import type { ItemKind, TrailItem } from '@/content/types'
import { Badge, Card, Checkbox, ProgressBar } from '@/design/ui'
import { isNodeComplete } from '@/domain/unlock'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNodeStates, useProgress, useToggleItem } from '@/features/progress/hooks'
import { youtubeEmbedUrl } from './youtube'

const SECTIONS: { kind: ItemKind; title: string }[] = [
  { kind: 'video', title: 'Vídeos' },
  { kind: 'reading', title: 'Leitura' },
  { kind: 'fear', title: 'Degrau da escada do medo' },
  { kind: 'practice', title: 'Prática' },
  { kind: 'delivery', title: 'Entrega' },
]

const linkClass = 'font-bold text-brand underline underline-offset-4'

function ItemRow({ item, checked, onChange }: { item: TrailItem; checked: boolean; onChange: (v: boolean) => void }) {
  const embed = item.kind === 'video' && item.url ? youtubeEmbedUrl(item.url) : null
  return (
    <li className="flex flex-col gap-2">
      {embed && (
        <iframe src={embed} title={item.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; picture-in-picture; fullscreen"
          className="aspect-video w-full rounded-card border border-edge bg-bg" />
      )}
      <Checkbox checked={checked} onChange={onChange} label={item.kind === 'video' ? `Assisti: ${item.title}` : item.title} />
      <div className="flex flex-wrap items-center gap-3 pl-12 text-sm text-muted">
        {item.minutes !== undefined && <span>{item.minutes} min</span>}
        {!item.required && <Badge tone="muted">Opcional</Badge>}
        {item.kind === 'reading' && item.bookId && <Link to={`/biblioteca/${item.bookId}`} className={linkClass}>Abrir na Biblioteca</Link>}
      </div>
    </li>
  )
}

export function WeekScreen() {
  const { nodeId } = useParams()
  const node = NODES.find((n) => n.id === nodeId)
  const { profile } = useAuth()
  const progress = useProgress()
  const trail = useNodeStates()
  const toggle = useToggleItem()

  if (!node) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-3 p-6">
        <p role="alert">Semana não encontrada.</p>
        <Link to="/trilha" className={linkClass}>Voltar para a trilha</Link>
      </main>
    )
  }
  if (progress.isLoading || trail.isLoading) return <p role="status" className="p-6 text-muted">Carregando a semana…</p>
  if (!progress.data || !trail.data) {
    return <p role="alert" className="p-6 text-danger">Não foi possível carregar a semana. Verifique a conexão e recarregue a página.</p>
  }

  const state = trail.data.states.get(node.id) ?? 'locked'
  if (state === 'locked' && profile?.role !== 'mentor') {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-3 p-6">
        <p role="status">Esta etapa ainda está bloqueada. Conclua a anterior para liberar.</p>
        <Link to="/trilha" className={linkClass}>Voltar para a trilha</Link>
      </main>
    )
  }

  const done = progress.data.doneItems
  const required = node.items.filter((i) => i.required)
  const doneCount = required.filter((i) => done.has(i.id)).length
  const phaseIndex = PHASES.findIndex((p) => p.id === node.phase)
  const phase = PHASES[phaseIndex]
  const doneMsg = node.phase === 'f4'
    ? 'Tema concluído.'
    : phase.nodeIds.at(-1) === node.id
      ? 'Semana concluída. Complete o baú da fase no mapa para abrir a próxima fase.'
      : 'Semana concluída. A semana seguinte já está liberada.'

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-6 pb-8">
      <Link to="/trilha" className="text-sm font-bold text-muted underline underline-offset-4">Voltar para a trilha</Link>
      <header className="flex flex-col gap-1">
        <p className="font-bold text-muted">Fase {phaseIndex + 1}: {phase.title}</p>
        <h1 className="font-display text-5xl leading-none font-black text-brand text-glow">
          {node.week !== undefined ? `Semana ${node.week}` : node.title}
        </h1>
        {node.week !== undefined && <p className="text-xl font-bold">{node.title}</p>}
        {state === 'locked' && <span className="self-start"><Badge tone="muted">Bloqueada para a aluna</Badge></span>}
      </header>
      <div className="flex flex-col gap-1">
        <ProgressBar value={required.length ? doneCount / required.length : 1} label="Itens obrigatórios da semana" tone={node.phase} />
        <p className="text-sm text-muted">{doneCount} de {required.length} obrigatórios</p>
      </div>
      {isNodeComplete(node, done) && (
        <Card className="flex flex-col gap-2 border-brand">
          <p role="status" className="font-bold">{doneMsg}</p>
          <Link to="/trilha" className={linkClass}>Ver a trilha</Link>
        </Card>
      )}
      {SECTIONS.map(({ kind, title }) => {
        const items = node.items.filter((i) => i.kind === kind)
        if (items.length === 0) return null
        return (
          <section key={kind} aria-labelledby={`sec-${kind}`} className="flex flex-col gap-3">
            <h2 id={`sec-${kind}`} className="text-lg font-bold">{title}</h2>
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} checked={done.has(item.id)}
                  onChange={(checked) => toggle.mutate({ itemId: item.id, done: checked })} />
              ))}
            </ul>
          </section>
        )
      })}
      {toggle.error && <p role="alert" className="text-danger">{toggle.error.message}</p>}
      <Link to={`/caderno/notas/nova?semana=${node.id}`} className={linkClass}>Criar nota sobre esta semana</Link>
    </main>
  )
}
