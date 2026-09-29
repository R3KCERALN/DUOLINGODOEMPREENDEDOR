import type { TrailState } from '@/domain/trailState'

export interface ProgressData { doneItems: ReadonlySet<string> }
export interface ToggleItemVars { itemId: string; done: boolean }
/** `state: null` remove o override (volta à regra automática). */
export interface SetOverrideVars { nodeId: string; state: 'unlocked' | 'locked' | null }
export interface NodeStatesResult { data: TrailState | undefined; isLoading: boolean; error: Error | null }
