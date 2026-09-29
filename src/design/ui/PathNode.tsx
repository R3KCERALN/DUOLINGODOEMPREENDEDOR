import type { PhaseId } from '@/content/types'
import type { NodeState } from '@/domain/unlock'

const phaseBg: Record<PhaseId, string> = { f1: 'bg-f1', f2: 'bg-f2', f3: 'bg-f3', f4: 'bg-f4' }
const stateLabel: Record<NodeState, string> = { locked: 'bloqueada', available: 'disponível', done: 'concluída' }

type Props = { state: NodeState; phase: PhaseId; label: string; onClick?: () => void }

export function PathNode({ state, phase, label, onClick }: Props) {
  const color = state === 'locked' ? 'bg-locked' : phaseBg[phase]
  return (
    <button type="button" onClick={onClick} disabled={state === 'locked'}
      aria-label={`${label}, ${stateLabel[state]}`}
      className={`relative grid size-20 place-items-center rounded-full ${color} text-white shadow-press
        transition-transform duration-[var(--duration-base)] ease-[var(--ease-bounce)]
        active:translate-y-1 active:shadow-none disabled:cursor-not-allowed
        focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand
        ${state === 'available' ? 'ring-4 ring-offset-4 ring-offset-bg ring-current animate-pulse motion-reduce:animate-none' : ''}`}>
      <span aria-hidden className="text-3xl">{state === 'locked' ? '🔒' : state === 'done' ? '✓' : '★'}</span>
    </button>
  )
}
