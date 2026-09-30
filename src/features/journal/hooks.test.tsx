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

import { useJournalEntries, useSaveJournalEntry } from './hooks'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => fake.reset())

const row = (over: Record<string, unknown> = {}) => ({
  date: '2026-09-29', learned: 'aprendi a ouvir', practiced: 'pratiquei o pitch', tomorrow: 'ligar para 3 empresas',
  complete: true, late: false, created_at: '2026-09-29T22:10:00Z', updated_at: '2026-09-29T23:02:00Z', ...over,
})

test('useJournalEntries mapeia as linhas e mantém a ordem do banco', async () => {
  results.journal_entries = [{ data: [row(), row({ date: '2026-09-28', late: true })], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useJournalEntries(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data![0]).toEqual({
    date: '2026-09-29', learned: 'aprendi a ouvir', practiced: 'pratiquei o pitch', tomorrow: 'ligar para 3 empresas',
    complete: true, late: false, createdAt: '2026-09-29T22:10:00Z', updatedAt: '2026-09-29T23:02:00Z',
  })
  expect(result.current.data![1].late).toBe(true)
  expect(calls).toContainEqual({ table: 'journal_entries', method: 'order', args: ['date', { ascending: false }] })
})

test('salvar faz upsert por (usuário, dia) sem mandar complete, late nem horários; devolve o que o banco calculou', async () => {
  results.journal_entries = [{ data: row({ complete: false }), error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveJournalEntry(), { wrapper: Wrapper })
  let saved: unknown
  await act(async () => { saved = await result.current.mutateAsync({ date: '2026-09-29', learned: 'a', practiced: 'b', tomorrow: 'c' }) })
  const up = calls.find((c) => c.method === 'upsert')!
  expect(up.args).toEqual([{ date: '2026-09-29', learned: 'a', practiced: 'b', tomorrow: 'c' }, { onConflict: 'user_id,date' }])
  expect(saved).toMatchObject({ complete: false, late: false })
})

test('dia fechado e conta errada têm mensagem clara (Review Focus 1)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveJournalEntry(), { wrapper: Wrapper })
  results.journal_entries = [{ data: null, error: { message: 'journal_closed', code: 'P0001' } }]
  await act(async () => { await expect(result.current.mutateAsync({ date: '2026-09-27', learned: 'a', practiced: 'b', tomorrow: 'c' })).rejects.toThrow(/prazo deste dia já passou/) })
  results.journal_entries = [{ data: null, error: { message: 'new row violates row-level security policy', code: '42501' } }]
  await act(async () => { await expect(result.current.mutateAsync({ date: '2026-09-29', learned: 'a', practiced: 'b', tomorrow: 'c' })).rejects.toThrow('Só a aluna escreve no caderno.') })
})
