import { NODES } from '@/content/trail'
import { buildTrailState, gateDoneSet, type NodeOverride } from './trailState'

const none = new Map<string, NodeOverride>()
const itemsOf = (phase: string) => NODES.filter((n) => n.phase === phase).flatMap((n) => n.items.map((i) => i.id))
const F1_MANUAL_GATE = ['f1.gate.2', 'f1.gate.3', 'f1.gate.4', 'f1.gate.5']

test('trilha nova: só a semana 1 disponível e o próximo item é o 1º obrigatório dela', () => {
  const s = buildTrailState(new Set(), none)
  expect(s.states.get('w01')).toBe('available')
  expect(s.states.get('w02')).toBe('locked')
  expect(s.currentPhase).toBe('f1')
  expect(s.next?.node.id).toBe('w01')
  expect(s.next?.item.id).toBe(NODES[0].items.find((i) => i.required)!.id)
})

test('itens automáticos do portão são identificados', () => {
  expect([...buildTrailState(new Set(), none).autoGate].sort()).toEqual(['f1.gate.1', 'f2.gate.2', 'f2.gate.4', 'f4.gate.3'])
})

test('assistir aos 6 vídeos da Fase 1 marca o item automático do portão', () => {
  const videos = NODES.filter((n) => n.phase === 'f1').flatMap((n) => n.items).filter((i) => i.kind === 'video').map((i) => i.id)
  expect(buildTrailState(new Set(videos), none).gateDone.has('f1.gate.1')).toBe(true)
})

test('item automático não conta quando marcado à mão', () => {
  const s = gateDoneSet(new Set(['f1.gate.1', 'f1.gate.2']), new Set())
  expect(s.has('f1.gate.1')).toBe(false)
  expect(s.has('f1.gate.2')).toBe(true)
})

test('Fase 1 completa com o baú fechado passa a fase atual para a 2', () => {
  const s = buildTrailState(new Set([...itemsOf('f1'), ...F1_MANUAL_GATE]), none)
  expect(s.states.get('w04')).toBe('done')
  expect(s.states.get('w05')).toBe('available')
  expect(s.currentPhase).toBe('f2')
  expect(s.next?.node.id).toBe('w05')
})

test('dados de simulados (E5) alimentam os itens automáticos da Fase 2', () => {
  const s = buildTrailState(new Set(), none, {
    originalObjectiveIds: ['o1'], evaluatedObjectiveIds: new Set(['o1']), f2Officials: [16], hardOfficials: [],
  })
  expect(s.gateDone.has('f2.gate.2')).toBe(true)
  expect(s.gateDone.has('f2.gate.4')).toBe(true)
  expect(buildTrailState(new Set(), none).gateDone.has('f2.gate.4')).toBe(false)
})

test('marcas da rotina diária não interferem na trilha', () => {
  expect(buildTrailState(new Set(['day.2026-09-29.voz']), none).states.get('w02')).toBe('locked')
})

test('override do mentor é repassado e bloqueio tira o próximo item', () => {
  const o: NodeOverride = { nodeId: 'w01', state: 'locked', byName: 'Allan', at: '2026-09-29T15:00:00Z' }
  const s = buildTrailState(new Set(), new Map([['w01', o]]))
  expect(s.states.get('w01')).toBe('locked')
  expect(s.overrides.get('w01')).toEqual(o)
  expect(s.next).toBeNull()
  expect(s.currentPhase).toBe('f1')
})
