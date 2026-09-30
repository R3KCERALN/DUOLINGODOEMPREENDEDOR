import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { asyncMutationOf, noteOf, queryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')

import { useAuth } from '@/features/auth/AuthProvider'
import * as api from './hooks'
import { NoteEditor } from './NoteEditor'
import type { Note } from './types'

const saveAsync = vi.fn()
const remove = vi.fn()

function setup(path: string, opts: { role?: 'aluna' | 'mentor'; note?: Note | null } = {}) {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role: opts.role ?? 'aluna', name: 'X' } } as never)
  vi.mocked(api.useNote).mockReturnValue(queryOf(opts.note === undefined ? noteOf() : opts.note))
  vi.mocked(api.useSaveNote).mockReturnValue(asyncMutationOf(saveAsync))
  vi.mocked(api.useDeleteNote).mockReturnValue({ ...(asyncMutationOf() as object), mutate: remove } as never)
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/caderno/notas/nova" element={<NoteEditor />} />
        <Route path="/caderno/notas/:id" element={<NoteEditor />} />
        <Route path="/caderno/notas" element={<p>lista de notas</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => { vi.clearAllMocks(); saveAsync.mockResolvedValue(undefined); vi.useFakeTimers({ shouldAdvanceTime: true }) })
afterEach(() => vi.useRealTimers())

test('nota nova nasce privada e só salva depois que a aluna escreve (RF-52/54)', async () => {
  setup('/caderno/notas/nova')
  expect(screen.getByRole('checkbox', { name: 'Compartilhar com o mentor' })).not.toBeChecked()
  await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
  expect(saveAsync).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Ideias' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveAsync).toHaveBeenCalledTimes(1)
  expect(saveAsync.mock.calls[0][0]).toMatchObject({ title: 'Ideias', body: '', private: true, link: null })
  expect(saveAsync.mock.calls[0][0].id).toEqual(expect.any(String))
  expect(screen.getByText('Salvo')).toBeInTheDocument()
})

test('as próximas gravações da mesma nota usam o mesmo id (sem duplicar)', async () => {
  setup('/caderno/notas/nova')
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'A' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'AB' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveAsync).toHaveBeenCalledTimes(2)
  expect(saveAsync.mock.calls[0][0].id).toBe(saveAsync.mock.calls[1][0].id)
})

test('vínculo vem da rota (semana) e é gravado com a nota', async () => {
  setup('/caderno/notas/nova?semana=w05')
  expect(screen.getByRole('link', { name: 'Semana 5' })).toHaveAttribute('href', '/trilha/w05')
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Sobre a semana' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveAsync.mock.calls[0][0].link).toEqual({ type: 'week', id: 'w05' })
})

test('compartilhar com o mentor troca private para false', async () => {
  setup('/caderno/notas/nova')
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('checkbox', { name: 'Compartilhar com o mentor' }))
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveAsync.mock.calls[0][0].private).toBe(false)
})

test('abre uma nota existente e a visualização renderiza o Markdown', async () => {
  setup('/caderno/notas/n1')
  expect(screen.getByLabelText('Título')).toHaveValue('Ideias de abertura')
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Visualizar' }))
  expect(screen.getByText('porquê').tagName).toBe('STRONG')
})

test('nota do outro (mentor lendo nota compartilhada) é só leitura', () => {
  setup('/caderno/notas/n1', { role: 'mentor', note: noteOf({ mine: false, private: false, title: 'Da aluna' }) })
  expect(screen.getByRole('heading', { name: 'Da aluna' })).toBeInTheDocument()
  expect(screen.queryByLabelText('Título')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Apagar nota' })).not.toBeInTheDocument()
})

test('o mentor não tem a opção de compartilhar: as notas dele são só dele', () => {
  setup('/caderno/notas/nova', { role: 'mentor' })
  expect(screen.queryByRole('checkbox', { name: 'Compartilhar com o mentor' })).not.toBeInTheDocument()
  expect(screen.getByText('Só você vê esta nota.')).toBeInTheDocument()
})

test('apagar pede confirmação e volta para a lista', async () => {
  remove.mockImplementation((_id: string, o: { onSuccess: () => void }) => o.onSuccess())
  setup('/caderno/notas/n1')
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  await user.click(screen.getByRole('button', { name: 'Apagar nota' }))
  expect(remove).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))
  expect(remove).toHaveBeenCalledWith('n1', expect.anything())
  expect(await screen.findByText('lista de notas')).toBeInTheDocument()
})

test('apagar com edição pendente salva antes e não recria a nota depois', async () => {
  const order: string[] = []
  saveAsync.mockImplementation(async () => { order.push('save') })
  remove.mockImplementation((_id: string, o: { onSuccess: () => void }) => { order.push('delete'); o.onSuccess() })
  setup('/caderno/notas/n1')
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Ideias novas' } })
  await user.click(screen.getByRole('button', { name: 'Apagar nota' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))
  expect(await screen.findByText('lista de notas')).toBeInTheDocument()
  await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
  expect(order).toEqual(['save', 'delete'])
})

test('nota inexistente', () => {
  setup('/caderno/notas/sumiu', { note: null })
  expect(screen.getByRole('alert')).toHaveTextContent('Nota não encontrada')
})
