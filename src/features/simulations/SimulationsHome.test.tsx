import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { asyncMutationOf, bankQuery, queryOf, summaryOf } from '@/test/simulationMocks'
import { nodeStatesOf as trailStatesOf } from '@/test/progressMocks'

const navigate = vi.fn()
vi.mock('react-router', async (orig) => ({ ...(await orig<typeof import('react-router')>()), useNavigate: () => navigate }))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('@/features/progress/hooks')
vi.mock('./hooks')

import { useAuth } from '@/features/auth/AuthProvider'
import { useNodeStates } from '@/features/progress/hooks'
import * as sim from './hooks'
import { SimulationsHome } from './SimulationsHome'

const mutateAsync = vi.fn()
function setup(role: 'aluna' | 'mentor', over: { bank?: ReturnType<typeof bankQuery> } = {}) {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(useNodeStates).mockReturnValue(trailStatesOf())
  vi.mocked(sim.useScenarioBank).mockReturnValue(over.bank ?? bankQuery())
  vi.mocked(sim.useRecentObjectives).mockReturnValue(queryOf<string[]>([]))
  vi.mocked(sim.useSimulations).mockReturnValue(queryOf([summaryOf({ id: 's-old', mode: 'surpresa', status: 'em_andamento' })]))
  vi.mocked(sim.usePendingRecordings).mockReturnValue({ pending: 0, flush: vi.fn() })
  vi.mocked(sim.useCreateSimulation).mockReturnValue(asyncMutationOf(mutateAsync))
  vi.mocked(sim.useAdvanceSimulation).mockReturnValue(asyncMutationOf())
  return render(<MemoryRouter><SimulationsHome /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mutateAsync.mockResolvedValue('novo-id')
  vi.spyOn(Math, 'random').mockReturnValue(0)
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), addEventListener: vi.fn(), removeEventListener: vi.fn() })) as never
})

test('mentor vê "Girar a roleta"; aluna vê "Girar para treinar"', () => {
  setup('mentor')
  expect(screen.getByRole('button', { name: 'Girar a roleta' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Editar banco de cenários' })).toBeInTheDocument()
})

test('aluna não vê o atalho do banco de cenários', () => {
  setup('aluna')
  expect(screen.getByRole('button', { name: 'Girar para treinar' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Editar banco de cenários' })).not.toBeInTheDocument()
})

test('dificuldade padrão vem da fase atual e pode ser trocada (RF-71)', async () => {
  setup('mentor')
  expect(screen.getByLabelText('Dificuldade')).toHaveValue('facil')
  await userEvent.selectOptions(screen.getByLabelText('Dificuldade'), 'dificil')
  expect(screen.getByLabelText('Dificuldade')).toHaveValue('dificil')
})

test('banco sem objetivo ativo mostra erro legível em vez de quebrar (Review Focus 3)', async () => {
  const bank = bankQuery()
  bank.data!.items = bank.data!.items.map((i) => (i.reel === 1 ? { ...i, active: false } : i))
  setup('mentor', { bank })
  await userEvent.click(screen.getByRole('button', { name: 'Girar a roleta' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(/objetivo/i)
})

test('mentor: gira, "Iniciar" cria simulado surpresa sem cartas e abre o simulado', async () => {
  setup('mentor')
  await userEvent.click(screen.getByRole('button', { name: 'Girar a roleta' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Iniciar simulado surpresa' }))
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('/simulados/novo-id', { state: undefined }))
  expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ mode: 'surpresa', difficulty: 'facil', phase: 'f1', isBoss: false, cards: [] }))
})

test('aluna: treino sai com cartas agendadas e o plano vai no estado da rota (RF-76c/d)', async () => {
  setup('aluna')
  await userEvent.click(screen.getByRole('button', { name: 'Girar para treinar' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Começar treino' }))
  await waitFor(() => expect(navigate).toHaveBeenCalled())
  const vars = mutateAsync.mock.calls[0][0]
  expect(vars.mode).toBe('treino')
  expect(vars.cards).toHaveLength(1) // fácil: só 1 questionamento
  expect(vars.cards[0].kind).toBe('questionamento')
  const [, opts] = navigate.mock.calls[0]
  expect(opts.state.plan.durationSec).toBe(300)
  expect(opts.state.plan.cardTimes).toEqual(vars.cards.map((c: { atSec: number }) => c.atSec))
})

test('simulado chefe dura 10 min', async () => {
  setup('aluna')
  await userEvent.click(screen.getByRole('checkbox', { name: /simulado chefe/i }))
  await userEvent.click(screen.getByRole('button', { name: 'Girar para treinar' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Começar treino' }))
  await waitFor(() => expect(navigate).toHaveBeenCalled())
  expect(navigate.mock.calls[0][1].state.plan.durationSec).toBe(600)
  expect(mutateAsync.mock.calls[0][0].isBoss).toBe(true)
})

test('histórico: a aluna vê o surpresa em andamento sem cenário; erro do banco aparece', async () => {
  setup('aluna')
  expect(screen.getByText('Simulado surpresa em andamento')).toBeInTheDocument()
  mutateAsync.mockRejectedValueOnce(new Error('Você não tem permissão'))
  await userEvent.click(screen.getByRole('button', { name: 'Girar para treinar' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Começar treino' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Você não tem permissão')
})

test('avisa quando há gravação pendente de envio (RF-76g)', () => {
  setup('aluna')
  vi.mocked(sim.usePendingRecordings).mockReturnValue({ pending: 2, flush: vi.fn() })
  render(<MemoryRouter><SimulationsHome /></MemoryRouter>)
  expect(screen.getAllByRole('status').some((n) => /2 gravações pendentes/.test(n.textContent ?? ''))).toBe(true)
})
