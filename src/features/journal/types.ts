export interface JournalEntry {
  date: string
  learned: string
  practiced: string
  tomorrow: string
  /** `complete`, `late`, `createdAt` e `updatedAt` são definidos pelo banco (RF-50). */
  complete: boolean
  late: boolean
  createdAt: string
  updatedAt: string
}

export interface SaveJournalVars { date: string; learned: string; practiced: string; tomorrow: string }
