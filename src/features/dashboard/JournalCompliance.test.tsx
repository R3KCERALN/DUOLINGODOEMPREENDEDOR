import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { entryOf } from '@/test/e6Mocks'
import { JournalCompliance } from './JournalCompliance'

const renderIt = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

test('taxa, entradas com atraso (com o horário real) e dias em falta, cada um com link para o caderno (RF-97a)', () => {
  renderIt(<JournalCompliance
    overview={{ since: '2026-09-25', rate: 0.4, lateCount: 1, missing: ['2026-09-27', '2026-09-28', '2026-09-29'] }}
    lateEntries={[entryOf({ date: '2026-09-26', late: true, createdAt: '2026-09-27T12:30:00Z', updatedAt: '2026-09-27T12:45:00Z' })]}
  />)
  expect(screen.getByRole('heading', { level: 2, name: 'Caderno em dia' })).toBeInTheDocument()
  expect(screen.getByText('40% dos dias fechados desde 25/09 têm caderno completo.')).toBeVisible()
  expect(screen.getByRole('progressbar', { name: 'Caderno em dia' })).toHaveAttribute('aria-valuenow', '40')

  const late = screen.getByRole('link', { name: /26\/09/ })
  expect(late).toHaveAttribute('href', '/caderno/dia/2026-09-26')
  expect(late.closest('li')).toHaveTextContent(/escrita em 27\/09.*09:30.*última edição 27\/09.*09:45/) // horários de SP (12:30Z e 12:45Z)

  const missing = screen.getByRole('list', { name: 'Dias em falta' })
  expect(within(missing).getAllByRole('link').map((a) => a.textContent)).toEqual(['29/09', '28/09', '27/09']) // mais recente primeiro
  expect(within(missing).getByRole('link', { name: '29/09' })).toHaveAttribute('href', '/caderno/dia/2026-09-29')
  expect(screen.getByRole('link', { name: 'Abrir o caderno' })).toHaveAttribute('href', '/caderno')
})

test('só os 10 dias em falta mais recentes aparecem, com o resto resumido', () => {
  const missing = Array.from({ length: 13 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`)
  renderIt(<JournalCompliance overview={{ since: '2026-09-01', rate: 0.2, lateCount: 0, missing }} lateEntries={[]} />)
  expect(within(screen.getByRole('list', { name: 'Dias em falta' })).getAllByRole('link')).toHaveLength(10)
  expect(screen.getByText('e mais 3 dias')).toBeVisible()
})

test('nada em falta e nada com atraso', () => {
  renderIt(<JournalCompliance overview={{ since: '2026-09-25', rate: 1, lateCount: 0, missing: [] }} lateEntries={[]} />)
  expect(screen.getByText('Nenhum dia em falta.')).toBeVisible()
  expect(screen.getByText('Nenhuma entrada preenchida com atraso.')).toBeVisible()
})

test('sem dias fechados: sem barra e sem porcentagem (Review Focus 4)', () => {
  renderIt(<JournalCompliance overview={{ since: null, rate: null, lateCount: 0, missing: [] }} lateEntries={[]} />)
  expect(screen.getByText('Ainda não há dias fechados para contar.')).toBeVisible()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
})
