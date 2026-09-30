import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { asyncMutationOf, entryOf, queryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')

import { useAuth } from '@/features/auth/AuthProvider'
import * as api from './hooks'
import { JournalScreen } from './JournalScreen'

function setup(role: 'aluna' | 'mentor', path = '/caderno', entries = [entryOf({ date: '2026-09-28' })]) {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(api.useJournalEntries).mockReturnValue(queryOf(entries))
  vi.mocked(api.useSaveJournalEntry).mockReturnValue(asyncMutationOf())
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/caderno" element={<JournalScreen />} />
        <Route path="/caderno/dia/:date" element={<JournalScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-29T15:00:00Z')) // terça, 12:00 em SP
})
afterEach(() => vi.useRealTimers())

test('aluna abre o dia de hoje e vê os últimos 14 dias com a situação de cada um', () => {
  setup('aluna')
  expect(screen.getByRole('heading', { name: /terça-feira, 29 de setembro/i })).toBeInTheDocument()
  const days = within(screen.getByRole('list')).getAllByRole('listitem')
  expect(days).toHaveLength(14)
  expect(days[0]).toHaveTextContent('29/09')
  expect(days[0]).toHaveTextContent('Pendente')
  expect(days[1]).toHaveTextContent('28/09')
  expect(days[1]).toHaveTextContent('Completo')
  expect(days[2]).toHaveTextContent('Em falta')
})

test('link de um dia anterior abre aquele dia', () => {
  setup('aluna', '/caderno/dia/2026-09-28')
  expect(screen.getByRole('heading', { name: /segunda-feira, 28 de setembro/i })).toBeInTheDocument()
  expect(screen.getByDisplayValue('aprendi a ouvir o cliente')).toBeInTheDocument()
})

test('data inválida ou futura volta para hoje', () => {
  setup('aluna', '/caderno/dia/2026-10-05')
  expect(screen.getByRole('heading', { name: /29 de setembro/i })).toBeInTheDocument()
})

test('mentor vê o caderno da aluna, com os horários do banco e os dias em falta (RF-50/52)', () => {
  setup('mentor')
  expect(screen.queryByLabelText('Uma coisa que aprendi')).not.toBeInTheDocument()
  const cards = screen.getAllByRole('listitem')
  expect(cards).toHaveLength(30)
  const day28 = cards[1]
  expect(day28).toHaveTextContent('aprendi a ouvir o cliente')
  expect(day28).toHaveTextContent('Criado 29/09, 19:10')
  expect(day28).toHaveTextContent('atualizado 29/09, 20:02')
  expect(cards[2]).toHaveTextContent('Em falta')
})
