import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { Checklist, SaveChecklistVars, ToggleChecklistItemVars } from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 36`)
}

export function useChecklists(): UseQueryResult<Checklist[]> { return notYet('useChecklists') }
export function useSaveChecklist(): UseMutationResult<void, Error, SaveChecklistVars> { return notYet('useSaveChecklist') }
export function useToggleChecklistItem(): UseMutationResult<void, Error, ToggleChecklistItemVars> { return notYet('useToggleChecklistItem') }
export function useDeleteChecklist(): UseMutationResult<void, Error, string> { return notYet('useDeleteChecklist') }
