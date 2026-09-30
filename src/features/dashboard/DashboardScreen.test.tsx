import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useAuth } from '@/features/auth/AuthProvider'
import { useJournalEntries } from '@/features/journal/hooks'
import { useBooks } from '@/features/library/hooks'
import { useJournalDays, useNodeStates, useProgress } from '@/features/progress/hooks'
import { useSimulations } from '@/features/simulations/hooks'
import { activityOf, queryOf, scoreRowOf, usageOf } from '@/test/dashboardMocks'
import { bookOf, entryOf } from '@/test/e6Mocks'
import { nodeStatesOf, progressOf } from '@/test/progressMocks'
import { summaryOf } from '@/test/simulationMocks'
import { DashboardScreen } from './DashboardScreen'
import { useActivityDays, useScoreSeries, useStorageUsage } from './hooks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('@/features/progress/hooks')
vi.mock('@/features/journal/hooks')
vi.mock('@/features/library/hooks')
vi.mock('@/features/simulations/hooks')
vi.mock('./hooks')

const COMMON = ['Evolução das notas', 'Autoavaliação × mentor', 'Radar por critério', 'Atividade', 'Checklists por fase']
const MENTOR_ONLY = ['Caderno em dia', 'Treinos', 'Leitura', 'Últimos simulados', 'Uso do armazenamento']

beforeAll(() => { vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }) })
afterAll(() => { vi.unstubAllGlobals() })
beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-30T15:00:00Z'))
})
afterEach(() => { vi.useRealTimers() })

function setup(role: 'mentor' | 'aluna') {
  vi.mocked(useAuth).mockReturnValue({ session: null, profile: { id: 'u', role, name: 'Fulana' }, loading: false, signOut: vi.fn() })
  vi.mocked(useScoreSeries).mockReturnValue(queryOf([
    scoreRowOf({ simulationId: 'a', day: '2026-09-29', weekStart: '2026-09-28', studentTotal: 24, mentorTotal: 20, official: 22 }),
    scoreRowOf({ simulationId: 'b', day: '2026-09-20', weekStart: '2026-09-14', studentTotal: 16, mentorTotal: 14, official: 15 }),
  ]))
  vi.mocked(useActivityDays).mockReturnValue(queryOf([activityOf({ day: '2026-09-29' }), activityOf({ day: '2026-09-30', journal: false })]))
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf(['w01.video.1']))
  vi.mocked(useProgress).mockReturnValue(progressOf(['w01.video.1']))
  vi.mocked(useJournalDays).mockReturnValue(queryOf<ReadonlySet<string>>(new Set(['2026-09-29'])))
  vi.mocked(useJournalEntries).mockReturnValue(queryOf([entryOf({ date: '2026-09-29' })]))
  vi.mocked(useSimulations).mockReturnValue(queryOf([summaryOf({ mode: 'treino', status: 'aguardando_notas', myScoreDone: false })]))
  vi.mocked(useBooks).mockReturnValue(queryOf([bookOf()]))
  vi.mocked(useStorageUsage).mockReturnValue(queryOf([usageOf()]))
  return render(<MemoryRouter><DashboardScreen /></MemoryRouter>)
}

const h2 = (name: string) => screen.queryByRole('heading', { level: 2, name })

test('mentor vê tudo: resumo, gráficos e as seções só dele (RF-90 a RF-97b)', () => {
  setup('mentor')
  expect(screen.getByRole('heading', { level: 1, name: 'Painel da aluna' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Resumo' })).toBeInTheDocument()
  for (const name of [...COMMON, ...MENTOR_ONLY]) expect(h2(name), name).toBeInTheDocument()
  expect(screen.getByText('Ela se avalia, em média, 3,0 pontos acima da nota do mentor.')).toBeVisible()
  expect(screen.getByText('1 treino aguardando a sua avaliação.')).toBeVisible()
  expect(screen.getByText(/de 1,0 GB/)).toBeVisible()
})

test('aluna vê a versão dela e nada do mentor, nem sequer chama os hooks dele (Review Focus 2)', () => {
  setup('aluna')
  expect(screen.getByRole('heading', { level: 1, name: 'Seu painel' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Resumo' })).toBeInTheDocument()
  for (const name of COMMON) expect(h2(name), name).toBeInTheDocument()
  for (const name of MENTOR_ONLY) expect(h2(name), name).not.toBeInTheDocument()
  expect(screen.getByText('Você se avalia, em média, 3,0 pontos acima da nota do mentor.')).toBeVisible()
  expect(useStorageUsage).not.toHaveBeenCalled()
  expect(useSimulations).not.toHaveBeenCalled()
  expect(useBooks).not.toHaveBeenCalled()
  expect(useJournalEntries).not.toHaveBeenCalled()
})

test('carregando e erro dos dados comuns', () => {
  setup('aluna').unmount()
  vi.mocked(useScoreSeries).mockReturnValue({ ...queryOf(undefined), isLoading: true } as never)
  const { unmount } = render(<MemoryRouter><DashboardScreen /></MemoryRouter>)
  expect(screen.getByRole('status')).toHaveTextContent('Carregando o painel…')
  unmount()
  vi.mocked(useScoreSeries).mockReturnValue(queryOf(undefined) as never)
  render(<MemoryRouter><DashboardScreen /></MemoryRouter>)
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o painel.')
})

test('um bloco do mentor que falha não esconde os outros', () => {
  setup('mentor').unmount()
  vi.mocked(useStorageUsage).mockReturnValue(queryOf(undefined) as never)
  render(<MemoryRouter><DashboardScreen /></MemoryRouter>)
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o uso do armazenamento.')
  expect(h2('Caderno em dia')).toBeInTheDocument()
  expect(h2('Últimos simulados')).toBeInTheDocument()
})

test('painel vazio não mostra NaN nem gráfico quebrado (Review Focus 4)', () => {
  setup('mentor').unmount()
  vi.mocked(useScoreSeries).mockReturnValue(queryOf([]))
  vi.mocked(useActivityDays).mockReturnValue(queryOf([]))
  vi.mocked(useJournalDays).mockReturnValue(queryOf<ReadonlySet<string>>(new Set()))
  vi.mocked(useJournalEntries).mockReturnValue(queryOf([]))
  vi.mocked(useSimulations).mockReturnValue(queryOf([]))
  vi.mocked(useBooks).mockReturnValue(queryOf([]))
  vi.mocked(useStorageUsage).mockReturnValue(queryOf([]))
  const { container } = render(<MemoryRouter><DashboardScreen /></MemoryRouter>)
  expect(screen.getAllByText('Ainda não há simulados com as duas fichas.')).toHaveLength(2)
  expect(screen.getByText('Sem simulados com as duas fichas nas últimas 4 semanas.')).toBeVisible()
  expect(screen.getByText('Nenhuma atividade no período.')).toBeVisible()
  expect(screen.getByText('Ainda não há dias fechados para contar.')).toBeVisible()
  expect(screen.getByText('Nenhum treino aguardando a sua avaliação.')).toBeVisible()
  expect(screen.getByText('Nenhum simulado ainda.')).toBeVisible()
  expect(screen.getByText('0 B de 1,0 GB (0%)')).toBeVisible()
  expect(container).not.toHaveTextContent('NaN')
})
