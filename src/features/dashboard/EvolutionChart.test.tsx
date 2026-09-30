import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EvolutionChart } from './EvolutionChart'

beforeAll(() => { vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }) })
afterAll(() => { vi.unstubAllGlobals() })

test('sem simulados: só o texto de vazio (Review Focus 4)', () => {
  const { container } = render(<EvolutionChart points={[]} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Evolução das notas' })).toBeInTheDocument()
  expect(screen.getByText('Ainda não há simulados com as duas fichas.')).toBeVisible()
  expect(container.querySelector('.recharts-responsive-container')).toBeNull()
  expect(screen.queryByText('Ver os dados em tabela')).not.toBeInTheDocument()
})

test('uma semana só: resumo com as metas, contêiner do gráfico e tabela (Review Focus 5)', async () => {
  const { container } = render(<EvolutionChart points={[{ weekStart: '2026-09-21', avg: 17, count: 2 }]} />)
  expect(screen.getByText('Semana de 21/09: média oficial 17,0 em 2 simulados. Meta 15: atingida. Meta 22: faltam 5,0.')).toBeVisible()
  expect(container.querySelector('.recharts-responsive-container')).not.toBeNull()
  await userEvent.click(screen.getByText('Ver os dados em tabela'))
  expect(screen.getByRole('row', { name: /Semana de 21\/09.*17,0.*2/ })).toBeInTheDocument()
})

test('várias semanas: uma linha de tabela por semana, da mais antiga à mais nova', async () => {
  render(<EvolutionChart points={[
    { weekStart: '2026-09-14', avg: 12, count: 1 }, { weekStart: '2026-09-21', avg: 16.5, count: 3 },
  ]} />)
  await userEvent.click(screen.getByText('Ver os dados em tabela'))
  const rows = screen.getAllByRole('row').slice(1)
  expect(rows).toHaveLength(2)
  expect(rows[0]).toHaveTextContent('Semana de 14/09')
  expect(rows[1]).toHaveTextContent('16,5')
})
