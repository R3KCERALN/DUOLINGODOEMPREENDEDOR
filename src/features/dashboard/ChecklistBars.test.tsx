import { render, screen, within } from '@testing-library/react'
import { phaseProgress } from '@/domain/dashboard'
import { ChecklistBars } from './ChecklistBars'

test('uma barra por fase com "x de y" e o percentual geral da trilha (RF-95)', () => {
  const progress = phaseProgress(new Set(), new Set())
  render(<ChecklistBars progress={progress} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Checklists por fase' })).toBeInTheDocument()
  expect(screen.getByText(/0% da trilha concluída/)).toBeVisible()
  expect(screen.getAllByRole('progressbar')).toHaveLength(4)
  expect(screen.getByRole('progressbar', { name: 'Progresso da Fase 2' })).toHaveAttribute('aria-valuenow', '0')
  expect(screen.getByText('Fase 2 · Vendas')).toBeVisible()
  const fase2 = screen.getByText('Fase 2 · Vendas').closest('li')!
  expect(within(fase2).getByText(`0 de ${progress[1].total}`)).toBeVisible()
})

test('progresso parcial aparece na barra e no texto', () => {
  const progress = [
    { phase: 'f1' as const, title: 'Comunicação', done: 6, total: 12, ratio: 0.5 },
    { phase: 'f2' as const, title: 'Vendas', done: 0, total: 12, ratio: 0 },
  ]
  render(<ChecklistBars progress={progress} />)
  expect(screen.getByText(/25% da trilha concluída/)).toBeVisible()
  expect(screen.getByRole('progressbar', { name: 'Progresso da Fase 1' })).toHaveAttribute('aria-valuenow', '50')
  expect(screen.getByText('6 de 12')).toBeVisible()
})

test('lista vazia não quebra', () => {
  render(<ChecklistBars progress={[]} />)
  expect(screen.getByText(/0% da trilha concluída/)).toBeVisible()
  expect(screen.queryAllByRole('progressbar')).toHaveLength(0)
})
