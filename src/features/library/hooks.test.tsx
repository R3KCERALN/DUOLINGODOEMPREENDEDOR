import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { FakeSupabase } from '@/test/fakeSupabase'

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('@/test/fakeSupabase')
  const fake = createFakeSupabase()
  return { supabase: fake.supabase, fake }
})

const { fake } = (await import('@/lib/supabase')) as unknown as { fake: FakeSupabase }
const { results, calls } = fake

import type { Book } from './types'
import { useBooks, useBookUrl, useRemoveBookFile, useSaveBookLink, useSaveBookProgress, useUploadBook } from './hooks'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => fake.reset())

const pdf = (size = 1000, type = 'application/pdf') => new File([new Uint8Array(size)], 'livro.pdf', { type })

test('useBooks traz a página lida de cada livro', async () => {
  results.books = [{ data: [
    { id: 'carnegie', order: 1, title: 'Como Fazer Amigos', author: 'Dale Carnegie', phase: '1', kind: 'livro', file_path: 'carnegie/1.pdf', external_url: null, book_progress: { page: 12, total_pages: 200, updated_at: 'x' } },
    { id: 'sebrae', order: 2, title: 'Cursos', author: null, phase: '2-3', kind: 'curso', file_path: null, external_url: 'https://loja.sebrae.com.br', book_progress: null },
  ], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useBooks(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data![0]).toMatchObject({ id: 'carnegie', filePath: 'carnegie/1.pdf', progress: { page: 12, totalPages: 200 } })
  expect(result.current.data![1]).toMatchObject({ kind: 'curso', progress: null, externalUrl: 'https://loja.sebrae.com.br' })
  expect(calls).toContainEqual({ table: 'books', method: 'order', args: ['order'] })
})

test('URL assinada de 1 hora; sem arquivo não consulta (RF-65)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useBookUrl('carnegie/1.pdf'), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toBe('https://signed.test/carnegie/1.pdf'))
  expect(calls).toContainEqual({ table: 'storage:books', method: 'createSignedUrl', args: ['carnegie/1.pdf', 3600] })
  fake.reset()
  renderHook(() => useBookUrl(null), { wrapper: Wrapper })
  expect(calls).toHaveLength(0)
})

test('salvar página: limita ao total e atualiza o cache sem recarregar a lista (Review Focus 4)', async () => {
  const { qc, Wrapper } = setup()
  const book: Book = { id: 'carnegie', order: 1, title: 'x', author: null, phase: '1', kind: 'livro', filePath: 'carnegie/1.pdf', externalUrl: null, progress: null }
  qc.setQueryData<Book[]>(['books'], [book])
  const { result } = renderHook(() => useSaveBookProgress(), { wrapper: Wrapper })
  await act(async () => { await result.current.mutateAsync({ bookId: 'carnegie', page: 999, totalPages: 200 }) })
  expect(calls.find((c) => c.method === 'upsert')!.args).toEqual([{ book_id: 'carnegie', page: 200, total_pages: 200 }, { onConflict: 'book_id' }])
  expect(qc.getQueryData<Book[]>(['books'])![0].progress).toMatchObject({ page: 200, totalPages: 200 })
})

test('mentor não salva página: mensagem clara', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveBookProgress(), { wrapper: Wrapper })
  results.book_progress = [{ data: null, error: { message: 'row-level security', code: '42501' } }]
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', page: 1, totalPages: null })).rejects.toThrow('Só a aluna salva a página de leitura.') })
})

test('upload: sobe com nome novo na pasta do livro, aponta o livro e apaga o arquivo anterior (RF-61)', async () => {
  results.books = [{ data: [{ id: 'carnegie' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadBook(), { wrapper: Wrapper })
  await act(async () => { await result.current.mutateAsync({ bookId: 'carnegie', file: pdf(), previousPath: 'carnegie/antigo.pdf' }) })
  const up = calls.find((c) => c.method === 'upload')!
  expect(up.table).toBe('storage:books')
  expect(up.args[0]).toMatch(/^carnegie\/\d+\.pdf$/)
  expect(up.args[1]).toEqual({ contentType: 'application/pdf', upsert: false })
  expect(calls.find((c) => c.table === 'books' && c.method === 'update')!.args[0]).toEqual({ file_path: up.args[0] })
  expect(calls).toContainEqual({ table: 'storage:books', method: 'remove', args: [['carnegie/antigo.pdf']] })
})

test('arquivo que não é PDF ou passa de 50 MB nem chega ao Storage', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadBook(), { wrapper: Wrapper })
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', file: pdf(10, 'image/png'), previousPath: null })).rejects.toThrow(/PDF/) })
  const big = { name: 'g.pdf', type: 'application/pdf', size: 51 * 1024 * 1024 } as File
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', file: big, previousPath: null })).rejects.toThrow(/50 MB/) })
  expect(calls).toHaveLength(0)
})

test('aluna tentando subir: Storage recusa com mensagem clara e nada fica órfão', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadBook(), { wrapper: Wrapper })
  results['storage:upload'] = [{ data: null, error: { message: 'new row violates row-level security policy', statusCode: '403' } }]
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', file: pdf(), previousPath: null })).rejects.toThrow('Só o mentor altera os materiais da biblioteca.') })
  expect(calls.some((c) => c.method === 'remove')).toBe(false)
})

test('se a linha do livro não atualiza, o arquivo recém-enviado é removido', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadBook(), { wrapper: Wrapper })
  results.books = [{ data: [], error: null }]
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', file: pdf(), previousPath: 'carnegie/antigo.pdf' })).rejects.toThrow(/Só o mentor/) })
  const removes = calls.filter((c) => c.method === 'remove')
  expect(removes).toHaveLength(1)
  expect((removes[0].args[0] as string[])[0]).toMatch(/^carnegie\/\d+\.pdf$/) // o novo, nunca o antigo
})

test('remover PDF: limpa a linha e apaga o objeto', async () => {
  results.books = [{ data: [{ id: 'carnegie' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useRemoveBookFile(), { wrapper: Wrapper })
  await act(async () => { await result.current.mutateAsync({ bookId: 'carnegie', filePath: 'carnegie/1.pdf' }) })
  expect(calls.find((c) => c.table === 'books' && c.method === 'update')!.args[0]).toEqual({ file_path: null })
  expect(calls).toContainEqual({ table: 'storage:books', method: 'remove', args: [['carnegie/1.pdf']] })
})

test('link externo: normaliza, limpa com vazio e recusa esquemas perigosos (RF-62)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveBookLink(), { wrapper: Wrapper })
  results.books = [{ data: [{ id: 'carnegie' }], error: null }, { data: [{ id: 'carnegie' }], error: null }]
  await act(async () => { await result.current.mutateAsync({ bookId: 'carnegie', externalUrl: ' https://exemplo.com/a ' }) })
  await act(async () => { await result.current.mutateAsync({ bookId: 'carnegie', externalUrl: '  ' }) })
  const sent = calls.filter((c) => c.method === 'update').map((c) => (c.args[0] as { external_url: string | null }).external_url)
  expect(sent).toEqual(['https://exemplo.com/a', null])
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', externalUrl: 'javascript:alert(1)' })).rejects.toThrow(/http/) })
})
