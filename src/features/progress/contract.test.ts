vi.mock('@/lib/supabase', () => ({ supabase: {} }))

test('o módulo de hooks exporta exatamente o contrato combinado', async () => {
  const mod = await import('./hooks')
  expect(Object.keys(mod).sort()).toEqual(['useJournalDays', 'useNodeStates', 'useProgress', 'useSetOverride', 'useToggleItem'])
})
