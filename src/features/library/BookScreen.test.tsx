import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { asyncMutationOf, bookOf, courseOf, queryOf } from '@/test/e6Mocks'
import type { Book } from './types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')
vi.mock('./PdfReader', () => ({
  PdfReader: ({ url, initialPage, onPageChange }: { url: string; initialPage: number; onPageChange: (p: number, t: number) => void }) => (
    <div>
      <p>leitor {url} na página {initialPage}</p>
      <button onClick={() => onPageChange(9, 200)}>virar para 9</button>
    </div>
  ),
}))

import { useAuth } from '@/features/auth/AuthProvider'
import { BookScreen } from './BookScreen'
import * as api from './hooks'

const saveProgress = vi.fn()
const upload = vi.fn()
const saveLink = vi.fn()

function setup(book: Book, role: 'aluna' | 'mentor' = 'aluna') {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(api.useBooks).mockReturnValue(queryOf([book]))
  vi.mocked(api.useBookUrl).mockReturnValue(queryOf('https://signed.test/carnegie/1.pdf'))
  vi.mocked(api.useSaveBookProgress).mockReturnValue({ ...(asyncMutationOf() as object), mutate: saveProgress } as never)
  vi.mocked(api.useUploadBook).mockReturnValue({ ...(asyncMutationOf() as object), mutate: upload } as never)
  vi.mocked(api.useRemoveBookFile).mockReturnValue(asyncMutationOf())
  vi.mocked(api.useSaveBookLink).mockReturnValue({ ...(asyncMutationOf() as object), mutate: saveLink } as never)
  return render(<MemoryRouter initialEntries={[`/biblioteca/${book.id}`]}><Routes><Route path="/biblioteca/:bookId" element={<BookScreen />} /></Routes></MemoryRouter>)
}

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ shouldAdvanceTime: true }) })
afterEach(() => vi.useRealTimers())

test('abre o leitor na última página lida', () => {
  setup(bookOf({ filePath: 'carnegie/1.pdf', progress: { page: 12, totalPages: 200, updatedAt: 'x' } }))
  expect(screen.getByText('leitor https://signed.test/carnegie/1.pdf na página 12')).toBeInTheDocument()
})

test('aluna: a página é gravada depois de 1 s parada, não a cada virada (RF-63)', async () => {
  setup(bookOf({ filePath: 'carnegie/1.pdf', progress: { page: 12, totalPages: 200, updatedAt: 'x' } }))
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'virar para 9' }))
  expect(saveProgress).not.toHaveBeenCalled()
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveProgress).toHaveBeenCalledWith({ bookId: 'carnegie', page: 9, totalPages: 200 })
})

test('mentor lê, mas não grava a página', async () => {
  setup(bookOf({ filePath: 'carnegie/1.pdf', progress: null }), 'mentor')
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'virar para 9' }))
  await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
  expect(saveProgress).not.toHaveBeenCalled()
})

test('sem PDF: aviso e link externo opcional; aluna não vê a administração (RF-62)', () => {
  setup(bookOf({ externalUrl: 'https://exemplo.com/audiolivro' }))
  expect(screen.getByText('PDF ainda não disponível')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Abrir link/ })).toHaveAttribute('href', 'https://exemplo.com/audiolivro')
  expect(screen.queryByText('Administrar material')).not.toBeInTheDocument()
})

test('mentor envia o PDF e guarda o link (RF-61/62)', async () => {
  setup(bookOf({ filePath: 'carnegie/velho.pdf' }), 'mentor')
  const file = new File(['%PDF-1.4'], 'livro.pdf', { type: 'application/pdf' })
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).upload(screen.getByLabelText(/Trocar o PDF/), file)
  expect(upload).toHaveBeenCalledWith({ bookId: 'carnegie', file, previousPath: 'carnegie/velho.pdf' })
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).type(screen.getByLabelText(/Link externo/), 'https://exemplo.com/compra')
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Salvar link' }))
  expect(saveLink).toHaveBeenCalledWith({ bookId: 'carnegie', externalUrl: 'https://exemplo.com/compra' })
})

test('curso mostra só o link e livro inexistente dá erro', () => {
  setup(courseOf())
  expect(screen.getByRole('link', { name: 'Abrir curso' })).toBeInTheDocument()
  expect(screen.queryByText('PDF ainda não disponível')).not.toBeInTheDocument()
})

test('material inexistente', () => {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role: 'aluna', name: 'X' } } as never)
  vi.mocked(api.useBooks).mockReturnValue(queryOf([bookOf()]))
  render(<MemoryRouter initialEntries={['/biblioteca/nao-existe']}><Routes><Route path="/biblioteca/:bookId" element={<BookScreen />} /></Routes></MemoryRouter>)
  expect(screen.getByRole('alert')).toHaveTextContent('Material não encontrado')
})
