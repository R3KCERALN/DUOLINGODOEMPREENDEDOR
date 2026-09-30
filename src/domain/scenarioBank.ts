export type ReelNumber = 1 | 2 | 3 | 4

export const REEL_TITLES: Record<ReelNumber, string> = { 1: 'Objetivo', 2: 'Perfil do cliente', 3: 'Produto', 4: 'Complicação surpresa' }
const PREFIX: Record<ReelNumber, string> = { 1: 'obj', 2: 'prof', 3: 'prod', 4: 'comp' }

const nextId = (prefix: string, existing: readonly string[]): string => {
  const max = existing
    .filter((id) => id.startsWith(`${prefix}-`))
    .reduce((m, id) => Math.max(m, Number(id.slice(prefix.length + 1)) || 0), 0)
  return `${prefix}-${String(max + 1).padStart(2, '0')}`
}

/** Próximo id livre do rolo (`obj-31`, `prof-16`…). */
export const nextReelId = (reel: ReelNumber, existing: readonly string[]): string => nextId(PREFIX[reel], existing)
/** Próximo id livre do baralho de questionamentos (`card-16`…). */
export const nextChallengeId = (existing: readonly string[]): string => nextId('card', existing)

export interface ReelItemDraft { reel: ReelNumber; label: string; mentorRole?: string; studentGoal?: string; clientLine?: string }

const blank = (s: string | undefined) => !s || s.trim() === ''

/** RF-84/85: devolve a mensagem de erro em pt-BR ou `null` se o item pode ser salvo. */
export function validateReelItem(d: ReelItemDraft): string | null {
  if (blank(d.label)) return 'Escreva o nome do item.'
  if (d.label.trim().length > 80) return 'O nome pode ter no máximo 80 caracteres.'
  if (d.reel === 1 && (blank(d.mentorRole) || blank(d.studentGoal))) return 'Objetivo precisa do papel do mentor e da meta dela.'
  if (d.reel === 4 && blank(d.clientLine)) return 'A complicação precisa da fala do cliente, em primeira pessoa.'
  return null
}

export function validateChallengeText(text: string): string | null {
  if (text.trim() === '') return 'Escreva a pergunta do cliente.'
  if (text.trim().length > 200) return 'A pergunta pode ter no máximo 200 caracteres.'
  return null
}
