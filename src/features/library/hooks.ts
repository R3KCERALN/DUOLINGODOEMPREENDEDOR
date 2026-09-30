import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { Book, RemoveBookFileVars, SaveBookLinkVars, SaveProgressVars, UploadBookVars } from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 37`)
}

export function useBooks(): UseQueryResult<Book[]> { return notYet('useBooks') }
export function useBookUrl(filePath: string | null): UseQueryResult<string> { return notYet(`useBookUrl(${filePath})`) }
export function useSaveBookProgress(): UseMutationResult<void, Error, SaveProgressVars> { return notYet('useSaveBookProgress') }
export function useUploadBook(): UseMutationResult<void, Error, UploadBookVars> { return notYet('useUploadBook') }
export function useRemoveBookFile(): UseMutationResult<void, Error, RemoveBookFileVars> { return notYet('useRemoveBookFile') }
export function useSaveBookLink(): UseMutationResult<void, Error, SaveBookLinkVars> { return notYet('useSaveBookLink') }
