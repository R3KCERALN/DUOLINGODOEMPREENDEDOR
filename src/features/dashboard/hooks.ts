import type { UseQueryResult } from '@tanstack/react-query'
import type { ActivityDay, ScoreRow, StorageUsage } from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 46`)
}

export function useScoreSeries(): UseQueryResult<ScoreRow[]> { return notYet('useScoreSeries') }
export function useActivityDays(): UseQueryResult<ActivityDay[]> { return notYet('useActivityDays') }
export function useStorageUsage(): UseQueryResult<StorageUsage[]> { return notYet('useStorageUsage') }
