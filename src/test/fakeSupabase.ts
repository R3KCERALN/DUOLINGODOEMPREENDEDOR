export type Result = { data: unknown; error: unknown; count?: number | null }
export interface Call { table: string; method: string; args: unknown[] }

const BUILDER_METHODS = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'is', 'order', 'limit', 'textSearch', 'maybeSingle', 'single']

/**
 * Supabase falso para testes de hooks. Cada `await` de uma consulta consome o próximo item de
 * `results[<tabela>]` (ou `results['rpc:<função>']`, `results['storage:upload']`, `results['storage:signed']`, `results['storage:remove']`);
 * sem item, devolve `{ data: [], error: null }`. Toda chamada encadeada fica registrada em `calls`.
 */
export function createFakeSupabase() {
  const results: Record<string, Result[]> = {}
  const calls: Call[] = []
  const next = (key: string, fallback: Result): Result => results[key]?.shift() ?? fallback

  const from = vi.fn((table: string) => {
    const b: Record<string, unknown> = {}
    for (const m of BUILDER_METHODS) {
      b[m] = (...args: unknown[]) => { calls.push({ table, method: m, args }); return b }
    }
    b.then = (ok: (r: Result) => unknown, fail: (e: unknown) => unknown) =>
      Promise.resolve(next(table, { data: [], error: null })).then(ok, fail)
    return b
  })
  const rpc = vi.fn(async (fn: string, args: unknown) => {
    calls.push({ table: `rpc:${fn}`, method: 'rpc', args: [args] })
    return next(`rpc:${fn}`, { data: null, error: null })
  })
  const bucketApi = (bucket: string) => ({
    upload: vi.fn(async (path: string, _blob: Blob, options: unknown) => {
      calls.push({ table: `storage:${bucket}`, method: 'upload', args: [path, options] })
      return next('storage:upload', { data: { path }, error: null })
    }),
    createSignedUrl: vi.fn(async (path: string, seconds: number) => {
      calls.push({ table: `storage:${bucket}`, method: 'createSignedUrl', args: [path, seconds] })
      return next('storage:signed', { data: { signedUrl: `https://signed.test/${path}` }, error: null })
    }),
    remove: vi.fn(async (paths: string[]) => {
      calls.push({ table: `storage:${bucket}`, method: 'remove', args: [paths] })
      return next('storage:remove', { data: [], error: null })
    }),
  })
  const getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'me' } } } })
  const storage = { from: vi.fn((bucket: string) => bucketApi(bucket)) }

  return {
    supabase: { from, rpc, storage, auth: { getSession } },
    results,
    calls,
    reset() {
      calls.length = 0
      for (const k of Object.keys(results)) delete results[k]
    },
  }
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>
