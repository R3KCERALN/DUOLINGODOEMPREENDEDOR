import { useEffect } from 'react'

/** Mantém a tela ligada enquanto `active` (PRD §10: o iOS pode pausar a gravação com a tela bloqueada).
 *  O navegador solta o bloqueio quando a aba some; ao voltar, pedimos de novo. Sem suporte ou com recusa, segue sem bloqueio. */
export function useWakeLock(active: boolean): { supported: boolean } {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator

  useEffect(() => {
    if (!active || !supported) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    async function request() {
      try {
        const s = await navigator.wakeLock.request('screen')
        if (cancelled) void s.release()
        else sentinel = s
      } catch {
        // bateria fraca, permissão negada ou aba escondida: o treino continua, só sem o bloqueio
      }
    }
    function onVisibility() {
      if (document.visibilityState === 'visible' && (sentinel === null || sentinel.released)) void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      if (sentinel && !sentinel.released) void sentinel.release()
    }
  }, [active, supported])

  return { supported }
}
