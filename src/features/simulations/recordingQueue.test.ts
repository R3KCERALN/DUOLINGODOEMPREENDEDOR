import { createMemoryStore, createRecordingQueue, type PendingRecording } from './recordingQueue'

const rec = (id: string) => ({ simulationId: id, blob: new Blob(['x']), mime: 'audio/webm', durationSec: 60 })

test('guarda a gravação e reenvia quando a rede volta', async () => {
  const upload = vi.fn<(r: PendingRecording) => Promise<void>>().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
  const q = createRecordingQueue(createMemoryStore(), upload)
  await q.enqueue(rec('sim-1'))
  expect(await q.count()).toBe(1)
  expect(await q.flush()).toEqual({ sent: 0, failed: 1 })
  expect(await q.count()).toBe(1)
  expect(await q.flush()).toEqual({ sent: 1, failed: 0 })
  expect(await q.count()).toBe(0)
})

test('duas rodadas ao mesmo tempo enviam uma vez só', async () => {
  const upload = vi.fn().mockResolvedValue(undefined)
  const q = createRecordingQueue(createMemoryStore(), upload)
  await q.enqueue(rec('sim-1'))
  const [a, b] = await Promise.all([q.flush(), q.flush()])
  expect(upload).toHaveBeenCalledTimes(1)
  expect(a).toEqual(b)
})

test('uma falha não trava as outras gravações', async () => {
  const upload = vi.fn(async (r: PendingRecording) => { if (r.simulationId === 'sim-1') throw new Error('x') })
  const q = createRecordingQueue(createMemoryStore(), upload)
  await q.enqueue(rec('sim-1'))
  await q.enqueue(rec('sim-2'))
  expect(await q.flush()).toEqual({ sent: 1, failed: 1 })
  expect(await q.count()).toBe(1)
})

test('enfileirar de novo o mesmo simulado substitui o item', async () => {
  const q = createRecordingQueue(createMemoryStore(), vi.fn())
  await q.enqueue(rec('sim-1'))
  await q.enqueue(rec('sim-1'))
  expect(await q.count()).toBe(1)
})
