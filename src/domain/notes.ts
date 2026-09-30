import { NODES } from '@/content/trail'

export type NoteLinkType = 'week' | 'video' | 'book' | 'simulation'
export interface NoteLink { type: NoteLinkType; id: string }

const PARAM: Record<NoteLinkType, string> = { week: 'semana', video: 'video', book: 'livro', simulation: 'simulado' }
const VALID_ID: Record<NoteLinkType, (id: string) => boolean> = {
  week: (id) => NODES.some((n) => n.id === id && n.week !== undefined),
  video: (id) => NODES.some((n) => n.items.some((i) => i.id === id && i.kind === 'video')),
  book: (id) => /^[a-z0-9-]{1,40}$/.test(id),
  simulation: (id) => /^[0-9a-f-]{36}$/i.test(id),
}

/** `/caderno/notas/nova?semana=w05` → vínculo da nota. Parâmetro desconhecido ou inválido é ignorado. */
export function noteLinkFromParams(p: URLSearchParams): NoteLink | null {
  for (const type of Object.keys(PARAM) as NoteLinkType[]) {
    const id = p.get(PARAM[type])
    if (id && VALID_ID[type](id)) return { type, id }
  }
  return null
}

export function noteLinkLabel(l: NoteLink): string {
  if (l.type === 'week') {
    const n = NODES.find((x) => x.id === l.id)
    return n?.week !== undefined ? `Semana ${n.week}` : (n?.title ?? 'Semana')
  }
  return { video: 'Vídeo', book: 'Livro', simulation: 'Simulado' }[l.type]
}

/** Rota que o vínculo abre. */
export function noteLinkPath(l: NoteLink): string {
  return { week: `/trilha/${l.id}`, video: '/trilha', book: `/biblioteca/${l.id}`, simulation: `/simulados/${l.id}` }[l.type]
}

/** Resumo de uma linha para as listas. */
export function snippet(body: string, max = 120): string {
  const flat = body.replace(/[#*`>]/g, '').replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat
}
