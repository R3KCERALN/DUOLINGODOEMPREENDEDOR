import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { NodeStatesResult, ProgressData, SetOverrideVars, ToggleItemVars } from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 14`)
}

export function useProgress(): UseQueryResult<ProgressData> { return notYet('useProgress') }
export function useNodeStates(): NodeStatesResult { return notYet('useNodeStates') }
export function useToggleItem(): UseMutationResult<void, Error, ToggleItemVars> { return notYet('useToggleItem') }
export function useSetOverride(): UseMutationResult<void, Error, SetOverrideVars> { return notYet('useSetOverride') }
export function useJournalDays(): UseQueryResult<ReadonlySet<string>> { return notYet('useJournalDays') }
