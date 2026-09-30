import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PerceptionChart } from './PerceptionChart'

beforeAll(() => { vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }) })
afterAll(() => { vi.unstubAllGlobals() })

const pts = [
  { simulationId: 'a', day: '2026-09-20', student: 16, mentor: 20, gap: -4 },
  { simulationId: 'b', day: '2026-09-29', student: 24, mentor: 20, gap: 4 },
]

test('vazio', () => {
  const { container } = render(<PerceptionChart points={[]} viewer="mentor" />)
  expect(screen.getByRole('heading', { level: 2, name: 'Autoavaliação × mentor' })).toBeInTheDocument()
  expect(screen.getByText('Ainda não há simulados com as duas fichas.')).toBeVisible()
  expect(container.querySelector('.recharts-responsive-container')).toBeNull()
})

test('o texto muda com quem olha: mentor fala "ela", aluna fala "você"', () => {
  const { rerender } = render(<PerceptionChart points={pts.slice(1)} viewer="mentor" />)
  expect(screen.getByText('Ela se avalia, em média, 4,0 pontos acima da nota do mentor.')).toBeVisible()
  rerender(<PerceptionChart points={pts.slice(1)} viewer="aluna" />)
  expect(screen.getByText('Você se avalia, em média, 4,0 pontos acima da nota do mentor.')).toBeVisible()
})

test('tabela com as duas notas e a diferença de cada simulado', async () => {
  const { container } = render(<PerceptionChart points={pts} viewer="mentor" />)
  expect(container.querySelector('.recharts-responsive-container')).not.toBeNull()
  await userEvent.click(screen.getByText('Ver os dados em tabela'))
  expect(screen.getByRole('columnheader', { name: 'Autoavaliação dela' })).toBeInTheDocument()
  expect(screen.getByRole('row', { name: /20\/09.*16.*20.*-4/ })).toBeInTheDocument()
  expect(screen.getByRole('row', { name: /29\/09.*24.*20.*\+4/ })).toBeInTheDocument()
})

test('para a aluna a coluna se chama "Sua autoavaliação"', async () => {
  render(<PerceptionChart points={pts} viewer="aluna" />)
  await userEvent.click(screen.getByText('Ver os dados em tabela'))
  expect(screen.getByRole('columnheader', { name: 'Sua autoavaliação' })).toBeInTheDocument()
})
