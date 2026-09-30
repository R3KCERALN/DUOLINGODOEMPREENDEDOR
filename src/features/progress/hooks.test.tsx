import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NODES } from '@/content/trail'
import type { ProgressData } from './types'

type Result = { data: unknown; error: unknown; count?: number | null }

const { from, getSession, results, calls } = vi.hoisted(() => {
  const results: Record<string, Result[]> = {}
  const calls: { table: string; method: string; args: unknown[] }[] = []
  const from = vi.fn((table: string) => {
    const b: Record<string, unknown> = {}
    for (const m of ['select', 'upsert', 'delete', 'eq']) {
      b[m] = (...args: unknown[]) => { calls.push({ table, method: m, args }); return b }
    }
    b.then = (ok: (r: Result) => unknown, fail: (e: unknown) => unknown) =>
      Promise.resolve(results[table]?.shift() ?? { data: [], error: null }).then(ok, fail)
    return b
  })
  const getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'mentor-1' } } } })
  return { from, getSession, results, calls }
})
vi.mock('@/lib/supabase', () => ({ supabase: { from, auth: { getSession } } }))

import { useJournalDays, useNodeStates, useProgress, useSetOverride, useToggleItem } from './hooks'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => {
  calls.length = 0
  for (const k of Object.keys(results)) delete results[k]
})

test('useProgress transforma as linhas em um conjunto de ids', async () => {
  results.item_progress = [{ data: [{ item_id: 'w01.video.1' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useProgress(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data?.doneItems.has('w01.video.1')).toBe(true))
})

test('useNodeStates junta progresso e overrides do mentor', async () => {
  results.item_progress = [{ data: NODES[0].items.map((i) => ({ item_id: i.id })), error: null }]
  results.node_overrides = [{ data: [{ node_id: 'w03', state: 'unlocked', at: '2026-09-29T15:00:00Z', profiles: { name: 'Allan' } }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useNodeStates(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toBeDefined())
  expect(result.current.data!.states.get('w01')).toBe('done')
  expect(result.current.data!.states.get('w02')).toBe('available')
  expect(result.current.data!.states.get('w03')).toBe('available')
  expect(result.current.data!.overrides.get('w03')).toEqual({ nodeId: 'w03', state: 'unlocked', byName: 'Allan', at: '2026-09-29T15:00:00Z' })
})

test('marcar item é idempotente (toque duplo não estoura a chave)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useToggleItem(), { wrapper: Wrapper })
  await act(() => result.current.mutateAsync({ itemId: 'w01.pitch', done: true }))
  expect(calls).toContainEqual({ table: 'item_progress', method: 'upsert', args: [{ item_id: 'w01.pitch' }, { onConflict: 'item_id', ignoreDuplicates: true }] })
})

test('marcação otimista volta atrás quando o banco recusa', async () => {
  results.item_progress = [{ data: null, error: new Error('rede') }]
  const { qc, Wrapper } = setup()
  qc.setQueryData<ProgressData>(['item_progress'], { doneItems: new Set() })
  const { result } = renderHook(() => useToggleItem(), { wrapper: Wrapper })
  await act(async () => { await result.current.mutateAsync({ itemId: 'w01.pitch', done: true }).catch(() => undefined) })
  expect(qc.getQueryData<ProgressData>(['item_progress'])!.doneItems.has('w01.pitch')).toBe(false)
  await waitFor(() => expect(result.current.error?.message).toBe('rede'))
})

test('aluna não desmarca item marcado pelo mentor: erro legível', async () => {
  results.item_progress = [{ data: [], error: null }, { data: null, error: null, count: 1 }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useToggleItem(), { wrapper: Wrapper })
  await act(async () => {
    await expect(result.current.mutateAsync({ itemId: 'f1.gate.2', done: false }))
      .rejects.toThrow('Só quem marcou este item ou o mentor pode desmarcá-lo.')
  })
})

test('desmarcar item que já não existe não é erro', async () => {
  results.item_progress = [{ data: [], error: null }, { data: null, error: null, count: 0 }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useToggleItem(), { wrapper: Wrapper })
  await act(() => result.current.mutateAsync({ itemId: 'w01.pitch', done: false }))
  expect(calls).toContainEqual({ table: 'item_progress', method: 'eq', args: ['item_id', 'w01.pitch'] })
})

test('override grava quem fez; null volta à regra automática', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSetOverride(), { wrapper: Wrapper })
  await act(() => result.current.mutateAsync({ nodeId: 'w07', state: 'unlocked' }))
  const up = calls.find((c) => c.table === 'node_overrides' && c.method === 'upsert')!
  expect(up.args[0]).toMatchObject({ node_id: 'w07', state: 'unlocked', by: 'mentor-1' })
  expect(up.args[1]).toEqual({ onConflict: 'node_id' })
  await act(() => result.current.mutateAsync({ nodeId: 'w07', state: null }))
  expect(calls.some((c) => c.table === 'node_overrides' && c.method === 'delete')).toBe(true)
  expect(calls).toContainEqual({ table: 'node_overrides', method: 'eq', args: ['node_id', 'w07'] })
})

test('useJournalDays lista só os dias com caderno completo', async () => {
  results.journal_entries = [{ data: [{ date: '2026-09-28' }, { date: '2026-09-29' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useJournalDays(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data?.has('2026-09-29')).toBe(true))
  expect(calls).toContainEqual({ table: 'journal_entries', method: 'eq', args: ['complete', true] })
})

test('simulados avaliados alimentam os itens automáticos do portão da Fase 2 (E5)', async () => {
  results.item_progress = [{ data: [], error: null }]
  results.node_overrides = [{ data: [], error: null }]
  results.v_simulation_results = [{ data: [{ objective_id: 'obj-01', phase: 'f2', difficulty: 'medio', total_official: '16.0' }], error: null }]
  results.reel_items = [{ data: [{ id: 'obj-01' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useNodeStates(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data?.gateDone.has('f2.gate.4')).toBe(true))
  expect(result.current.data!.gateDone.has('f2.gate.2')).toBe(true)
})
