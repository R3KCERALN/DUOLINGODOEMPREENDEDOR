import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { buildTrailState, type NodeOverride } from '@/domain/trailState'
import type { NodeStatesResult, ProgressData, SetOverrideVars, ToggleItemVars } from './types'

const PROGRESS = ['item_progress'] as const
const OVERRIDES = ['node_overrides'] as const
const JOURNAL_DAYS = ['journal_days'] as const

async function fetchProgress(): Promise<ProgressData> {
  const { data, error } = await supabase.from('item_progress').select('item_id')
  if (error) throw error
  return { doneItems: new Set(data.map((r: { item_id: string }) => r.item_id)) }
}

type OverrideRow = { node_id: string; state: 'unlocked' | 'locked'; at: string; profiles: { name: string } | null }

async function fetchOverrides(): Promise<Map<string, NodeOverride>> {
  const { data, error } = await supabase.from('node_overrides').select('node_id, state, at, profiles(name)')
  if (error) throw error
  return new Map((data as unknown as OverrideRow[]).map((r) => [
    r.node_id,
    { nodeId: r.node_id, state: r.state, at: r.at, byName: r.profiles?.name ?? 'mentor' },
  ]))
}

export function useProgress() {
  return useQuery({ queryKey: PROGRESS, queryFn: fetchProgress })
}

export function useNodeStates(): NodeStatesResult {
  const progress = useProgress()
  const overrides = useQuery({ queryKey: OVERRIDES, queryFn: fetchOverrides })
  const data = useMemo(
    () => (progress.data && overrides.data ? buildTrailState(progress.data.doneItems, overrides.data) : undefined),
    [progress.data, overrides.data],
  )
  return { data, isLoading: progress.isLoading || overrides.isLoading, error: progress.error ?? overrides.error ?? null }
}

export function useToggleItem() {
  const qc = useQueryClient()
  return useMutation<void, Error, ToggleItemVars, { prev?: ProgressData }>({
    mutationFn: async ({ itemId, done }) => {
      if (done) {
        const { error } = await supabase.from('item_progress').upsert({ item_id: itemId }, { onConflict: 'item_id', ignoreDuplicates: true })
        if (error) throw error
        return
      }
      const { data, error } = await supabase.from('item_progress').delete().eq('item_id', itemId).select('item_id')
      if (error) throw error
      if (data.length > 0) return
      // RLS apaga 0 linhas sem erro quando a aluna tenta desmarcar o que o mentor marcou (RF-41).
      const { count, error: countError } = await supabase.from('item_progress').select('item_id', { count: 'exact', head: true }).eq('item_id', itemId)
      if (countError) throw countError
      if (count) throw new Error('Só quem marcou este item ou o mentor pode desmarcá-lo.')
    },
    onMutate: async ({ itemId, done }) => {
      await qc.cancelQueries({ queryKey: PROGRESS })
      const prev = qc.getQueryData<ProgressData>(PROGRESS)
      if (prev) {
        const doneItems = new Set(prev.doneItems)
        if (done) doneItems.add(itemId)
        else doneItems.delete(itemId)
        qc.setQueryData<ProgressData>(PROGRESS, { doneItems })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(PROGRESS, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: PROGRESS }),
  })
}

export function useSetOverride() {
  const qc = useQueryClient()
  return useMutation<void, Error, SetOverrideVars>({
    mutationFn: async ({ nodeId, state }) => {
      if (state === null) {
        const { error } = await supabase.from('node_overrides').delete().eq('node_id', nodeId)
        if (error) throw error
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada. Entre de novo.')
      const { error } = await supabase.from('node_overrides').upsert(
        { node_id: nodeId, state, by: session.user.id, at: new Date().toISOString() },
        { onConflict: 'node_id' },
      )
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: OVERRIDES }),
  })
}

/** Datas (SP) com caderno completo. Só a aluna escreve no caderno (RLS aluna_insert). */
export function useJournalDays() {
  return useQuery({
    queryKey: JOURNAL_DAYS,
    queryFn: async (): Promise<ReadonlySet<string>> => {
      const { data, error } = await supabase.from('journal_entries').select('date').eq('complete', true)
      if (error) throw error
      return new Set(data.map((r: { date: string }) => r.date))
    },
  })
}
