/** Armazenamento chave-valor mínimo (IndexedDB em produção, memória nos testes). */
export interface KV {
  get<T>(key: string): Promise<T | undefined>
  set(key: string, value: unknown): Promise<void>
  del(key: string): Promise<void>
  keys(): Promise<string[]>
}

export interface PendingRecording { simulationId: string; blob: Blob; mime: string; durationSec: number; queuedAt: number }
export type Uploader = (r: PendingRecording) => Promise<void>

export function createMemoryStore(): KV {
  const m = new Map<string, unknown>()
  return {
    get: async <T,>(k: string) => m.get(k) as T | undefined,
    set: async (k, v) => { m.set(k, v) },
    del: async (k) => { m.delete(k) },
    keys: async () => [...m.keys()],
  }
}

const PREFIX = 'rec:'

/** RF-76g: áudio que não subiu fica no aparelho e é reenviado depois. Um item por simulado. */
export function createRecordingQueue(store: KV, upload: Uploader) {
  let running: Promise<{ sent: number; failed: number }> | null = null
  const pendingKeys = async () => (await store.keys()).filter((k) => k.startsWith(PREFIX))

  async function drain() {
    let sent = 0
    let failed = 0
    for (const key of await pendingKeys()) {
      const item = await store.get<PendingRecording>(key)
      if (!item) continue
      try {
        await upload(item)
        await store.del(key)
        sent++
      } catch {
        failed++
      }
    }
    return { sent, failed }
  }

  return {
    async enqueue(r: Omit<PendingRecording, 'queuedAt'>): Promise<void> {
      await store.set(PREFIX + r.simulationId, { ...r, queuedAt: Date.now() })
    },
    async count(): Promise<number> {
      return (await pendingKeys()).length
    },
    /** Chamadas simultâneas (evento `online` + abertura do app) compartilham a mesma rodada. */
    flush(): Promise<{ sent: number; failed: number }> {
      running ??= drain().finally(() => { running = null })
      return running
    },
  }
}
