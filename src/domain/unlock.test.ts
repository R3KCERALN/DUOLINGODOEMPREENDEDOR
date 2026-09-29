import { computeNodeStates, type UnlockInput } from './unlock'
import type { Phase, TrailNode } from '@/content/types'

const node = (id: string, phase: Phase['id'], req = 1): TrailNode => ({
  id, phase, title: id,
  items: Array.from({ length: req }, (_, i) => ({ id: `${id}.${i}`, kind: 'practice', title: 'x', required: true })),
})
const nodes = [node('a1', 'f1'), node('a2', 'f1'), node('b1', 'f2'), node('b2', 'f2')]
const phases: Phase[] = [
  { id: 'f1', title: 'F1', nodeIds: ['a1', 'a2'], gate: [{ id: 'g1', text: 'g' }] },
  { id: 'f2', title: 'F2', nodeIds: ['b1', 'b2'], gate: [] },
]
const base = (over: Partial<UnlockInput> = {}): UnlockInput =>
  ({ phases, nodes, doneItems: new Set(), gateDone: new Set(), overrides: new Map(), ...over })

test('só o primeiro nó começa disponível', () => {
  const s = computeNodeStates(base())
  expect([...s.values()]).toEqual(['available', 'locked', 'locked', 'locked'])
})

test('concluir a1 libera a2', () => {
  const s = computeNodeStates(base({ doneItems: new Set(['a1.0']) }))
  expect(s.get('a1')).toBe('done')
  expect(s.get('a2')).toBe('available')
})

test('portão de fase segura a próxima fase', () => {
  const s = computeNodeStates(base({ doneItems: new Set(['a1.0', 'a2.0']) }))
  expect(s.get('b1')).toBe('locked')
  const s2 = computeNodeStates(base({ doneItems: new Set(['a1.0', 'a2.0']), gateDone: new Set(['g1']) }))
  expect(s2.get('b1')).toBe('available')
})

test('itens não obrigatórios não travam', () => {
  const n: TrailNode = { id: 'a1', phase: 'f1', title: 'a1', items: [
    { id: 'r', kind: 'video', title: 'r', required: true },
    { id: 'o', kind: 'video', title: 'o', required: false }] }
  const s = computeNodeStates(base({ nodes: [n, ...nodes.slice(1)], doneItems: new Set(['r']) }))
  expect(s.get('a1')).toBe('done')
})

test('override: liberar b1 com trilha incompleta; concluir b1 libera b2 (Review Focus 5)', () => {
  const s = computeNodeStates(base({ overrides: new Map([['b1', 'unlocked']]), doneItems: new Set(['b1.0']) }))
  expect(s.get('b1')).toBe('done')
  expect(s.get('b2')).toBe('available')
})

test('override: bloquear nó concluído o mostra bloqueado', () => {
  const s = computeNodeStates(base({ doneItems: new Set(['a1.0']), overrides: new Map([['a1', 'locked']]) }))
  expect(s.get('a1')).toBe('locked')
})
