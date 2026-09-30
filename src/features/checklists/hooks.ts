import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { validateChecklistDraft } from '@/domain/checklists'
import { myId } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Checklist, SaveChecklistVars, ToggleChecklistItemVars } from './types'

const LISTS = ['checklists'] as const
const NOT_OWNER = 'Só quem criou a lista pode editá-la.'

interface ItemRow { id: string; text: string; done_at: string | null; position: number }
interface Row { id: string; owner: string; title: string; week_id: string | null; due_date: string | null; created_at: string; checklist_items: ItemRow[] }

/** RF-42: listas das duas contas (cada uma edita só as suas). */
export function useChecklists() {
  return useQuery({
    queryKey: LISTS,
    queryFn: async (): Promise<Checklist[]> => {
      const me = await myId()
      const { data, error } = await supabase.from('checklists')
        .select('id, owner, title, week_id, due_date, created_at, checklist_items(id, text, done_at, position)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as unknown as Row[]).map((r) => ({
        id: r.id, title: r.title, weekId: r.week_id, dueDate: r.due_date, createdAt: r.created_at, mine: r.owner === me,
        items: [...r.checklist_items].sort((a, b) => a.position - b.position)
          .map((i) => ({ id: i.id, text: i.text, done: i.done_at !== null, position: i.position })),
      }))
    },
  })
}

/**
 * Cria ou atualiza a lista e troca o conjunto de itens. Os ids vêm do cliente, então repetir o envio depois
 * de uma falha no meio do caminho termina o trabalho sem duplicar nada; a marcação dos itens que ficam é preservada.
 */
export function useSaveChecklist() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveChecklistVars>({
    mutationFn: async (v) => {
      const problem = validateChecklistDraft({ title: v.title, weekId: v.weekId, dueDate: v.dueDate, items: v.items })
      if (problem) throw new Error(problem)
      const head = await supabase.from('checklists').upsert(
        { id: v.id, title: v.title.trim(), week_id: v.weekId, due_date: v.dueDate }, { onConflict: 'id' })
      if (head.error) throw head.error.code === '42501' ? new Error(NOT_OWNER) : head.error
      const existing = await supabase.from('checklist_items').select('id').eq('checklist_id', v.id)
      if (existing.error) throw existing.error
      const keep = new Set(v.items.map((i) => i.id))
      const removed = (existing.data as { id: string }[]).map((r) => r.id).filter((id) => !keep.has(id))
      if (removed.length > 0) {
        const del = await supabase.from('checklist_items').delete().in('id', removed)
        if (del.error) throw del.error
      }
      const up = await supabase.from('checklist_items').upsert(
        v.items.map((it, position) => ({ id: it.id, checklist_id: v.id, text: it.text.trim(), position })), { onConflict: 'id' })
      if (up.error) throw up.error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: LISTS }),
  })
}

export function useToggleChecklistItem() {
  const qc = useQueryClient()
  return useMutation<void, Error, ToggleChecklistItemVars, { prev?: Checklist[] }>({
    mutationFn: async ({ itemId, done }) => {
      const { data, error } = await supabase.from('checklist_items')
        .update({ done_at: done ? new Date().toISOString() : null }).eq('id', itemId).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Só quem criou a lista marca os itens.')
    },
    onMutate: async ({ itemId, done }) => {
      await qc.cancelQueries({ queryKey: LISTS })
      const prev = qc.getQueryData<Checklist[]>(LISTS)
      if (prev) {
        qc.setQueryData<Checklist[]>(LISTS, prev.map((l) => ({ ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, done } : i)) })))
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(LISTS, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: LISTS }),
  })
}

export function useDeleteChecklist() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { data, error } = await supabase.from('checklists').delete().eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Só quem criou a lista pode apagá-la.')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LISTS }),
  })
}
