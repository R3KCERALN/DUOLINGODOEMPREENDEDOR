import { createStore, del, get, keys, set } from 'idb-keyval'
import type { KV } from './recordingQueue'

const store = createStore('trilha', 'recordings')

export const idbStore: KV = {
  get: <T,>(k: string) => get<T>(k, store),
  set: (k, v) => set(k, v, store),
  del: (k) => del(k, store),
  keys: async () => (await keys(store)).map(String),
}
