import { useQuery } from '@tanstack/react-query'
import type { ActivityDay, ScoreRow, StorageUsage } from '@/domain/dashboard'
import { fail } from '@/lib/db'
import { supabase } from '@/lib/supabase'

type Num = number | string

interface ScoreDb {
  simulation_id: string; mode: ScoreRow['mode']; difficulty: ScoreRow['difficulty']; phase: ScoreRow['phase']; is_boss: boolean
  day: string; week_start: string; student_total: Num; mentor_total: Num
  abertura: Num; tom: Num; perguntas: Num; escuta: Num; objecao: Num; fechamento: Num; total_official: Num
}

const SCORE_COLUMNS = 'simulation_id, mode, difficulty, phase, is_boss, day, week_start, student_total, mentor_total, abertura, tom, perguntas, escuta, objecao, fechamento, total_official'

/** RF-91–93: simulados com as duas fichas, do mais antigo ao mais novo (o RLS das fichas já esconde o resto). */
export function useScoreSeries() {
  return useQuery({
    queryKey: ['score_series'],
    queryFn: async (): Promise<ScoreRow[]> => {
      const { data, error } = await supabase.from('v_score_series').select(SCORE_COLUMNS).order('day', { ascending: true })
      if (error) throw error
      return (data as unknown as ScoreDb[]).map((r) => ({
        simulationId: r.simulation_id, day: r.day, weekStart: r.week_start, mode: r.mode, difficulty: r.difficulty, phase: r.phase, isBoss: r.is_boss,
        studentTotal: Number(r.student_total), mentorTotal: Number(r.mentor_total), official: Number(r.total_official),
        byCriterion: {
          abertura: Number(r.abertura), tom: Number(r.tom), perguntas: Number(r.perguntas),
          escuta: Number(r.escuta), objecao: Number(r.objecao), fechamento: Number(r.fechamento),
        },
      }))
    },
  })
}

const ACTIVITY_PAGE = 1000

/** RF-94/99a: um registro por dia com atividade da aluna (fuso de São Paulo, calculado no banco). */
export function useActivityDays() {
  return useQuery({
    queryKey: ['activity_days'],
    queryFn: async (): Promise<ActivityDay[]> => {
      // O PostgREST devolve no máximo 1000 linhas por consulta: pagina por `day` (único na view) até vir uma página incompleta.
      const rows: { day: string; items: Num; simulations: Num; journal: boolean }[] = []
      for (let from = 0; ; from += ACTIVITY_PAGE) {
        const { data, error } = await supabase.from('v_activity_days').select('day, items, simulations, journal')
          .order('day', { ascending: true }).range(from, from + ACTIVITY_PAGE - 1)
        if (error) throw error
        const page = data as unknown as typeof rows
        rows.push(...page)
        if (page.length < ACTIVITY_PAGE) break
      }
      return rows.map((r) => ({ day: r.day, items: Number(r.items), simulations: Number(r.simulations), journal: r.journal }))
    },
  })
}

/** RNF-11: só o mentor (a RPC recusa a aluna). */
export function useStorageUsage() {
  return useQuery({
    queryKey: ['storage_usage'],
    queryFn: async (): Promise<StorageUsage[]> => {
      const { data, error } = await supabase.rpc('storage_usage')
      if (error) fail(error, { '42501': 'Só o mentor vê o uso do armazenamento.' })
      return (data as { bucket: string; bytes: Num; files: Num }[])
        .filter((r): r is { bucket: StorageUsage['bucket']; bytes: Num; files: Num } => r.bucket === 'books' || r.bucket === 'recordings')
        .map((r) => ({ bucket: r.bucket, bytes: Number(r.bytes), files: Number(r.files) }))
    },
  })
}
