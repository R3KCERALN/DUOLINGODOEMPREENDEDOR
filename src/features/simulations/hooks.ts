import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type {
  AdvanceSimulationVars, BankData, CardShownVars, CreateSimulationVars, KeepRecordingVars, PendingRecordings,
  SaveChallengeVars, SaveReelItemVars, ScoreSheet, SetActiveVars, SimulationDetail, SimulationSummary,
  SubmitScoreVars, UploadOutcome, UploadRecordingVars,
} from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 23`)
}

export function useSimulations(): UseQueryResult<SimulationSummary[]> { return notYet('useSimulations') }
export function useSimulation(id: string): UseQueryResult<SimulationDetail> { return notYet(`useSimulation(${id})`) }
export function useScores(simulationId: string): UseQueryResult<ScoreSheet[]> { return notYet(`useScores(${simulationId})`) }
export function useScenarioBank(): UseQueryResult<BankData> { return notYet('useScenarioBank') }
export function useRecentObjectives(): UseQueryResult<string[]> { return notYet('useRecentObjectives') }
export function useRecordingUrl(filePath: string | null): UseQueryResult<string> { return notYet(`useRecordingUrl(${filePath})`) }
export function usePendingRecordings(): PendingRecordings { return notYet('usePendingRecordings') }

export function useCreateSimulation(): UseMutationResult<string, Error, CreateSimulationVars> { return notYet('useCreateSimulation') }
export function useAdvanceSimulation(): UseMutationResult<void, Error, AdvanceSimulationVars> { return notYet('useAdvanceSimulation') }
export function useSubmitScore(): UseMutationResult<void, Error, SubmitScoreVars> { return notYet('useSubmitScore') }
export function useRecordCardShown(): UseMutationResult<void, Error, CardShownVars> { return notYet('useRecordCardShown') }
export function useUploadRecording(): UseMutationResult<UploadOutcome, Error, UploadRecordingVars> { return notYet('useUploadRecording') }
export function useKeepRecording(): UseMutationResult<void, Error, KeepRecordingVars> { return notYet('useKeepRecording') }
export function useSaveReelItem(): UseMutationResult<void, Error, SaveReelItemVars> { return notYet('useSaveReelItem') }
export function useSetReelItemActive(): UseMutationResult<void, Error, SetActiveVars> { return notYet('useSetReelItemActive') }
export function useSaveChallengeCard(): UseMutationResult<void, Error, SaveChallengeVars> { return notYet('useSaveChallengeCard') }
export function useSetChallengeCardActive(): UseMutationResult<void, Error, SetActiveVars> { return notYet('useSetChallengeCardActive') }
