vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./idbStore', () => ({ idbStore: {} }))

test('o módulo de hooks exporta exatamente o contrato combinado', async () => {
  const mod = await import('./hooks')
  expect(Object.keys(mod).sort()).toEqual([
    'useAdvanceSimulation', 'useCreateSimulation', 'useKeepRecording', 'usePendingRecordings', 'useRecentObjectives',
    'useRecordCardShown', 'useRecordingUrl', 'useSaveChallengeCard', 'useSaveReelItem', 'useScenarioBank', 'useScores',
    'useSetChallengeCardActive', 'useSetReelItemActive', 'useSimulation', 'useSimulations', 'useSubmitScore', 'useUploadRecording',
  ])
})
