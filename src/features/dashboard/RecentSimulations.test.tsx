import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { summaryOf } from '@/test/simulationMocks'
import { RecentSimulations } from './RecentSimulations'

const renderIt = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

test('mostra os 5 mais recentes, o mais novo primeiro, com nota oficial ou situação (RF-96)', () => {
  const sims = Array.from({ length: 7 }, (_, i) => summaryOf({
    id: `s${i}`, createdAt: `2026-09-${String(20 + i).padStart(2, '0')}T15:00:00Z`,
    mode: i === 6 ? 'treino' : 'surpresa', status: i === 6 ? 'aguardando_notas' : 'concluido',
    difficulty: 'dificil', official: i === 6 ? null : 18.5, myScoreDone: true,
  }))
  renderIt(<RecentSimulations sims={sims} />)
  const links = screen.getAllByRole('link', { name: /Difícil/ })
  expect(links).toHaveLength(5)
  expect(links[0]).toHaveAttribute('href', '/simulados/s6')
  expect(links[0]).toHaveTextContent('26/09')
  expect(links[0]).toHaveTextContent('Treino')
  expect(links[1]).toHaveTextContent('nota 18,5')
  expect(links[1]).toHaveTextContent('Surpresa')
  expect(screen.getByRole('link', { name: 'Ver todos os simulados' })).toHaveAttribute('href', '/simulados')
})

test('sem simulados', () => {
  renderIt(<RecentSimulations sims={[]} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Últimos simulados' })).toBeInTheDocument()
  expect(screen.getByText('Nenhum simulado ainda.')).toBeVisible()
})
