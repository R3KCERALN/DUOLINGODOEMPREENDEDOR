import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fail } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { JournalEntry, SaveJournalVars } from './types'

const ENTRIES = ['journal_entries'] as const
const COLUMNS = 'date, learned, practiced, tomorrow, complete, late, created_at, updated_at'

interface Row { date: string; learned: string; practiced: string; tomorrow: string; complete: boolean; late: boolean; created_at: string; updated_at: string }
const toEntry = (r: Row): JournalEntry => ({
  date: r.date, learned: r.learned, practiced: r.practiced, tomorrow: r.tomorrow,
  complete: r.complete, late: r.late, createdAt: r.created_at, updatedAt: r.updated_at,
})

/** Últimos 120 dias com entrada, do mais novo ao mais antigo. Os dois perfis leem; só a aluna escreve. */
export function useJournalEntries() {
  return useQuery({
    queryKey: ENTRIES,
    queryFn: async (): Promise<JournalEntry[]> => {
      const { data, error } = await supabase.from('journal_entries').select(COLUMNS).order('date', { ascending: false }).limit(120)
      if (error) throw error
      return (data as Row[]).map(toEntry)
    },
  })
}

/** RF-50/54: grava o rascunho do dia. `complete`, `late` e os horários voltam calculados pelo banco. */
export function useSaveJournalEntry() {
  const qc = useQueryClient()
  return useMutation<JournalEntry, Error, SaveJournalVars>({
    mutationFn: async ({ date, learned, practiced, tomorrow }) => {
      const { data, error } = await supabase.from('journal_entries')
        .upsert({ date, learned, practiced, tomorrow }, { onConflict: 'user_id,date' })
        .select(COLUMNS).single()
      if (error) fail(error, {
        journal_closed: 'O prazo deste dia já passou (era até 12:00 do dia seguinte).',
        '42501': 'Só a aluna escreve no caderno.',
      })
      return toEntry(data as Row)
    },
    // `journal_days` é a chave de `useJournalDays` (streak e tela Hoje).
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ENTRIES }), qc.invalidateQueries({ queryKey: ['journal_days'] })]),
  })
}
