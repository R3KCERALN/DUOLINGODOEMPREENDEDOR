import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { asyncMutationOf, detailOf, queryOf, scenarioOf, summaryOf } from '@/test/simulationMocks'
import type { ScoreSheet, SimulationDetail as Detail } from './types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')
vi.mock('./ScoreSheetForm', () => ({ ScoreSheetForm: () => <p>ficha aberta</p> }))
vi.mock('./RecordingPlayer', () => ({
  RecordingPlayer: ({ markers }: { markers: { atSec: number; label: string }[] }) => <p>player: {markers.map((m) => `${m.atSec}:${m.label}`).join('|')}</p>,
}))

import { useAuth } from '@/features/auth/AuthProvider'
import * as sim from './hooks'
import { SimulationDetail } from './SimulationDetail'

const advance = vi.fn()
const sheet = (role: 'aluna' | 'mentor', n: number, extra: Partial<ScoreSheet> = {}): ScoreSheet => ({
  raterRole: role, mine: false, submittedAt: 'x', good: '', improve: '',
  scores: { abertura: n, tom: n, perguntas: n, escuta: n, objecao: n, fechamento: n }, ...extra,
})

function setup(role: 'aluna' | 'mentor', detail: Detail, scores: ScoreSheet[] = []) {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(sim.useSimulation).mockReturnValue(queryOf(detail))
  vi.mocked(sim.useScores).mockReturnValue(queryOf(scores))
  vi.mocked(sim.useAdvanceSimulation).mockReturnValue({ ...(asyncMutationOf() as object), mutate: advance } as never)
  return render(<MemoryRouter initialEntries={['/simulados/sim-1']}><Routes><Route path="/simulados/:id" element={<SimulationDetail />} /></Routes></MemoryRouter>)
}
const withSummary = (over: Parameters<typeof summaryOf>[0], rest: Partial<Detail> = {}) => detailOf({ summary: summaryOf(over), ...rest })

beforeEach(() => vi.clearAllMocks())

test('aluna não vê o cenário do surpresa em andamento, nem se ele vier do banco (RF-75)', () => {
  setup('aluna', withSummary({ mode: 'surpresa', status: 'em_andamento' }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Simulado surpresa em andamento')
  expect(screen.getByText(/aparece quando o mentor encerrar/)).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Cenário' })).not.toBeInTheDocument()
  expect(screen.queryByText('Objeção de preço')).not.toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('mentor vê o cenário completo e encerra o simulado', async () => {
  setup('mentor', withSummary({ mode: 'surpresa', status: 'em_andamento' }))
  expect(screen.getByText('Objeção de preço')).toBeInTheDocument()
  expect(screen.getByText(/Papel do mentor:/)).toBeInTheDocument()
  expect(screen.getByText(/Olha, achei caro/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Encerrar simulado' }))
  expect(advance).toHaveBeenCalledWith({ id: 'sim-1', to: 'aguardando_notas' })
})

test('depois de encerrado a aluna vê o cenário e a ficha', () => {
  setup('aluna', withSummary({ mode: 'surpresa', status: 'aguardando_notas' }))
  expect(screen.getByRole('heading', { name: 'Cenário' })).toBeInTheDocument()
  expect(screen.getByText('ficha aberta')).toBeInTheDocument()
})

test('ficha já enviada mostra o aviso e não abre outra (RF-80)', () => {
  setup('aluna', withSummary({ mode: 'surpresa', status: 'aguardando_notas', myScoreDone: true }))
  expect(screen.queryByText('ficha aberta')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Ficha enviada')
})

test('treino em andamento (página recarregada): complicações e cartas ficam ocultas e dá para encerrar (RF-76a)', async () => {
  const cards = [{ position: 0, kind: 'complicacao' as const, refId: 'comp-01', text: 'Olha, achei caro.', shownAtSec: null }]
  setup('aluna', withSummary({ mode: 'treino', status: 'em_andamento' }, { cards }))
  expect(screen.queryByText(/achei caro/)).not.toBeInTheDocument()
  expect(screen.queryByText('Cartas do treino')).not.toBeInTheDocument()
  expect(screen.getByText(/como cartas durante o treino/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Encerrar treino' }))
  expect(advance).toHaveBeenCalledWith({ id: 'sim-1', to: 'aguardando_notas' })
})

test('treino terminado: linha do tempo das cartas, player com marcadores e aviso de média (RF-76f/82)', () => {
  const cards = [
    { position: 0, kind: 'complicacao' as const, refId: 'comp-01', text: 'Olha, achei caro.', shownAtSec: 62 },
    { position: 1, kind: 'questionamento' as const, refId: 'card-01', text: 'Isso funciona mesmo?', shownAtSec: null },
  ]
  const recording = { filePath: 's/a.webm', mime: 'audio/webm', durationSec: 300, sizeBytes: 1, keep: false, deleteAfter: null }
  setup('mentor', withSummary({ mode: 'treino', status: 'aguardando_notas', hasRecording: true }, { cards, recording }))
  expect(screen.getByText('1:02')).toBeInTheDocument()
  expect(screen.getByText('Não apareceu')).toBeInTheDocument()
  expect(screen.getByText('player: 62:Olha, achei caro.')).toBeInTheDocument()
  expect(screen.getByText(/ainda não conta na média oficial/)).toBeInTheDocument()
  expect(screen.getByText('ficha aberta')).toBeInTheDocument()
})

test('concluído: nota oficial = média das duas fichas, com as duas colunas e os comentários', () => {
  setup('aluna', withSummary({ mode: 'surpresa', status: 'concluido', myScoreDone: true, official: 24 }, { scenario: scenarioOf() }), [
    sheet('aluna', 3, { mine: true, good: 'Abertura clara', improve: 'Calar depois de fechar' }),
    sheet('mentor', 5, { good: 'Boa escuta' }),
  ])
  const region = screen.getByRole('heading', { name: 'Nota oficial' }).closest('section')!
  expect(within(region).getByText('24.0')).toBeInTheDocument()
  const row = within(region).getByRole('row', { name: /Abertura/ })
  expect(within(row).getAllByRole('cell').map((c) => c.textContent)).toEqual(['3', '5', '4.0'])
  expect(within(region).getByText('Abertura clara')).toBeInTheDocument()
  expect(within(region).getByText('Boa escuta')).toBeInTheDocument()
})

test('simulado inexistente mostra erro', () => {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role: 'aluna', name: 'X' } } as never)
  vi.mocked(sim.useSimulation).mockReturnValue({ ...queryOf(undefined), isLoading: false } as never)
  vi.mocked(sim.useScores).mockReturnValue(queryOf([]))
  vi.mocked(sim.useAdvanceSimulation).mockReturnValue(asyncMutationOf())
  render(<MemoryRouter><SimulationDetail /></MemoryRouter>)
  expect(screen.getByRole('alert')).toHaveTextContent('Simulado não encontrado')
})
