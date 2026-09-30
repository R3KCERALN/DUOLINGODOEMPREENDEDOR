import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { NODES } from '@/content/trail'
import { mutationOf, nodeStatesOf, progressOf, queryOf } from '@/test/progressMocks'

vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('@/features/progress/hooks', () => ({
  useNodeStates: vi.fn(), useProgress: vi.fn(), useJournalDays: vi.fn(), useToggleItem: vi.fn(),
}))

import { useAuth } from '@/features/auth/AuthProvider'
import { useJournalDays, useNodeStates, useProgress, useToggleItem } from '@/features/progress/hooks'
import { TodayScreen } from './TodayScreen'

const toggle = vi.fn()

function setup({ done = [] as string[], journal = [] as string[], since = '2026-09-01T12:00:00Z' } = {}) {
  vi.mocked(useAuth).mockReturnValue({ session: { user: { created_at: since, email_confirmed_at: since } } } as never)
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf(done))
  vi.mocked(useProgress).mockReturnValue(progressOf(done))
  vi.mocked(useJournalDays).mockReturnValue(queryOf<ReadonlySet<string>>(new Set(journal)))
  vi.mocked(useToggleItem).mockReturnValue(mutationOf(toggle))
  return render(<MemoryRouter><TodayScreen /></MemoryRouter>)
}
const routine = () => within(screen.getByRole('list')).getAllByRole('listitem')

beforeEach(() => {
  toggle.mockReset()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-29T15:00:00Z')) // terça, 12:00 em SP
})
afterEach(() => vi.useRealTimers())

test('rotina de terça com caderno fixado no topo (RF-30)', () => {
  setup()
  expect(screen.getByRole('heading', { level: 1, name: 'Hoje' })).toBeInTheDocument()
  expect(routine()).toHaveLength(7)
  expect(routine()[0]).toHaveTextContent('Caderno: 3 linhas (3 min)')
  expect(routine()[0]).toHaveTextContent('Obrigatório')
  expect(screen.getByRole('checkbox', { name: 'Leitura em voz alta (5 min)' })).toBeInTheDocument()
  expect(screen.queryByRole('checkbox', { name: /Simulado chefe/ })).not.toBeInTheDocument()
})

test('caderno preenchido vai para o fim e o streak aparece (RF-32)', () => {
  setup({ journal: ['2026-09-27', '2026-09-28', '2026-09-29'] })
  expect(routine().at(-1)).toHaveTextContent('Feito')
  expect(screen.getByText('3 dias seguidos')).toBeInTheDocument()
})

test('sem caderno recente o streak convida a começar', () => {
  setup()
  expect(screen.getByText('Sequência começa hoje')).toBeInTheDocument()
})

test('marcar item da rotina grava com o id do dia', async () => {
  setup()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Aquecimento de voz + pitch de 30 s (5 min)' }))
  expect(toggle).toHaveBeenCalledWith({ itemId: 'day.2026-09-29.voz', done: true })
})

test('23:30 em SP ainda é o mesmo dia, mesmo com o relógio em UTC', async () => {
  vi.setSystemTime(new Date('2026-09-30T02:30:00Z'))
  setup()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Aquecimento de voz + pitch de 30 s (5 min)' }))
  expect(toggle).toHaveBeenCalledWith({ itemId: 'day.2026-09-29.voz', done: true })
})

test('item já marcado hoje aparece marcado', () => {
  setup({ done: ['day.2026-09-29.leitura', 'day.2026-09-28.voz'] })
  expect(screen.getByRole('checkbox', { name: 'Leitura ou audiolivro (20 min)' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Aquecimento de voz + pitch de 30 s (5 min)' })).not.toBeChecked()
})

test('sábado tem simulado chefe e domingo tem revisão (RF-31)', () => {
  vi.setSystemTime(new Date('2026-10-03T15:00:00Z'))
  const { unmount } = setup()
  expect(screen.getByRole('checkbox', { name: 'Simulado chefe (10 min)' })).toBeInTheDocument()
  unmount()
  vi.setSystemTime(new Date('2026-10-04T15:00:00Z'))
  setup()
  expect(screen.getByRole('checkbox', { name: 'Revisão da semana (30 min)' })).toBeInTheDocument()
})

test('mostra o próximo item pendente da trilha (RF-32)', () => {
  setup()
  expect(screen.getByText(NODES[0].items[0].title)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Abrir Semana 1' })).toHaveAttribute('href', '/trilha/w01')
})

test('na Fase 2 o desafio vira abordagem real com a regra 70/30', () => {
  const f1 = NODES.filter((n) => n.phase === 'f1').flatMap((n) => n.items.map((i) => i.id))
  setup({ done: [...f1, 'f1.gate.2', 'f1.gate.3', 'f1.gate.4', 'f1.gate.5'] })
  expect(screen.getByRole('checkbox', { name: '1 abordagem real (10 min)' })).toBeInTheDocument()
  expect(screen.getAllByText(/Regra 70\/30/)).toHaveLength(2)
})

test('caderno de ontem em falta gera aviso com link para o dia (RF-50)', () => {
  setup({ journal: ['2026-09-27'] })
  expect(screen.getByRole('status')).toHaveTextContent('O caderno de ontem ficou em falta.')
  expect(screen.getByRole('link', { name: 'Ver o dia' })).toHaveAttribute('href', '/caderno/dia/2026-09-28')
})

test('antes do meio-dia o aviso convida a preencher ontem', () => {
  vi.setSystemTime(new Date('2026-09-29T14:59:00Z')) // 11:59 em SP
  setup({ journal: ['2026-09-27'] })
  expect(screen.getByRole('status')).toHaveTextContent('ainda pode ser preenchido até 12:00')
  expect(screen.getByRole('link', { name: 'Preencher agora' })).toBeInTheDocument()
})

test('caderno de ontem completo: sem aviso', () => {
  setup({ journal: ['2026-09-28'] })
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('primeiro dia de uso: ontem ainda não tinha caderno esperado, sem aviso', () => {
  setup({ since: '2026-09-29T11:00:00Z' }) // conta confirmada hoje, 08:00 em SP
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('conta confirmada ontem à noite em SP (já dia 29 em UTC): ontem conta como dia de caderno', () => {
  setup({ since: '2026-09-29T01:30:00Z' }) // 28/09, 22:30 em SP
  expect(screen.getByRole('status')).toHaveTextContent('O caderno de ontem ficou em falta.')
})
