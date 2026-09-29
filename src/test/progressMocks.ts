import type { UseQueryResult } from '@tanstack/react-query'
import { buildTrailState, type NodeOverride } from '@/domain/trailState'
import type { NodeStatesResult, ProgressData } from '@/features/progress/types'

/** Estado real da trilha (via domínio) para mockar `useNodeStates`. */
export function nodeStatesOf(done: string[] = [], overrides: NodeOverride[] = []): NodeStatesResult {
  return { data: buildTrailState(new Set(done), new Map(overrides.map((o) => [o.nodeId, o]))), isLoading: false, error: null }
}

export function queryOf<T>(data: T): UseQueryResult<T> {
  return { data, isLoading: false, isPending: false, isError: false, error: null, status: 'success' } as unknown as UseQueryResult<T>
}

export function progressOf(done: string[] = []): UseQueryResult<ProgressData> {
  return queryOf<ProgressData>({ doneItems: new Set(done) })
}

/** Retorna `never` de propósito: serve para qualquer `vi.mocked(useXxx).mockReturnValue(...)` de mutation, seja qual for o contexto interno. */
export function mutationOf(mutate = vi.fn(), error: Error | null = null): never {
  return { mutate, mutateAsync: vi.fn(), isPending: false, error, reset: vi.fn() } as never
}
