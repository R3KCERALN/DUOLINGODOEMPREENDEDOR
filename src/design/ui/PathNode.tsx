import type { CSSProperties } from 'react'
import type { PhaseId } from '@/content/types'
import type { NodeState } from '@/domain/unlock'
import { PixelIcon } from './PixelIcon'

const stateLabel: Record<NodeState, string> = { locked: 'bloqueada', available: 'disponível', done: 'concluída' }
const face: Record<NodeState, string> = {
  locked: 'bg-bg dither-checker text-locked border-locked/60',
  available: 'bg-surface text-(--chip) border-(--chip)',
  done: 'bg-(--chip) text-on-brand border-on-brand/40',
}
const glyph = { locked: 'lock', available: 'star', done: 'check' } as const

type Props = { state: NodeState; phase: PhaseId; label: string; onClick?: () => void }

// Ficha de cassino: borda com insertos na cor da fase e face central com o estado.
export function PathNode({ state, phase, label, onClick }: Props) {
  const chip = state === 'locked' ? 'var(--color-locked)' : `var(--color-${phase})`
  return (
    <button type="button" onClick={onClick} disabled={state === 'locked'}
      aria-label={`${label}, ${stateLabel[state]}`}
      style={{ '--chip': chip, '--glow': chip } as CSSProperties}
      className={`relative grid size-20 place-items-center rounded-full chip-edge shadow-press
        transition-transform duration-[var(--duration-base)] ease-[var(--ease-bounce)]
        active:translate-y-1 active:shadow-none disabled:cursor-not-allowed
        focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ink
        ${state === 'available' ? 'glow animate-lamp motion-reduce:animate-none' : ''}
        ${state === 'locked' ? 'opacity-80' : ''}`}>
      <span aria-hidden className={`grid size-14 place-items-center rounded-full border-2 border-dashed ${face[state]}`}>
        <PixelIcon name={glyph[state]} className="size-7" />
      </span>
    </button>
  )
}
