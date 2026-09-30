import type { UseQueryResult } from '@tanstack/react-query'
import { queryOf } from './progressMocks'
import type { BankData, ReelDetail, Scenario, SimulationDetail, SimulationSummary } from '@/features/simulations/types'

export { queryOf, mutationOf } from './progressMocks'

/** Mutation com `mutateAsync` controlável (para telas que fazem `await mutateAsync(...)`). */
export function asyncMutationOf(mutateAsync = vi.fn().mockResolvedValue(undefined), error: Error | null = null, isPending = false): never {
  return { mutate: vi.fn(), mutateAsync, isPending, error, reset: vi.fn() } as never
}

export function summaryOf(over: Partial<SimulationSummary> = {}): SimulationSummary {
  return {
    id: 'sim-1', mode: 'surpresa', difficulty: 'medio', phase: 'f2', status: 'sorteado', isBoss: false,
    createdAt: '2026-09-29T15:00:00Z', startedAt: null, revealedAt: null,
    myScoreDone: false, official: null, hasRecording: false, ...over,
  }
}

const reel = (id: string, label: string, extra: Partial<ReelDetail> = {}): ReelDetail =>
  ({ id, label, mentorRole: null, studentGoal: null, clientLine: null, ...extra })

export function scenarioOf(over: Partial<Scenario> = {}): Scenario {
  return {
    objective: reel('obj-06', 'Objeção de preço', { mentorRole: '"Tá caro"', studentGoal: 'Reancorar valor antes de falar em desconto' }),
    profile: reel('prof-01', 'Apressado'),
    product: reel('prod-01', 'Plano de internet'),
    complications: [reel('comp-01', 'Tá caro', { clientLine: 'Olha, achei caro. Tá fora do meu orçamento.' })],
    ...over,
  }
}

export function detailOf(over: Partial<SimulationDetail> = {}): SimulationDetail {
  return { summary: summaryOf(), scenario: scenarioOf(), cards: [], recording: null, ...over }
}

/** Banco pequeno mas suficiente para a roleta (inclui "Nenhuma" e inativos). */
export function bankOf(): BankData {
  const item = (id: string, reel: 1 | 2 | 3 | 4, label: string, extra: Partial<BankData['items'][number]> = {}) =>
    ({ id, reel, label, active: true, isNone: false, mentorRole: null, studentGoal: null, clientLine: null, original: false, ...extra })
  return {
    items: [
      item('obj-01', 1, 'Captura de lead', { mentorRole: 'Dono de padaria', studentGoal: 'Conseguir o WhatsApp', original: true }),
      item('obj-02', 1, 'Agendamento', { mentorRole: 'Gerente sem tempo', studentGoal: 'Marcar reunião', original: true }),
      item('obj-03', 1, 'Follow-up', { mentorRole: 'Lead que sumiu', studentGoal: 'Obter sim ou não', active: false }),
      item('prof-01', 2, 'Apressado'),
      item('prod-01', 3, 'Plano de internet'),
      item('comp-00', 4, 'Nenhuma', { isNone: true }),
      item('comp-01', 4, 'Tá caro', { clientLine: 'Olha, achei caro.' }),
      item('comp-02', 4, 'Vou pensar', { clientLine: 'Gostei, mas vou pensar.' }),
      item('comp-03', 4, 'Sócio/cônjuge', { clientLine: 'Preciso ver com meu sócio.' }),
    ],
    challenges: [
      { id: 'card-01', text: 'Isso funciona mesmo?', active: true },
      { id: 'card-02', text: 'Qual a garantia?', active: true },
    ],
  }
}

export const bankQuery = (): UseQueryResult<BankData> => queryOf(bankOf())
