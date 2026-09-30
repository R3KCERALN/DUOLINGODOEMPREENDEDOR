import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { TrainingsPanel } from './TrainingsPanel'

const weeks = [{ weekStart: '2026-09-21', count: 2 }, { weekStart: '2026-09-28', count: 1 }, { weekStart: '2026-10-05', count: 0 }]
const renderIt = (pending: number) => render(<MemoryRouter><TrainingsPanel weeks={weeks} pending={pending} /></MemoryRouter>)

test('treinos por semana e os que aguardam a avaliação do mentor (RF-97b)', () => {
  renderIt(3)
  expect(screen.getByRole('heading', { level: 2, name: 'Treinos' })).toBeInTheDocument()
  expect(screen.getByText('3 treinos aguardando a sua avaliação.')).toBeVisible()
  expect(screen.getByRole('link', { name: 'Avaliar treinos' })).toHaveAttribute('href', '/simulados')
  expect(screen.getByText('Semana de 21/09: 2 treinos')).toBeVisible()
  expect(screen.getByText('Semana de 28/09: 1 treino')).toBeVisible()
  expect(screen.getByText('Semana de 05/10: 0 treinos')).toBeVisible()
})

test('um treino aguardando e nenhum aguardando', () => {
  const { unmount } = renderIt(1)
  expect(screen.getByText('1 treino aguardando a sua avaliação.')).toBeVisible()
  unmount()
  renderIt(0)
  expect(screen.getByText('Nenhum treino aguardando a sua avaliação.')).toBeVisible()
  expect(screen.queryByRole('link', { name: 'Avaliar treinos' })).not.toBeInTheDocument()
})
