import { useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PhaseId } from '@/content/types'
import type { Difficulty } from '@/domain/roulette'
import { nextChallengeId, nextReelId, validateChallengeText, validateReelItem } from '@/domain/scenarioBank'
import { isValidScores, type Scores } from '@/domain/scoring'
import { FACTS_KEY } from './facts'
import { recordingQueue, uploadRecording } from './recordingSync'
import type {
  AdvanceSimulationVars, BankData, BankItem, CardShownVars, CreateSimulationVars, KeepRecordingVars, PendingRecordings,
  ReelDetail, SaveChallengeVars, SaveReelItemVars, Scenario, ScoreSheet, SetActiveVars, SimCard, SimMode, SimStatus,
  SimulationDetail, SimulationSummary, SubmitScoreVars, UploadOutcome, UploadRecordingVars,
} from './types'

const SIMS = ['simulations'] as const
const SIM = (id: string) => ['simulation', id] as const
const SCORES = (id: string) => ['simulation_scores', id] as const
const BANK = ['scenario_bank'] as const
const PENDING = ['pending_recordings'] as const

type DbError = { message: string; code?: string }

/** Lança um erro legível: `friendly` mapeia código SQL ou trecho da mensagem para texto em pt-BR. */
function fail(error: DbError, friendly: Record<string, string> = {}): never {
  const key = Object.keys(friendly).find((k) => error.code === k || error.message.includes(k))
  throw new Error(key ? friendly[key] : error.message)
}

async function myId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sessão expirada. Entre de novo.')
  return session.user.id
}

const SIM_COLUMNS =
  'id, mode, difficulty, phase, status, is_boss, created_at, started_at, revealed_at, simulation_scores(rater_id), simulation_recordings(simulation_id)'

interface SimRow {
  id: string; mode: SimMode; difficulty: Difficulty; phase: PhaseId; status: SimStatus; is_boss: boolean
  created_at: string; started_at: string | null; revealed_at: string | null
  simulation_scores: { rater_id: string }[]
  simulation_recordings: { simulation_id: string } | { simulation_id: string }[] | null
}

function toSummary(r: SimRow, me: string, official: number | null): SimulationSummary {
  const rec = r.simulation_recordings
  return {
    id: r.id, mode: r.mode, difficulty: r.difficulty, phase: r.phase, status: r.status, isBoss: r.is_boss,
    createdAt: r.created_at, startedAt: r.started_at, revealedAt: r.revealed_at,
    myScoreDone: r.simulation_scores.some((s) => s.rater_id === me),
    official,
    hasRecording: Array.isArray(rec) ? rec.length > 0 : rec !== null,
  }
}

export function useSimulations() {
  return useQuery({
    queryKey: SIMS,
    queryFn: async (): Promise<SimulationSummary[]> => {
      const me = await myId()
      const [sims, official] = await Promise.all([
        supabase.from('simulations').select(SIM_COLUMNS).order('created_at', { ascending: false }),
        supabase.from('v_simulation_official').select('simulation_id, total_official'),
      ])
      if (sims.error) throw sims.error
      if (official.error) throw official.error
      const totals = new Map((official.data as { simulation_id: string; total_official: number | string }[])
        .map((o) => [o.simulation_id, Number(o.total_official)]))
      return (sims.data as unknown as SimRow[]).map((r) => toSummary(r, me, totals.get(r.id) ?? null))
    },
  })
}

interface ReelRow { id: string; label: string; mentor_role: string | null; student_goal: string | null; client_line: string | null }
const toReel = (r: ReelRow): ReelDetail => ({ id: r.id, label: r.label, mentorRole: r.mentor_role, studentGoal: r.student_goal, clientLine: r.client_line })

async function fetchDetail(id: string): Promise<SimulationDetail> {
  const me = await myId()
  const [sim, official, scen, cards, rec] = await Promise.all([
    supabase.from('simulations').select(SIM_COLUMNS).eq('id', id).maybeSingle(),
    supabase.from('v_simulation_official').select('total_official').eq('simulation_id', id).maybeSingle(),
    supabase.from('simulation_scenarios').select('objective_id, profile_id, product_id, complication_ids').eq('simulation_id', id).maybeSingle(),
    supabase.from('simulation_cards').select('position, kind, ref_id, shown_at_sec').eq('simulation_id', id).order('position'),
    supabase.from('simulation_recordings').select('file_path, mime, duration_sec, size_bytes, keep, delete_after').eq('simulation_id', id).maybeSingle(),
  ])
  for (const r of [sim, official, scen, cards, rec]) if (r.error) throw r.error
  if (!sim.data) throw new Error('Simulado não encontrado.')

  type CardRow = { position: number; kind: SimCard['kind']; ref_id: string; shown_at_sec: number | null }
  const cardRows = cards.data as CardRow[]
  const scenario = scen.data as { objective_id: string; profile_id: string; product_id: string; complication_ids: string[] } | null
  const reelIds = [
    ...(scenario ? [scenario.objective_id, scenario.profile_id, scenario.product_id, ...scenario.complication_ids] : []),
    ...cardRows.filter((c) => c.kind === 'complicacao').map((c) => c.ref_id),
  ]
  const challengeIds = cardRows.filter((c) => c.kind === 'questionamento').map((c) => c.ref_id)
  const [reels, challenges] = await Promise.all([
    supabase.from('reel_items').select('id, label, mentor_role, student_goal, client_line').in('id', reelIds),
    supabase.from('challenge_cards').select('id, text').in('id', challengeIds),
  ])
  if (reels.error) throw reels.error
  if (challenges.error) throw challenges.error

  const reelById = new Map((reels.data as ReelRow[]).map((r) => [r.id, toReel(r)]))
  const reel = (rid: string): ReelDetail => reelById.get(rid) ?? { id: rid, label: rid, mentorRole: null, studentGoal: null, clientLine: null }
  const challengeText = new Map((challenges.data as { id: string; text: string }[]).map((c) => [c.id, c.text]))

  const total = (official.data as { total_official: number | string } | null)?.total_official
  const r = rec.data as { file_path: string; mime: string; duration_sec: number; size_bytes: number; keep: boolean; delete_after: string | null } | null
  return {
    summary: toSummary(sim.data as unknown as SimRow, me, total === undefined ? null : Number(total)),
    scenario: scenario && ({
      objective: reel(scenario.objective_id), profile: reel(scenario.profile_id), product: reel(scenario.product_id),
      complications: scenario.complication_ids.map(reel),
    } satisfies Scenario),
    cards: cardRows.map((c) => ({
      position: c.position, kind: c.kind, refId: c.ref_id, shownAtSec: c.shown_at_sec,
      text: c.kind === 'complicacao' ? (reel(c.ref_id).clientLine ?? reel(c.ref_id).label) : (challengeText.get(c.ref_id) ?? ''),
    })),
    recording: r && { filePath: r.file_path, mime: r.mime, durationSec: r.duration_sec, sizeBytes: r.size_bytes, keep: r.keep, deleteAfter: r.delete_after },
  }
}

export function useSimulation(id: string) {
  return useQuery({ queryKey: SIM(id), queryFn: () => fetchDetail(id) })
}

export function useScores(simulationId: string) {
  return useQuery({
    queryKey: SCORES(simulationId),
    queryFn: async (): Promise<ScoreSheet[]> => {
      const me = await myId()
      const { data, error } = await supabase.from('simulation_scores')
        .select('rater_id, abertura, tom, perguntas, escuta, objecao, fechamento, good, improve, submitted_at, profiles(role)')
        .eq('simulation_id', simulationId)
      if (error) throw error
      type Row = Scores & { rater_id: string; good: string; improve: string; submitted_at: string; profiles: { role: 'aluna' | 'mentor' } | null }
      return (data as unknown as Row[]).map((r) => ({
        raterRole: r.profiles?.role ?? 'aluna', mine: r.rater_id === me, good: r.good, improve: r.improve, submittedAt: r.submitted_at,
        scores: { abertura: r.abertura, tom: r.tom, perguntas: r.perguntas, escuta: r.escuta, objecao: r.objecao, fechamento: r.fechamento },
      }))
    },
  })
}

export function useScenarioBank() {
  return useQuery({
    queryKey: BANK,
    queryFn: async (): Promise<BankData> => {
      const [items, challenges] = await Promise.all([
        supabase.from('reel_items').select('id, reel, label, mentor_role, student_goal, client_line, is_none, original, active').order('id'),
        supabase.from('challenge_cards').select('id, text, active').order('id'),
      ])
      if (items.error) throw items.error
      if (challenges.error) throw challenges.error
      type Row = { id: string; reel: 1 | 2 | 3 | 4; label: string; mentor_role: string | null; student_goal: string | null; client_line: string | null; is_none: boolean; original: boolean; active: boolean }
      return {
        items: (items.data as Row[]).map((r): BankItem => ({
          id: r.id, reel: r.reel, label: r.label, active: r.active, isNone: r.is_none, original: r.original,
          mentorRole: r.mentor_role, studentGoal: r.student_goal, clientLine: r.client_line,
        })),
        challenges: challenges.data as { id: string; text: string; active: boolean }[],
      }
    },
  })
}

/** Objetivos dos últimos simulados que o usuário pode ver, do mais antigo para o mais novo (RF-72). */
export function useRecentObjectives() {
  return useQuery({
    queryKey: [...SIMS, 'recent_objectives'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('simulations')
        .select('created_at, simulation_scenarios(objective_id)').order('created_at', { ascending: false }).limit(6)
      if (error) throw error
      type Row = { simulation_scenarios: { objective_id: string } | { objective_id: string }[] | null }
      const ids = (data as unknown as Row[]).flatMap((r) => {
        const s = Array.isArray(r.simulation_scenarios) ? r.simulation_scenarios[0] : r.simulation_scenarios
        return s ? [s.objective_id] : []
      })
      return ids.slice(0, 3).reverse()
    },
  })
}

export function useRecordingUrl(filePath: string | null) {
  return useQuery({
    queryKey: ['recording_url', filePath],
    enabled: filePath !== null,
    staleTime: 50 * 60_000,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.storage.from('recordings').createSignedUrl(filePath!, 3600)
      if (error) throw error
      return data.signedUrl
    },
  })
}

/** RF-76g: reenvia sozinho ao abrir o app e quando a rede volta. */
export function usePendingRecordings(): PendingRecordings {
  const qc = useQueryClient()
  const pending = useQuery({ queryKey: PENDING, queryFn: () => recordingQueue.count(), initialData: 0 })
  const flush = useCallback(async () => {
    const { sent } = await recordingQueue.flush()
    await qc.invalidateQueries({ queryKey: PENDING })
    if (sent > 0) await Promise.all([qc.invalidateQueries({ queryKey: SIMS }), qc.invalidateQueries({ queryKey: ['simulation'] })])
  }, [qc])
  useEffect(() => {
    void flush()
    window.addEventListener('online', flush)
    return () => window.removeEventListener('online', flush)
  }, [flush])
  return { pending: pending.data, flush }
}

export function useCreateSimulation() {
  const qc = useQueryClient()
  return useMutation<string, Error, CreateSimulationVars>({
    mutationFn: async (v) => {
      const { data, error } = await supabase.rpc('create_simulation', {
        p_mode: v.mode, p_difficulty: v.difficulty, p_phase: v.phase, p_is_boss: v.isBoss,
        p_objective: v.draw.objectiveId, p_profile: v.draw.profileId, p_product: v.draw.productId,
        p_complications: v.draw.complicationIds,
        p_cards: v.cards.map((c, position) => ({ position, kind: c.kind, ref_id: c.refId })),
      })
      if (error) fail(error, { '42501': 'Você não tem permissão para sortear este tipo de simulado.' })
      return data as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SIMS }),
  })
}

export function useAdvanceSimulation() {
  const qc = useQueryClient()
  return useMutation<void, Error, AdvanceSimulationVars>({
    mutationFn: async ({ id, to }) => {
      const { data, error } = await supabase.from('simulations').update({ status: to }).eq('id', id).select('id')
      if (error) fail(error, { invalid_status_transition: 'Este simulado já mudou de etapa. Atualize a tela.' })
      if (!data || data.length === 0) throw new Error('Você não pode alterar este simulado.')
    },
    onSettled: (_d, _e, v) => Promise.all([qc.invalidateQueries({ queryKey: SIMS }), qc.invalidateQueries({ queryKey: SIM(v.id) })]),
  })
}

export function useSubmitScore() {
  const qc = useQueryClient()
  return useMutation<void, Error, SubmitScoreVars>({
    mutationFn: async ({ simulationId, scores, good, improve }) => {
      if (!isValidScores(scores)) throw new Error('Dê uma nota de 1 a 5 em cada um dos 6 critérios.')
      const { error } = await supabase.from('simulation_scores')
        .insert({ simulation_id: simulationId, ...scores, good: good.trim(), improve: improve.trim() })
      if (error) fail(error, { '23505': 'Você já enviou a sua ficha.', simulation_not_finished: 'O simulado ainda não terminou.' })
    },
    onSettled: (_d, _e, v) => Promise.all([
      qc.invalidateQueries({ queryKey: SCORES(v.simulationId) }), qc.invalidateQueries({ queryKey: SIM(v.simulationId) }),
      qc.invalidateQueries({ queryKey: SIMS }), qc.invalidateQueries({ queryKey: FACTS_KEY }),
    ]),
  })
}

export function useRecordCardShown() {
  return useMutation<void, Error, CardShownVars>({
    mutationFn: async ({ simulationId, position, atSec }) => {
      const { error } = await supabase.from('simulation_cards').update({ shown_at_sec: atSec }).eq('simulation_id', simulationId).eq('position', position)
      if (error) throw error
    },
  })
}

export function useUploadRecording() {
  const qc = useQueryClient()
  return useMutation<UploadOutcome, Error, UploadRecordingVars>({
    mutationFn: async (v) => {
      try {
        await uploadRecording({ ...v, queuedAt: Date.now() })
        return 'uploaded'
      } catch {
        try { await recordingQueue.enqueue(v) } catch { throw new Error('Não foi possível enviar nem guardar a gravação neste aparelho.') }
        return 'queued'
      }
    },
    onSettled: (_d, _e, v) => Promise.all([
      qc.invalidateQueries({ queryKey: SIM(v.simulationId) }), qc.invalidateQueries({ queryKey: SIMS }), qc.invalidateQueries({ queryKey: PENDING }),
    ]),
  })
}

export function useKeepRecording() {
  const qc = useQueryClient()
  return useMutation<void, Error, KeepRecordingVars>({
    mutationFn: async ({ simulationId, keep }) => {
      const { data, error } = await supabase.from('simulation_recordings').update({ keep }).eq('simulation_id', simulationId).select('simulation_id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Só o mentor pode guardar a gravação.')
    },
    onSettled: (_d, _e, v) => qc.invalidateQueries({ queryKey: SIM(v.simulationId) }),
  })
}

const NO_PERMISSION = 'Só o mentor edita o banco de cenários.'

export function useSaveReelItem() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveReelItemVars>({
    mutationFn: async (v) => {
      const problem = validateReelItem(v)
      if (problem) throw new Error(problem)
      const fields = {
        label: v.label.trim(), mentor_role: v.mentorRole?.trim() || null,
        student_goal: v.studentGoal?.trim() || null, client_line: v.clientLine?.trim() || null,
      }
      if (v.id) {
        const { data, error } = await supabase.from('reel_items').update(fields).eq('id', v.id).select('id')
        if (error) throw error
        if (!data || data.length === 0) throw new Error(NO_PERMISSION)
        return
      }
      const { data: rows, error: listError } = await supabase.from('reel_items').select('id').eq('reel', v.reel)
      if (listError) throw listError
      const id = nextReelId(v.reel, (rows as { id: string }[]).map((r) => r.id))
      const { error } = await supabase.from('reel_items').insert({ id, reel: v.reel, ...fields, original: false, active: true })
      if (error) fail(error, { '42501': NO_PERMISSION })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BANK }),
  })
}

export function useSetReelItemActive() {
  const qc = useQueryClient()
  return useMutation<void, Error, SetActiveVars>({
    mutationFn: async ({ id, active }) => {
      const { data, error } = await supabase.from('reel_items').update({ active }).eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error(NO_PERMISSION)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BANK }),
  })
}

export function useSaveChallengeCard() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveChallengeVars>({
    mutationFn: async ({ id, text }) => {
      const problem = validateChallengeText(text)
      if (problem) throw new Error(problem)
      if (id) {
        const { data, error } = await supabase.from('challenge_cards').update({ text: text.trim() }).eq('id', id).select('id')
        if (error) throw error
        if (!data || data.length === 0) throw new Error(NO_PERMISSION)
        return
      }
      const { data: rows, error: listError } = await supabase.from('challenge_cards').select('id')
      if (listError) throw listError
      const { error } = await supabase.from('challenge_cards')
        .insert({ id: nextChallengeId((rows as { id: string }[]).map((r) => r.id)), text: text.trim(), active: true })
      if (error) fail(error, { '42501': NO_PERMISSION })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BANK }),
  })
}

export function useSetChallengeCardActive() {
  const qc = useQueryClient()
  return useMutation<void, Error, SetActiveVars>({
    mutationFn: async ({ id, active }) => {
      const { data, error } = await supabase.from('challenge_cards').update({ active }).eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error(NO_PERMISSION)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BANK }),
  })
}
