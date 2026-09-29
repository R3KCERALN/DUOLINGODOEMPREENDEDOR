import { NODES, PHASES } from './trail'

test('16 semanas + 6 temas da Fase 4', () => {
  expect(NODES.filter((n) => n.week).map((n) => n.week)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1))
  expect(NODES.filter((n) => n.phase === 'f4')).toHaveLength(6)
})

test('IDs de itens e portões são únicos', () => {
  const ids = [...NODES.flatMap((n) => n.items.map((i) => i.id)), ...PHASES.flatMap((p) => p.gate.map((g) => g.id))]
  expect(new Set(ids).size).toBe(ids.length)
})

test('21 vídeos com URL do YouTube (PRD Apêndice A)', () => {
  const videos = NODES.flatMap((n) => n.items).filter((i) => i.kind === 'video')
  expect(videos).toHaveLength(21)
  videos.forEach((v) => expect(v.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/))
})

test('Fase 1 tem 6 vídeos', () => {
  const f1 = NODES.filter((n) => n.phase === 'f1').flatMap((n) => n.items).filter((i) => i.kind === 'video')
  expect(f1).toHaveLength(6)
})

test('todo nó pertence a exatamente uma fase, na ordem', () => {
  expect(PHASES.flatMap((p) => p.nodeIds)).toEqual(NODES.map((n) => n.id))
})
