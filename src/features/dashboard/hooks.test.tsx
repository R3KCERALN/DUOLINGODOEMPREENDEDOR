import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { FakeSupabase } from '@/test/fakeSupabase'

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('@/test/fakeSupabase')
  const fake = createFakeSupabase()
  return { supabase: fake.supabase, fake }
})

const { fake } = (await import('@/lib/supabase')) as unknown as { fake: FakeSupabase }
const { results, calls } = fake

import { useActivityDays, useScoreSeries, useStorageUsage } from './hooks'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { Wrapper }
}

beforeEach(() => fake.reset())

test('useScoreSeries converte a linha e pede em ordem de dia', async () => {
  results.v_score_series = [{ data: [{
    simulation_id: 's1', mode: 'treino', difficulty: 'facil', phase: 'f1', is_boss: false, day: '2026-09-29', week_start: '2026-09-28',
    student_total: 24, mentor_total: 18, abertura: '3.5', tom: 3.5, perguntas: 3, escuta: 3, objecao: 3, fechamento: 3, total_official: '21.0',
  }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useScoreSeries(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(1))
  expect(result.current.data![0]).toEqual({
    simulationId: 's1', day: '2026-09-29', weekStart: '2026-09-28', mode: 'treino', difficulty: 'facil', phase: 'f1', isBoss: false,
    studentTotal: 24, mentorTotal: 18, official: 21,
    byCriterion: { abertura: 3.5, tom: 3.5, perguntas: 3, escuta: 3, objecao: 3, fechamento: 3 },
  })
  expect(calls).toContainEqual({ table: 'v_score_series', method: 'order', args: ['day', { ascending: true }] })
})

test('useScoreSeries repassa o erro do banco', async () => {
  results.v_score_series = [{ data: null, error: { message: 'boom', code: 'XX000' } }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useScoreSeries(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.isError).toBe(true))
})

test('useActivityDays devolve os dias em ordem, com números de verdade', async () => {
  results.v_activity_days = [{ data: [
    { day: '2026-09-28', items: '1', simulations: 0, journal: true },
    { day: '2026-09-29', items: 2, simulations: '3', journal: false },
  ], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useActivityDays(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data).toEqual([
    { day: '2026-09-28', items: 1, simulations: 0, journal: true },
    { day: '2026-09-29', items: 2, simulations: 3, journal: false },
  ])
  expect(calls).toContainEqual({ table: 'v_activity_days', method: 'order', args: ['day', { ascending: true }] })
})

test('useStorageUsage lê a RPC e ignora bucket desconhecido', async () => {
  results['rpc:storage_usage'] = [{ data: [
    { bucket: 'books', bytes: '1500', files: 2 },
    { bucket: 'outro', bytes: 9, files: 1 },
    { bucket: 'recordings', bytes: 200, files: 1 },
  ], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useStorageUsage(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data).toEqual([{ bucket: 'books', bytes: 1500, files: 2 }, { bucket: 'recordings', bytes: 200, files: 1 }])
  expect(calls.some((c) => c.table === 'rpc:storage_usage')).toBe(true)
})

test('quem não é o mentor recebe mensagem clara (Review Focus 2)', async () => {
  results['rpc:storage_usage'] = [{ data: null, error: { message: 'mentor_only', code: '42501' } }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useStorageUsage(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.error?.message).toBe('Só o mentor vê o uso do armazenamento.'))
})
