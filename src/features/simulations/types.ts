import type { PhaseId } from '@/content/types'
import type { PlannedCard } from '@/domain/cards'
import type { Difficulty, Draw, ReelItem } from '@/domain/roulette'
import type { Scores } from '@/domain/scoring'
import type { Role, SimMode, SimStatus } from '@/domain/simulationState'

export type { Role, SimMode, SimStatus }
export type CardKind = 'complicacao' | 'questionamento'

export interface SimulationSummary {
  id: string
  mode: SimMode
  difficulty: Difficulty
  phase: PhaseId
  status: SimStatus
  isBoss: boolean
  createdAt: string
  startedAt: string | null
  revealedAt: string | null
  /** A ficha de quem está logado já foi enviada. */
  myScoreDone: boolean
  /** Total oficial (média das duas fichas); `null` até as duas existirem. */
  official: number | null
  hasRecording: boolean
}

export interface ReelDetail { id: string; label: string; mentorRole: string | null; studentGoal: string | null; clientLine: string | null }
export interface Scenario { objective: ReelDetail; profile: ReelDetail; product: ReelDetail; complications: ReelDetail[] }
/** `text` é a fala do cliente (complicação) ou a pergunta do baralho (questionamento). */
export interface SimCard { position: number; kind: CardKind; refId: string; text: string; shownAtSec: number | null }
export interface RecordingInfo { filePath: string; mime: string; durationSec: number; sizeBytes: number; keep: boolean; deleteAfter: string | null }

export interface SimulationDetail {
  summary: SimulationSummary
  /** `null` quando o RLS esconde o cenário (aluna, simulado surpresa ainda não encerrado). */
  scenario: Scenario | null
  cards: SimCard[]
  recording: RecordingInfo | null
}

export interface ScoreSheet { raterRole: Role; mine: boolean; scores: Scores; good: string; improve: string; submittedAt: string }

export interface BankItem extends ReelItem { mentorRole: string | null; studentGoal: string | null; clientLine: string | null; original: boolean }
export interface ChallengeCard { id: string; text: string; active: boolean }
export interface BankData { items: BankItem[]; challenges: ChallengeCard[] }

export interface CreateSimulationVars { mode: SimMode; difficulty: Difficulty; phase: PhaseId; isBoss: boolean; draw: Draw; cards: PlannedCard[] }
export interface AdvanceSimulationVars { id: string; to: 'em_andamento' | 'aguardando_notas' }
export interface SubmitScoreVars { simulationId: string; scores: Scores; good: string; improve: string }
export interface CardShownVars { simulationId: string; position: number; atSec: number }
export interface UploadRecordingVars { simulationId: string; blob: Blob; mime: string; durationSec: number }
export type UploadOutcome = 'uploaded' | 'queued'
export interface KeepRecordingVars { simulationId: string; keep: boolean }
export interface SaveReelItemVars { id?: string; reel: 1 | 2 | 3 | 4; label: string; mentorRole?: string; studentGoal?: string; clientLine?: string }
export interface SetActiveVars { id: string; active: boolean }
export interface SaveChallengeVars { id?: string; text: string }
export interface PendingRecordings { pending: number; flush(): Promise<void> }

/** Horários (segundos desde o início) das cartas do treino, por `position`. Só existe no aparelho, não vai para o banco. */
export interface TrainingPlan { durationSec: number; cardTimes: number[] }
