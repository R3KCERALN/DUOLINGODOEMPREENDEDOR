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

import { useDeleteNote, useNote, useNotes, useSaveNote } from './hooks'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => fake.reset())

const row = (over: Record<string, unknown> = {}) => ({
  id: 'n1', author: 'me', title: 'Ideias', body: 'texto', private: true, link_type: null, link_id: null, updated_at: '2026-09-29T15:00:00Z', ...over,
})

test('useNotes marca as minhas e converte o vínculo', async () => {
  results.notes = [{ data: [row({ link_type: 'week', link_id: 'w05' }), row({ id: 'n2', author: 'aluna-1', private: false })], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useNotes(''), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data![0]).toEqual({ id: 'n1', title: 'Ideias', body: 'texto', private: true, link: { type: 'week', id: 'w05' }, updatedAt: '2026-09-29T15:00:00Z', mine: true })
  expect(result.current.data![1]).toMatchObject({ mine: false, private: false, link: null })
  expect(calls.some((c) => c.method === 'textSearch')).toBe(false)
})

test('busca (RF-53) usa o índice em português e ignora espaços nas pontas', async () => {
  results.notes = [{ data: [row()], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useNotes('  vendas por telefone '), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(1))
  expect(calls).toContainEqual({ table: 'notes', method: 'textSearch', args: ['search', 'vendas por telefone', { config: 'portuguese', type: 'websearch' }] })
})

test('useNote devolve null quando a nota não existe ou não é visível', async () => {
  results.notes = [{ data: null, error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useNote('sumiu'), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toBeNull()
})

test('useNote sem id não consulta', () => {
  const { Wrapper } = setup()
  renderHook(() => useNote(undefined), { wrapper: Wrapper })
  expect(calls).toHaveLength(0)
})

test('salvar usa o id do cliente (upsert): autosave e toque duplo não duplicam a nota (Review Focus 3)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveNote(), { wrapper: Wrapper })
  const vars = { id: 'uuid-1', title: 'T', body: 'B', private: true, link: { type: 'book' as const, id: 'carnegie' } }
  await act(async () => { await result.current.mutateAsync(vars); await result.current.mutateAsync(vars) })
  const ups = calls.filter((c) => c.method === 'upsert')
  expect(ups).toHaveLength(2)
  expect(ups[0].args).toEqual([{ id: 'uuid-1', title: 'T', body: 'B', private: true, link_type: 'book', link_id: 'carnegie' }, { onConflict: 'id' }])
})

test('nota nova sem vínculo grava nulos; erros ficam legíveis', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveNote(), { wrapper: Wrapper })
  await act(async () => { await result.current.mutateAsync({ id: 'u', title: '', body: '', private: true, link: null }) })
  expect(calls.find((c) => c.method === 'upsert')!.args[0]).toMatchObject({ link_type: null, link_id: null, private: true })
  results.notes = [{ data: null, error: { message: 'violates check constraint', code: '23514' } }]
  await act(async () => { await expect(result.current.mutateAsync({ id: 'u', title: 'x', body: 'y', private: true, link: null })).rejects.toThrow(/grande demais/) })
  results.notes = [{ data: null, error: { message: 'row-level security', code: '42501' } }]
  await act(async () => { await expect(result.current.mutateAsync({ id: 'u', title: 'x', body: 'y', private: true, link: null })).rejects.toThrow('Só quem escreveu a nota pode editá-la.') })
})

test('apagar nota de outra pessoa (0 linhas) dá erro legível', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useDeleteNote(), { wrapper: Wrapper })
  results.notes = [{ data: [], error: null }]
  await act(async () => { await expect(result.current.mutateAsync('n2')).rejects.toThrow('Só quem escreveu a nota pode apagá-la.') })
  results.notes = [{ data: [{ id: 'n1' }], error: null }]
  await act(async () => { await result.current.mutateAsync('n1') })
})
