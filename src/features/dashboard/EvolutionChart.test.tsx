import { render, screen } from '@testing-library/react'
import { cloneElement, type ReactElement } from 'react'
import userEvent from '@testing-library/user-event'
import { EvolutionChart } from './EvolutionChart'

// O jsdom não mede elementos (ResponsiveContainer fica com 0 px): o gráfico recebe um tamanho fixo e é desenhado de verdade.
vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: ReactElement<{ width?: number; height?: number }> }) => (
    <div className="recharts-responsive-container">{cloneElement(children, { width: 320, height: 240 })}</div>
  ),
}))

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

test('rótulos das metas ficam fora da área dos dados, à direita, sem cobrir pontos', () => {
  const { container } = render(<EvolutionChart points={[
    { weekStart: '2026-09-14', avg: 22, count: 1 }, { weekStart: '2026-09-21', avg: 15, count: 2 },
  ]} />)
  const grid = container.querySelector('.recharts-cartesian-grid-horizontal line')!
  const plotRight = Math.max(Number(grid.getAttribute('x1')), Number(grid.getAttribute('x2')))
  for (const goal of ['Meta 15', 'Meta 22']) {
    const label = [...container.querySelectorAll('text')].find((t) => t.textContent === goal)
    expect(label, goal).toBeDefined()
    expect(Number(label!.getAttribute('x')), goal).toBeGreaterThan(plotRight)
    expect(label!.getAttribute('text-anchor'), goal).toBe('start')
  }
})
