import type { PhaseId } from '@/content/types'

export type RoutineKey = 'caderno' | 'voz' | 'voz_alta' | 'leitura' | 'desafio' | 'simulado' | 'video' | 'revisao' | 'chefe'
export interface RoutineItem { key: RoutineKey; label: string; minutes?: number; hint?: string }

const RULE_70_30 = 'Regra 70/30: o cliente fala 70% do tempo e você, 30%.'

/** Dia da semana de uma data de calendário (0 = domingo), sem depender do fuso do aparelho. */
export function weekday(iso: string): number {
  const d = new Date(`${iso}T12:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) {
    throw new Error(`Data inválida: ${iso}`)
  }
  return d.getUTCDay()
}

export function routineItemId(date: string, key: RoutineKey): string {
  return `day.${date}.${key}`
}

/** RF-30/31: rotina do dia. O caderno fica no topo até ser preenchido (RF-50). */
export function dailyRoutine(date: string, phase: PhaseId, journalDone: boolean): RoutineItem[] {
  const caderno: RoutineItem = { key: 'caderno', label: 'Caderno: 3 linhas', minutes: 3 }
  const items: RoutineItem[] = [
    { key: 'voz', label: 'Aquecimento de voz + pitch de 30 s', minutes: 5 },
    { key: 'voz_alta', label: 'Leitura em voz alta', minutes: 5 },
    { key: 'leitura', label: 'Leitura ou audiolivro', minutes: 20 },
    phase === 'f1'
      ? { key: 'desafio', label: 'Desafio da escada do medo', minutes: 10 }
      : { key: 'desafio', label: '1 abordagem real', minutes: 10, hint: RULE_70_30 },
    { key: 'simulado', label: 'Simulado (1 a 3 por dia)', hint: RULE_70_30 },
    { key: 'video', label: 'Vídeo da semana ou curso', minutes: 15 },
  ]
  const day = weekday(date)
  if (day === 6) items.push({ key: 'chefe', label: 'Simulado chefe', minutes: 10 })
  if (day === 0) items.push({ key: 'revisao', label: 'Revisão da semana', minutes: 30 })
  return journalDone ? [...items, caderno] : [caderno, ...items]
}
