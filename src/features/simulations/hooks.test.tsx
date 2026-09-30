import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { FakeSupabase } from '@/test/fakeSupabase'

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('@/test/fakeSupabase')
  const fake = createFakeSupabase()
  return { supabase: fake.supabase, fake }
})
vi.mock('./idbStore', async () => {
  const { createMemoryStore } = await import('./recordingQueue')
  return { idbStore: createMemoryStore() }
})

const { fake } = (await import('@/lib/supabase')) as unknown as { fake: FakeSupabase }
const { results, calls } = fake

import {
  useAdvanceSimulation, useCreateSimulation, usePendingRecordings, useRecentObjectives, useSaveReelItem, useScenarioBank,
  useSimulation, useSimulations, useSubmitScore, useUploadRecording,
} from './hooks'

const good = { abertura: 4, tom: 4, perguntas: 4, escuta: 4, objecao: 4, fechamento: 4 }
const simRow = (over: Record<string, unknown> = {}) => ({
  id: 's1', mode: 'treino', difficulty: 'medio', phase: 'f2', status: 'aguardando_notas', is_boss: false,
  created_at: '2026-09-29T15:00:00Z', started_at: null, revealed_at: null,
  simulation_scores: [{ rater_id: 'me' }], simulation_recordings: { simulation_id: 's1' }, ...over,
})

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => fake.reset())

test('useSimulations marca minha ficha, a gravação e a nota oficial', async () => {
  results.simulations = [{ data: [simRow(), simRow({ id: 's2', simulation_scores: [], simulation_recordings: null })], error: null }]
  results.v_simulation_official = [{ data: [{ simulation_id: 's1', total_official: '21.5' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSimulations(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data![0]).toMatchObject({ id: 's1', myScoreDone: true, hasRecording: true, official: 21.5, isBoss: false })
  expect(result.current.data![1]).toMatchObject({ id: 's2', myScoreDone: false, hasRecording: false, official: null })
})

test('useSimulation devolve cenário nulo quando o RLS o esconde (RF-75)', async () => {
  results.simulations = [{ data: simRow({ mode: 'surpresa', status: 'em_andamento' }), error: null }]
  results.simulation_scenarios = [{ data: null, error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSimulation('s1'), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toBeDefined())
  expect(result.current.data!.scenario).toBeNull()
  expect(result.current.data!.summary.status).toBe('em_andamento')
})

test('useSimulation resolve rótulos do cenário e o texto das cartas', async () => {
  results.simulations = [{ data: simRow(), error: null }]
  results.simulation_scenarios = [{ data: { objective_id: 'obj-06', profile_id: 'prof-01', product_id: 'prod-01', complication_ids: ['comp-01'] }, error: null }]
  results.simulation_cards = [{ data: [
    { position: 0, kind: 'complicacao', ref_id: 'comp-01', shown_at_sec: 62 },
    { position: 1, kind: 'questionamento', ref_id: 'card-01', shown_at_sec: null },
  ], error: null }]
  results.reel_items = [{ data: [
    { id: 'obj-06', label: 'Objeção de preço', mentor_role: '"Tá caro"', student_goal: 'Reancorar valor', client_line: null },
    { id: 'prof-01', label: 'Apressado', mentor_role: null, student_goal: null, client_line: null },
    { id: 'prod-01', label: 'Plano de internet', mentor_role: null, student_goal: null, client_line: null },
    { id: 'comp-01', label: 'Tá caro', mentor_role: null, student_goal: null, client_line: 'Olha, achei caro.' },
  ], error: null }]
  results.challenge_cards = [{ data: [{ id: 'card-01', text: 'Isso funciona mesmo?' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSimulation('s1'), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toBeDefined())
  expect(result.current.data!.scenario).toMatchObject({ objective: { label: 'Objeção de preço', studentGoal: 'Reancorar valor' }, profile: { label: 'Apressado' } })
  expect(result.current.data!.scenario!.complications.map((c) => c.label)).toEqual(['Tá caro'])
  expect(result.current.data!.cards).toEqual([
    { position: 0, kind: 'complicacao', refId: 'comp-01', shownAtSec: 62, text: 'Olha, achei caro.' },
    { position: 1, kind: 'questionamento', refId: 'card-01', shownAtSec: null, text: 'Isso funciona mesmo?' },
  ])
})

test('criar simulado usa a RPC atômica e numera as cartas', async () => {
  results['rpc:create_simulation'] = [{ data: 'novo-id', error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useCreateSimulation(), { wrapper: Wrapper })
  let id = ''
  await act(async () => {
    id = await result.current.mutateAsync({
      mode: 'treino', difficulty: 'medio', phase: 'f2', isBoss: false,
      draw: { objectiveId: 'obj-06', profileId: 'prof-01', productId: 'prod-01', complicationIds: ['comp-01'] },
      cards: [{ kind: 'questionamento', refId: 'card-01', atSec: 40 }, { kind: 'complicacao', refId: 'comp-01', atSec: 120 }],
    })
  })
  expect(id).toBe('novo-id')
  expect(calls.find((c) => c.method === 'rpc')!.args[0]).toEqual({
    p_mode: 'treino', p_difficulty: 'medio', p_phase: 'f2', p_is_boss: false,
    p_objective: 'obj-06', p_profile: 'prof-01', p_product: 'prod-01', p_complications: ['comp-01'],
    p_cards: [{ position: 0, kind: 'questionamento', ref_id: 'card-01' }, { position: 1, kind: 'complicacao', ref_id: 'comp-01' }],
  })
})

test('avançar simulado sem permissão (0 linhas) dá erro legível; transição inválida também', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useAdvanceSimulation(), { wrapper: Wrapper })
  results.simulations = [{ data: [], error: null }]
  await act(async () => {
    await expect(result.current.mutateAsync({ id: 's1', to: 'aguardando_notas' })).rejects.toThrow('Você não pode alterar este simulado.')
  })
  results.simulations = [{ data: null, error: { message: 'invalid_status_transition', code: 'P0001' } }]
  await act(async () => {
    await expect(result.current.mutateAsync({ id: 's1', to: 'em_andamento' })).rejects.toThrow(/já mudou de etapa/)
  })
})

test('ficha inválida não chega ao banco; ficha duplicada tem mensagem clara (Review Focus 4)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSubmitScore(), { wrapper: Wrapper })
  await act(async () => {
    await expect(result.current.mutateAsync({ simulationId: 's1', scores: { ...good, tom: 6 }, good: '', improve: '' })).rejects.toThrow(/1 a 5/)
  })
  expect(calls.some((c) => c.method === 'insert')).toBe(false)
  results.simulation_scores = [{ data: null, error: { message: 'duplicate key', code: '23505' } }]
  await act(async () => {
    await expect(result.current.mutateAsync({ simulationId: 's1', scores: good, good: ' ok ', improve: ' melhorar ' })).rejects.toThrow('Você já enviou a sua ficha.')
  })
  expect(calls.find((c) => c.method === 'insert')!.args[0]).toMatchObject({ simulation_id: 's1', good: 'ok', improve: 'melhorar', abertura: 4 })
})

test('upload sobe o áudio na pasta do simulado e registra a linha', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadRecording(), { wrapper: Wrapper })
  let outcome = ''
  await act(async () => { outcome = await result.current.mutateAsync({ simulationId: 's1', blob: new Blob(['abc']), mime: 'audio/webm;codecs=opus', durationSec: 300 }) })
  expect(outcome).toBe('uploaded')
  expect(calls).toContainEqual({ table: 'storage:recordings', method: 'upload', args: ['s1/audio.webm', { contentType: 'audio/webm', upsert: false }] })
  const row = calls.find((c) => c.table === 'simulation_recordings' && c.method === 'upsert')!
  expect(row.args[0]).toEqual({ simulation_id: 's1', file_path: 's1/audio.webm', mime: 'audio/webm;codecs=opus', duration_sec: 300, size_bytes: 3 })
})

test('upload que falha vira "pendente" e é reenviado depois (RF-76g); arquivo já existente não é erro', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadRecording(), { wrapper: Wrapper })
  results['storage:upload'] = [{ data: null, error: { message: 'Failed to fetch' } }]
  let outcome = ''
  await act(async () => { outcome = await result.current.mutateAsync({ simulationId: 's9', blob: new Blob(['x']), mime: 'audio/mp4', durationSec: 60 }) })
  expect(outcome).toBe('queued')

  const pending = renderHook(() => usePendingRecordings(), { wrapper: Wrapper })
  await waitFor(() => expect(pending.result.current.pending).toBe(0)) // o efeito de montagem já reenviou
  expect(calls.filter((c) => c.method === 'upload').map((c) => c.args[0])).toEqual(['s9/audio.m4a', 's9/audio.m4a'])
})

test('reenvio trata "já existe" no Storage como sucesso', async () => {
  const { Wrapper } = setup()
  results['storage:upload'] = [{ data: null, error: { message: 'The resource already exists' } }]
  const { result } = renderHook(() => useUploadRecording(), { wrapper: Wrapper })
  let outcome = ''
  await act(async () => { outcome = await result.current.mutateAsync({ simulationId: 's2', blob: new Blob(['x']), mime: 'audio/webm', durationSec: 10 }) })
  expect(outcome).toBe('uploaded')
})

test('useRecentObjectives devolve os 3 mais recentes visíveis, do mais antigo ao mais novo (RF-72)', async () => {
  const row = (o: string | null) => ({ created_at: 'x', simulation_scenarios: o ? { objective_id: o } : null })
  results.simulations = [{ data: [row('obj-05'), row(null), row('obj-04'), row('obj-03'), row('obj-02')], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useRecentObjectives(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toEqual(['obj-03', 'obj-04', 'obj-05']))
})

test('useScenarioBank traz inativos também', async () => {
  results.reel_items = [{ data: [{ id: 'obj-03', reel: 1, label: 'Follow-up', mentor_role: 'Lead', student_goal: 'Sim ou não', client_line: null, is_none: false, original: false, active: false }], error: null }]
  results.challenge_cards = [{ data: [{ id: 'card-01', text: 'Tem nota fiscal?', active: true }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useScenarioBank(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toBeDefined())
  expect(result.current.data!.items[0]).toMatchObject({ id: 'obj-03', active: false, mentorRole: 'Lead', original: false, isNone: false })
})

test('novo item do rolo ganha o próximo id e nunca é "original"; item inválido é recusado', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveReelItem(), { wrapper: Wrapper })
  await act(async () => { await expect(result.current.mutateAsync({ reel: 1, label: 'Follow-up' })).rejects.toThrow(/papel do mentor/) })
  results.reel_items = [{ data: [{ id: 'obj-01' }, { id: 'obj-30' }], error: null }, { data: null, error: null }]
  await act(async () => { await result.current.mutateAsync({ reel: 1, label: ' Follow-up ', mentorRole: 'Lead que sumiu', studentGoal: 'Obter sim ou não' }) })
  expect(calls.find((c) => c.method === 'insert')!.args[0]).toEqual({
    id: 'obj-31', reel: 1, label: 'Follow-up', mentor_role: 'Lead que sumiu', student_goal: 'Obter sim ou não', client_line: null, original: false, active: true,
  })
})
