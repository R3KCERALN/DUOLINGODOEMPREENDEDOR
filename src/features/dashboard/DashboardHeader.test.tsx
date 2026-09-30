import { render, screen } from '@testing-library/react'
import { DashboardHeader } from './DashboardHeader'

const facts = { phaseLabel: 'Fase 2 · Vendas', weekLabel: 'Semana 5', percent: 37, streak: 4, days7: 5, days30: 18 }

test('mostra fase, semana, % da trilha, streak e dias estudados (RF-90)', () => {
  render(<DashboardHeader facts={facts} />)
  const group = screen.getByRole('region', { name: 'Resumo' })
  expect(group).toBeInTheDocument()
  expect(screen.getByText('Fase atual').nextElementSibling).toHaveTextContent('Fase 2 · Vendas')
  expect(screen.getByText('Semana atual').nextElementSibling).toHaveTextContent('Semana 5')
  expect(screen.getByText('Trilha concluída').nextElementSibling).toHaveTextContent('37%')
  expect(screen.getByText('Streak').nextElementSibling).toHaveTextContent('4 dias')
  expect(screen.getByText('Últimos 7 dias').nextElementSibling).toHaveTextContent('5 de 7 dias estudados')
  expect(screen.getByText('Últimos 30 dias').nextElementSibling).toHaveTextContent('18 de 30 dias estudados')
})

test('streak no singular e zerado', () => {
  const { rerender } = render(<DashboardHeader facts={{ ...facts, streak: 1 }} />)
  expect(screen.getByText('Streak').nextElementSibling).toHaveTextContent('1 dia')
  rerender(<DashboardHeader facts={{ ...facts, streak: 0, days7: 0, days30: 0, percent: 0 }} />)
  expect(screen.getByText('Streak').nextElementSibling).toHaveTextContent('0 dias')
  expect(screen.getByText('Últimos 7 dias').nextElementSibling).toHaveTextContent('0 de 7 dias estudados')
})
