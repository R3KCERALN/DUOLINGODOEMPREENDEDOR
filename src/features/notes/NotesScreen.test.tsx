import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { noteOf, queryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import * as api from './hooks'
import { NotesScreen } from './NotesScreen'

function setup(notes = [noteOf()]) {
  vi.mocked(api.useNotes).mockReturnValue(queryOf(notes))
  return render(<MemoryRouter><NotesScreen /></MemoryRouter>)
}

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ shouldAdvanceTime: true }) })
afterEach(() => vi.useRealTimers())

test('lista notas com selo de privacidade, vínculo e resumo sem marcação', () => {
  setup([noteOf({ link: { type: 'week', id: 'w05' } }), noteOf({ id: 'n2', title: '', body: '', private: false })])
  expect(screen.getByText('Privada')).toBeInTheDocument()
  expect(screen.getByText('Compartilhada')).toBeInTheDocument()
  expect(screen.getByText('Semana 5')).toBeInTheDocument()
  expect(screen.getByText('Começar pelo porquê.')).toBeInTheDocument()
  expect(screen.getByText('Sem título')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Ideias de abertura/ })).toHaveAttribute('href', '/caderno/notas/n1')
})

test('nota da aluna vista pelo mentor vem marcada como compartilhada por ela (RF-52)', () => {
  setup([noteOf({ mine: false, private: false })])
  expect(screen.getByText('Compartilhada pela aluna')).toBeInTheDocument()
})

test('a busca só consulta depois de 300 ms parada (RF-53)', async () => {
  setup()
  expect(api.useNotes).toHaveBeenLastCalledWith('')
  fireEvent.change(screen.getByLabelText('Buscar nas notas'), { target: { value: 'vendas' } })
  expect(api.useNotes).toHaveBeenLastCalledWith('')
  await act(async () => { await vi.advanceTimersByTimeAsync(350) })
  expect(api.useNotes).toHaveBeenLastCalledWith('vendas')
})

test('mensagens de lista vazia e de busca sem resultado; atalho para nova nota', async () => {
  setup([])
  expect(screen.getByText('Nenhuma nota ainda.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Nova nota' })).toHaveAttribute('href', '/caderno/notas/nova')
  fireEvent.change(screen.getByLabelText('Buscar nas notas'), { target: { value: 'xyz' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(350) })
  expect(screen.getByText('Nenhuma nota encontrada.')).toBeInTheDocument()
})
