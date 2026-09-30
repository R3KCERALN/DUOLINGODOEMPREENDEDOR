vi.mock('@/lib/supabase', () => ({ supabase: {} }))

test('o módulo de hooks dos painéis exporta exatamente o contrato combinado', async () => {
  expect(Object.keys(await import('./hooks')).sort()).toEqual(['useActivityDays', 'useScoreSeries', 'useStorageUsage'])
})
