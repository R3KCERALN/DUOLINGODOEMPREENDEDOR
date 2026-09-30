import { NODES } from '@/content/trail'
import { weekday } from './routine'

export interface ChecklistDraft { title: string; weekId: string | null; dueDate: string | null; items: { text: string }[] }

const validDate = (iso: string): boolean => {
  try { weekday(iso); return true } catch { return false }
}

/** RF-42: título, itens, semana e data opcionais. Devolve a mensagem de erro em pt-BR ou `null`. Limites iguais aos do banco. */
export function validateChecklistDraft(d: ChecklistDraft): string | null {
  const title = d.title.trim()
  if (title === '') return 'Dê um título para a lista.'
  if (title.length > 120) return 'O título pode ter no máximo 120 caracteres.'
  const items = d.items.map((i) => i.text.trim())
  if (items.length === 0 || items.every((t) => t === '')) return 'Acrescente pelo menos um item.'
  if (items.some((t) => t === '')) return 'Há itens em branco: preencha ou remova.'
  if (items.some((t) => t.length > 300)) return 'Cada item pode ter no máximo 300 caracteres.'
  if (d.weekId !== null && !NODES.some((n) => n.id === d.weekId && n.week !== undefined)) return 'Semana inválida.'
  if (d.dueDate !== null && !validDate(d.dueDate)) return 'Data inválida.'
  return null
}

export function checklistProgress(items: { done: boolean }[]): { done: number; total: number; ratio: number } {
  const done = items.filter((i) => i.done).length
  return { done, total: items.length, ratio: items.length === 0 ? 0 : done / items.length }
}
