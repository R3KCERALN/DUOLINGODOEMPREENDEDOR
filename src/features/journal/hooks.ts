import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { JournalEntry, SaveJournalVars } from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 36`)
}

export function useJournalEntries(): UseQueryResult<JournalEntry[]> { return notYet('useJournalEntries') }
export function useSaveJournalEntry(): UseMutationResult<JournalEntry, Error, SaveJournalVars> { return notYet('useSaveJournalEntry') }
