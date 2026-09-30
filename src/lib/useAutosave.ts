import { useCallback, useEffect, useRef, useState } from 'react'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface AutosaveOptions<T> {
  /** Valor atual do formulário. O valor inicial é a linha de base: só mudanças em relação a ele são salvas. */
  value: T
  save: (value: T) => Promise<unknown>
  /** RF-54: ~1 s depois da última alteração. */
  delayMs?: number
  enabled?: boolean
}

export interface Autosave { status: AutosaveStatus; error: string | null; flush(): Promise<void> }

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * RF-54: salva sozinho depois de uma pausa e informa "salvo". Só há um salvamento por vez (o último valor
 * espera a vez, então respostas fora de ordem nunca sobrescrevem algo mais novo) e, ao sair da tela com
 * alteração pendente, salva na hora.
 */
export function useAutosave<T>({ value, save, delayMs = 1000, enabled = true }: AutosaveOptions<T>): Autosave {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(value)
  const saved = useRef(value)
  const saveRef = useRef(save)
  const inFlight = useRef<Promise<void> | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { latest.current = value; saveRef.current = save })

  const run = useCallback(async (): Promise<void> => {
    for (;;) {
      if (inFlight.current) { await inFlight.current; continue }
      if (same(latest.current, saved.current)) return
      const sending = latest.current
      setStatus('saving')
      setError(null)
      let failed = false
      inFlight.current = saveRef.current(sending)
        .then(() => { saved.current = sending })
        .catch((e: unknown) => { failed = true; setStatus('error'); setError(e instanceof Error ? e.message : 'Não foi possível salvar.') })
        .finally(() => { inFlight.current = null })
      await inFlight.current
      if (failed) return
      if (same(latest.current, saved.current)) { setStatus('saved'); return }
    }
  }, [])

  useEffect(() => {
    if (!enabled || same(value, saved.current)) return
    timer.current = setTimeout(() => { void run() }, delayMs)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [value, enabled, delayMs, run])

  // Saiu da tela com algo pendente: salva agora.
  useEffect(() => () => { if (enabled && !same(latest.current, saved.current)) void run() }, [enabled, run])

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    await run()
  }, [run])

  return { status, error, flush }
}
