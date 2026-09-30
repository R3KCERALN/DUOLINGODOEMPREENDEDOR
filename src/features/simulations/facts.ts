import { supabase } from '@/lib/supabase'
import { simulationFactsOf, type ResultRow } from '@/domain/simulationFacts'
import type { SimulationFacts } from '@/domain/trailState'

export const FACTS_KEY = ['sim_facts'] as const

type Row = { objective_id: string | null; phase: ResultRow['phase']; difficulty: ResultRow['difficulty']; total_official: number | string }

/** Simulados com as duas fichas + ids dos 15 objetivos originais: alimenta `buildTrailState` (RF-40). */
export async function fetchSimulationFacts(): Promise<SimulationFacts> {
  const [results, originals] = await Promise.all([
    supabase.from('v_simulation_results').select('objective_id, phase, difficulty, total_official'),
    supabase.from('reel_items').select('id').eq('reel', 1).eq('original', true),
  ])
  if (results.error) throw results.error
  if (originals.error) throw originals.error
  const rows = (results.data as Row[]).map((r) => ({
    objectiveId: r.objective_id, phase: r.phase, difficulty: r.difficulty, totalOfficial: Number(r.total_official),
  }))
  return simulationFactsOf(rows, (originals.data as { id: string }[]).map((r) => r.id))
}
