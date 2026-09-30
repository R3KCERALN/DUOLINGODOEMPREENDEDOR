import { authorized, purgeDueRecordings, type Due, type PurgeDeps } from './purge'

function deps(due: Due[], over: Partial<PurgeDeps> = {}) {
  const calls: string[] = []
  const d: PurgeDeps = {
    due: vi.fn(async () => due),
    removeFiles: vi.fn(async (paths: string[]) => { calls.push(`files:${paths.join(',')}`) }),
    deleteRows: vi.fn(async (ids: string[]) => { calls.push(`rows:${ids.join(',')}`) }),
    ...over,
  }
  return { d, calls }
}

test('nada vencido: não mexe no Storage nem no banco', async () => {
  const { d } = deps([])
  expect(await purgeDueRecordings(d)).toEqual({ purged: 0 })
  expect(d.removeFiles).not.toHaveBeenCalled()
  expect(d.deleteRows).not.toHaveBeenCalled()
})

test('vencidas: apaga os arquivos e só depois as linhas (RF-76j)', async () => {
  const { d, calls } = deps([{ simulation_id: 'a', file_path: 'a/1.webm' }, { simulation_id: 'b', file_path: 'b/1.m4a' }])
  expect(await purgeDueRecordings(d)).toEqual({ purged: 2 })
  expect(calls).toEqual(['files:a/1.webm,b/1.m4a', 'rows:a,b'])
})

test('Storage falhou: as linhas ficam para a próxima execução (Review Focus 3)', async () => {
  const { d } = deps([{ simulation_id: 'a', file_path: 'a/1.webm' }], {
    removeFiles: vi.fn(async () => { throw new Error('storage down') }),
  })
  await expect(purgeDueRecordings(d)).rejects.toThrow('storage down')
  expect(d.deleteRows).not.toHaveBeenCalled()
})

test('só aceita a chamada com o segredo certo, e segredo fraco não vale', () => {
  const secret = 'x'.repeat(32)
  expect(authorized(secret, secret)).toBe(true)
  expect(authorized(null, secret)).toBe(false)
  expect(authorized('errado', secret)).toBe(false)
  expect(authorized('', undefined)).toBe(false)
  expect(authorized('curto', 'curto')).toBe(false)
})
