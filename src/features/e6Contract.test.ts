vi.mock('@/lib/supabase', () => ({ supabase: {} }))

test('os módulos de hooks do caderno, das notas, das listas e da biblioteca exportam exatamente o contrato combinado', async () => {
  expect(Object.keys(await import('./journal/hooks')).sort()).toEqual(['useJournalEntries', 'useSaveJournalEntry'])
  expect(Object.keys(await import('./notes/hooks')).sort()).toEqual(['useDeleteNote', 'useNote', 'useNotes', 'useSaveNote'])
  expect(Object.keys(await import('./checklists/hooks')).sort()).toEqual(['useChecklists', 'useDeleteChecklist', 'useSaveChecklist', 'useToggleChecklistItem'])
  expect(Object.keys(await import('./library/hooks')).sort()).toEqual(['useBookUrl', 'useBooks', 'useRemoveBookFile', 'useSaveBookLink', 'useSaveBookProgress', 'useUploadBook'])
})
