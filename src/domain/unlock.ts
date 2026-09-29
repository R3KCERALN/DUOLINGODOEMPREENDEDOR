import type { Phase, TrailNode } from '@/content/types'

export type NodeState = 'locked' | 'available' | 'done'

export interface UnlockInput {
  phases: Phase[]
  nodes: TrailNode[]
  doneItems: ReadonlySet<string>
  gateDone: ReadonlySet<string>      // itens de portão manuais + automáticos (deriveAutoChecks)
  overrides: ReadonlyMap<string, 'unlocked' | 'locked'>
}

export function isNodeComplete(node: TrailNode, done: ReadonlySet<string>): boolean {
  return node.items.filter((i) => i.required).every((i) => done.has(i.id))
}

export function isGatePassed(phase: Phase, gateDone: ReadonlySet<string>): boolean {
  return phase.gate.every((g) => gateDone.has(g.id))
}

export function computeNodeStates({ phases, nodes, doneItems, gateDone, overrides }: UnlockInput): Map<string, NodeState> {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const states = new Map<string, NodeState>()
  let prevPhaseOpen = true // liberado pela fase anterior (true para a primeira)

  for (const phase of phases) {
    let prevComplete = prevPhaseOpen
    const isF4 = phase.id === 'f4'
    for (const id of phase.nodeIds) {
      const node = byId.get(id)!
      const complete = isNodeComplete(node, doneItems)
      const unlockedByChain = isF4 ? prevPhaseOpen : prevComplete
      const override = overrides.get(id)
      let state: NodeState
      if (override === 'locked') state = 'locked'
      else if (complete && (unlockedByChain || override === 'unlocked')) state = 'done'
      else if (unlockedByChain || override === 'unlocked') state = 'available'
      else state = 'locked'
      states.set(id, state)
      if (!isF4) prevComplete = complete && state !== 'locked'
    }
    const lastId = phase.nodeIds[phase.nodeIds.length - 1]
    prevPhaseOpen = states.get(lastId) === 'done' && isGatePassed(phase, gateDone)
  }
  return states
}
