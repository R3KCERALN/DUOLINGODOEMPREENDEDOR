import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { radarByCriterion } from '@/domain/dashboard'
import { scoreRowOf } from '@/test/dashboardMocks'
import { CriteriaRadar } from './CriteriaRadar'

beforeAll(() => { vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }) })
afterAll(() => { vi.unstubAllGlobals() })

const rows = [
  scoreRowOf({ simulationId: 'r', day: '2026-09-30', byCriterion: { abertura: 4, tom: 3, perguntas: 3, escuta: 3, objecao: 3, fechamento: 3 } }),
  scoreRowOf({ simulationId: 'p', day: '2026-09-02' }),
]

test('sem simulados nas últimas 4 semanas: texto de vazio e nenhum gráfico (Review Focus 4)', () => {
  const { container } = render(<CriteriaRadar points={radarByCriterion([], '2026-09-30')} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Radar por critério' })).toBeInTheDocument()
  expect(screen.getByText('Sem simulados com as duas fichas nas últimas 4 semanas.')).toBeVisible()
  expect(container.querySelector('.recharts-responsive-container')).toBeNull()
})

test('com dados: resumo dos seis critérios, gráfico e tabela com as duas colunas', async () => {
  const { container } = render(<CriteriaRadar points={radarByCriterion(rows, '2026-09-30')} />)
  expect(screen.getByText(/Últimas 4 semanas: Abertura 4,0 \(antes 3,0\); Tom e energia 3,0 \(antes 3,0\)/)).toBeVisible()
  expect(container.querySelector('.recharts-responsive-container')).not.toBeNull()
  await userEvent.click(screen.getByText('Ver os dados em tabela'))
  expect(screen.getByRole('columnheader', { name: 'Últimas 4 semanas' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Período anterior' })).toBeInTheDocument()
  expect(screen.getByRole('row', { name: /Abertura.*4,0.*3,0/ })).toBeInTheDocument()
})

test('sem período anterior a tabela mostra travessão, não zero', async () => {
  render(<CriteriaRadar points={radarByCriterion([scoreRowOf({ day: '2026-09-30' })], '2026-09-30')} />)
  await userEvent.click(screen.getByText('Ver os dados em tabela'))
  expect(screen.getByRole('row', { name: /Abertura.*3,0.*—/ })).toBeInTheDocument()
})
