import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { PHASES, nodeById } from '@/content/trail'
import type { TrailNode } from '@/content/types'
import { Button, PathNode } from '@/design/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNodeStates } from '@/features/progress/hooks'
import { GateChest } from './GateChest'
import { OverridePanel } from './OverridePanel'

// Zigue-zague do caminho, em múltiplos de 40px.
const OFFSETS = [0, 1, 2, 1, 0, -1, -2, -1]

function nodeLabel(node: TrailNode): string {
  return node.week !== undefined ? `Semana ${node.week}` : node.title
}

export function TrailMap() {
  const { data, isLoading, error } = useNodeStates()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const currentRef = useRef<HTMLDivElement>(null)
  const currentId = data?.next?.node.id

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    currentRef.current?.scrollIntoView?.({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
  }, [currentId])

  if (isLoading) return <p role="status" className="p-6 text-muted">Carregando a trilha…</p>
  if (error || !data) {
    return <p role="alert" className="p-6 text-danger">Não foi possível carregar a trilha. Verifique a conexão e recarregue a página.</p>
  }

  const isMentor = profile?.role === 'mentor'
  return (
    <main className="mx-auto flex max-w-md flex-col gap-12 px-4 pt-6 pb-8">
      <h1 className="font-display text-5xl leading-none font-black text-brand text-glow">Trilha</h1>
      {PHASES.map((phase, pi) => (
        <section key={phase.id} aria-labelledby={`fase-${phase.id}`} className="flex flex-col items-center gap-6">
          <header className="self-stretch">
            <h2 id={`fase-${phase.id}`} className="text-xl font-bold">Fase {pi + 1}: {phase.title}</h2>
            {phase.id === 'f4' && (
              <p className="text-sm text-muted">Depois do baú da Fase 3, todos os temas abrem juntos. Escolha 1 por mês.</p>
            )}
          </header>
          <ol className="flex w-full flex-col items-center gap-6">
            {phase.nodeIds.map((id, i) => {
              const node = nodeById(id)
              const label = nodeLabel(node)
              return (
                <li key={id} className="flex w-full flex-col items-center gap-2">
                  <div ref={id === currentId ? currentRef : undefined}
                    style={{ translate: `${OFFSETS[i % OFFSETS.length] * 40}px 0` }}
                    className="flex flex-col items-center gap-1.5">
                    <PathNode state={data.states.get(id) ?? 'locked'} phase={node.phase} label={label}
                      onClick={() => navigate(`/trilha/${id}`)} />
                    <span className="text-sm font-bold">{label}</span>
                    {node.week !== undefined && <span className="max-w-40 text-center text-xs text-muted">{node.title}</span>}
                    {isMentor && (
                      <Button variant="ghost" size="sm" aria-label={`Ajustar ${label}`} aria-expanded={adjusting === id}
                        onClick={() => setAdjusting(adjusting === id ? null : id)}>Ajustar</Button>
                    )}
                  </div>
                  {isMentor && adjusting === id && <OverridePanel nodeId={id} label={label} current={data.overrides.get(id)} />}
                </li>
              )
            })}
          </ol>
          <GateChest phase={phase} phaseNumber={pi + 1} trail={data} />
        </section>
      ))}
    </main>
  )
}
