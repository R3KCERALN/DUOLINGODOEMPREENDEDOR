import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { heatmapWeeks } from '@/domain/dashboard'
import { ActivityHeatmap } from './ActivityHeatmap'

const weeks = heatmapWeeks([
  { day: '2026-09-29', items: 2, simulations: 0, journal: true },
  { day: '2026-09-30', items: 1, simulations: 1, journal: false },
], '2026-09-30', 2)

test('título, resumo em texto e legenda com os três tipos de dia', () => {
  render(<ActivityHeatmap weeks={weeks} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Atividade' })).toBeInTheDocument()
  expect(screen.getByText('2 dias com atividade: 1 com caderno e 1 sem caderno.')).toBeVisible()
  const legend = screen.getByRole('list', { name: 'Legenda' })
  expect(within(legend).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Com caderno', 'Sem caderno', 'Sem atividade'])
})

test('uma célula por dia, com o tipo no data-kind', () => {
  const { container } = render(<ActivityHeatmap weeks={weeks} />)
  const kinds = [...container.querySelectorAll('[data-kind]')].map((c) => c.getAttribute('data-kind'))
  expect(kinds).toHaveLength(14)
  const count = (k: string) => kinds.filter((x) => x === k).length
  expect(count('journal')).toBe(1)
  expect(count('no_journal')).toBe(1)
  expect(count('future')).toBe(4) // 01/10 a 04/10
  expect(count('none')).toBe(8)
})

test('dia sem caderno tem contorno vazado, não só outra cor (Review Focus 5)', () => {
  const { container } = render(<ActivityHeatmap weeks={weeks} />)
  const withJournal = container.querySelector('[data-kind="journal"]')!
  const without = container.querySelector('[data-kind="no_journal"]')!
  expect(withJournal.className).toContain('bg-brand')
  expect(without.className).toContain('border-streak')
  expect(without.className).not.toContain('bg-streak')
  expect(without.className).not.toContain('bg-brand')
})

test('a grade fica escondida dos leitores de tela e a lista traz os mesmos dias, do mais novo ao mais antigo', async () => {
  const { container } = render(<ActivityHeatmap weeks={weeks} />)
  expect(container.querySelector('[data-kind]')!.closest('[aria-hidden="true"]')).not.toBeNull()
  await userEvent.click(screen.getByText('Ver os dias em lista'))
  const items = screen.getAllByRole('listitem').filter((li) => /\d{2}\/\d{2} ·/.test(li.textContent ?? ''))
  expect(items.map((li) => li.textContent)).toEqual([
    '30/09 · sem caderno · 1 item, 1 simulado',
    '29/09 · com caderno · 2 itens',
  ])
})

test('sem atividade: só a mensagem, sem lista (Review Focus 4)', () => {
  render(<ActivityHeatmap weeks={heatmapWeeks([], '2026-09-30', 2)} />)
  expect(screen.getByText('Nenhuma atividade no período.')).toBeVisible()
  expect(screen.queryByText('Ver os dias em lista')).not.toBeInTheDocument()
})
