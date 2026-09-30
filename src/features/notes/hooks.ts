import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { Note, SaveNoteVars } from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 36`)
}

export function useNotes(search: string): UseQueryResult<Note[]> { return notYet(`useNotes(${search})`) }
export function useNote(id: string | undefined): UseQueryResult<Note | null> { return notYet(`useNote(${id})`) }
export function useSaveNote(): UseMutationResult<void, Error, SaveNoteVars> { return notYet('useSaveNote') }
export function useDeleteNote(): UseMutationResult<void, Error, string> { return notYet('useDeleteNote') }
