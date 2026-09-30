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

import type { Checklist } from './types'
import { useChecklists, useDeleteChecklist, useSaveChecklist, useToggleChecklistItem } from './hooks'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => fake.reset())

test('useChecklists ordena os itens por posição e marca as minhas', async () => {
  results.checklists = [{ data: [{
    id: 'c1', owner: 'me', title: 'Semana 5', week_id: 'w05', due_date: '2026-10-04', created_at: 'x',
    checklist_items: [{ id: 'i2', text: 'segundo', done_at: null, position: 1 }, { id: 'i1', text: 'primeiro', done_at: '2026-09-29T10:00:00Z', position: 0 }],
  }, { id: 'c2', owner: 'outra', title: 'Da mentora', week_id: null, due_date: null, created_at: 'y', checklist_items: [] }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useChecklists(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data![0].items.map((i) => [i.text, i.done])).toEqual([['primeiro', true], ['segundo', false]])
  expect(result.current.data![0]).toMatchObject({ mine: true, weekId: 'w05', dueDate: '2026-10-04' })
  expect(result.current.data![1].mine).toBe(false)
})

test('salvar lista: cabeçalho, remove os itens que saíram e regrava os que ficam sem tocar em done_at', async () => {
  results.checklist_items = [{ data: [{ id: 'i1' }, { id: 'velho' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveChecklist(), { wrapper: Wrapper })
  await act(async () => {
    await result.current.mutateAsync({ id: 'c1', title: ' Semana 5 ', weekId: 'w05', dueDate: null, items: [{ id: 'i1', text: ' primeiro ' }, { id: 'i3', text: 'novo' }] })
  })
  expect(calls.find((c) => c.table === 'checklists' && c.method === 'upsert')!.args).toEqual([{ id: 'c1', title: 'Semana 5', week_id: 'w05', due_date: null }, { onConflict: 'id' }])
  expect(calls).toContainEqual({ table: 'checklist_items', method: 'in', args: ['id', ['velho']] })
  const items = calls.filter((c) => c.table === 'checklist_items' && c.method === 'upsert')[0].args[0]
  expect(items).toEqual([{ id: 'i1', checklist_id: 'c1', text: 'primeiro', position: 0 }, { id: 'i3', checklist_id: 'c1', text: 'novo', position: 1 }])
})

test('lista inválida não chega ao banco', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveChecklist(), { wrapper: Wrapper })
  await act(async () => { await expect(result.current.mutateAsync({ id: 'c', title: '', weekId: null, dueDate: null, items: [{ id: 'a', text: 'x' }] })).rejects.toThrow(/título/) })
  expect(calls).toHaveLength(0)
})

test('marcar item é otimista e volta atrás quando o banco recusa (só o dono marca)', async () => {
  const { qc, Wrapper } = setup()
  const list: Checklist = { id: 'c1', title: 'x', weekId: null, dueDate: null, createdAt: 'x', mine: false, items: [{ id: 'i1', text: 'a', done: false, position: 0 }] }
  qc.setQueryData<Checklist[]>(['checklists'], [list])
  const { result } = renderHook(() => useToggleChecklistItem(), { wrapper: Wrapper })
  results.checklist_items = [{ data: [], error: null }]
  await act(async () => { await result.current.mutateAsync({ itemId: 'i1', done: true }).catch(() => undefined) })
  expect(qc.getQueryData<Checklist[]>(['checklists'])![0].items[0].done).toBe(false)
  await waitFor(() => expect(result.current.error?.message).toBe('Só quem criou a lista marca os itens.'))
})

test('marcar grava done_at; desmarcar grava null; apagar de outra pessoa dá erro', async () => {
  const { Wrapper } = setup()
  const toggle = renderHook(() => useToggleChecklistItem(), { wrapper: Wrapper })
  results.checklist_items = [{ data: [{ id: 'i1' }], error: null }, { data: [{ id: 'i1' }], error: null }]
  await act(async () => { await toggle.result.current.mutateAsync({ itemId: 'i1', done: true }); await toggle.result.current.mutateAsync({ itemId: 'i1', done: false }) })
  const updates = calls.filter((c) => c.method === 'update').map((c) => (c.args[0] as { done_at: string | null }).done_at)
  expect(updates[0]).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  expect(updates[1]).toBeNull()
  const del = renderHook(() => useDeleteChecklist(), { wrapper: Wrapper })
  results.checklists = [{ data: [], error: null }]
  await act(async () => { await expect(del.result.current.mutateAsync('c9')).rejects.toThrow('Só quem criou a lista pode apagá-la.') })
})
