export type SimMode = 'surpresa' | 'treino'
export type SimStatus = 'sorteado' | 'em_andamento' | 'aguardando_notas' | 'concluido'
export type Role = 'aluna' | 'mentor'

export const STATUS_LABEL: Record<SimStatus, string> = {
  sorteado: 'Sorteado',
  em_andamento: 'Em andamento',
  aguardando_notas: 'Aguardando notas',
  concluido: 'Concluído',
}

/** RF-73: só dá para girar de novo antes de iniciar. */
export const canRespin = (status: SimStatus): boolean => status === 'sorteado'

/** RF-75: a aluna não vê o cenário do simulado surpresa até o mentor encerrar. */
export function isScenarioHidden(mode: SimMode, status: SimStatus, role: Role): boolean {
  return role === 'aluna' && mode === 'surpresa' && (status === 'sorteado' || status === 'em_andamento')
}

/** Rótulo mostrado nas listas. Treino sem a nota do mentor fica só "Treino" (RF-82). */
export function statusLabel(mode: SimMode, status: SimStatus, role: Role): string {
  if (isScenarioHidden(mode, status, role)) return 'Simulado surpresa em andamento'
  if (mode === 'treino' && status !== 'concluido') return 'Treino'
  return STATUS_LABEL[status]
}

/** RF-82: só o simulado concluído (duas fichas) entra na média oficial. */
export const countsInOfficial = (status: SimStatus): boolean => status === 'concluido'

interface SimFlags { mode: SimMode; status: SimStatus; myScoreDone: boolean }

/** RF-76h/i: treino terminado que ainda espera a nota do mentor. */
export function needsMentorReview(s: SimFlags, role: Role): boolean {
  return role === 'mentor' && s.mode === 'treino' && s.status === 'aguardando_notas' && !s.myScoreDone
}

/** RF-79/80: cada um envia a própria ficha uma vez, depois que o simulado terminou. */
export const canSubmitScore = (s: SimFlags): boolean => s.status === 'aguardando_notas' && !s.myScoreDone
