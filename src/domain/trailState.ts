import { NODES, PHASES, nodeById } from '@/content/trail'
import type { AutoCheck, PhaseId, TrailItem, TrailNode } from '@/content/types'
import { deriveAutoChecks } from './phaseChecks'
import { computeNodeStates, type NodeState } from './unlock'

export interface NodeOverride { nodeId: string; state: 'unlocked' | 'locked'; byName: string; at: string }

export interface SimulationFacts {
  originalObjectiveIds: string[]
  evaluatedObjectiveIds: ReadonlySet<string>
  f2Officials: number[]
  hardOfficials: number[]
}

/** Até a E5 não há simulados avaliados: os itens automáticos que dependem deles ficam desmarcados. */
export const NO_SIMULATIONS: SimulationFacts = { originalObjectiveIds: [], evaluatedObjectiveIds: new Set(), f2Officials: [], hardOfficials: [] }

export interface NextPending { node: TrailNode; item: TrailItem }

export interface TrailState {
  states: ReadonlyMap<string, NodeState>
  gateDone: ReadonlySet<string>
  autoGate: ReadonlySet<string>
  overrides: ReadonlyMap<string, NodeOverride>
  currentPhase: PhaseId
  next: NextPending | null
}

const PATH = PHASES.flatMap((p) => p.nodeIds)
const F1_VIDEO_IDS = NODES.filter((n) => n.phase === 'f1').flatMap((n) => n.items).filter((i) => i.kind === 'video').map((i) => i.id)
const AUTO_GATE = new Map<string, AutoCheck>(PHASES.flatMap((p) => p.gate).flatMap((g) => (g.auto ? [[g.id, g.auto] as const] : [])))

export function gateDoneSet(doneItems: ReadonlySet<string>, auto: ReadonlySet<AutoCheck>): Set<string> {
  const out = new Set<string>()
  for (const g of PHASES.flatMap((p) => p.gate)) {
    const check = AUTO_GATE.get(g.id)
    if (check ? auto.has(check) : doneItems.has(g.id)) out.add(g.id)
  }
  return out
}

export function buildTrailState(
  doneItems: ReadonlySet<string>,
  overrides: ReadonlyMap<string, NodeOverride>,
  sim: SimulationFacts = NO_SIMULATIONS,
): TrailState {
  const auto = deriveAutoChecks({ watchedVideoIds: doneItems, f1VideoIds: F1_VIDEO_IDS, ...sim })
  const gateDone = gateDoneSet(doneItems, auto)
  const states = computeNodeStates({
    phases: PHASES,
    nodes: NODES,
    doneItems,
    gateDone,
    overrides: new Map([...overrides].map(([id, o]) => [id, o.state])),
  })

  let next: NextPending | null = null
  for (const id of PATH) {
    if (states.get(id) !== 'available') continue
    const node = nodeById(id)
    const item = node.items.find((i) => i.required && !doneItems.has(i.id))
    if (item) { next = { node, item }; break }
  }

  const currentId = PATH.find((id) => states.get(id) === 'available') ?? [...PATH].reverse().find((id) => states.get(id) === 'done')
  const currentPhase = currentId ? nodeById(currentId).phase : 'f1'

  return { states, gateDone, autoGate: new Set(AUTO_GATE.keys()), overrides, currentPhase, next }
}
