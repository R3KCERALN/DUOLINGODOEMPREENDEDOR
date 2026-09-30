import { useCallback, useEffect, useRef, useState } from 'react'
import type { CardKind } from './types'
import { startRecording, type Recorder, type RecordingResult } from './recorder'

export interface TrainingCard { position: number; kind: CardKind; refId: string; text: string; atSec: number }
export type TrainingPhase = 'ready' | 'recording' | 'finished'

export interface TrainingOptions {
  durationSec: number
  /** Cartas já agendadas por `planCards`, com o texto resolvido, em ordem de `atSec`. */
  cards: TrainingCard[]
  onCardShown?: (card: TrainingCard, atSec: number) => void
  begin?: () => Promise<Recorder>
  vibrate?: (ms: number) => void
}

export interface TrainingSession {
  phase: TrainingPhase
  elapsedSec: number
  remainingSec: number
  /** Carta na tela: fica até "respondi" (`dismissCard`) ou até a próxima (RF-76e). */
  currentCard: TrainingCard | null
  shownCards: TrainingCard[]
  error: string | null
  start(): Promise<void>
  dismissCard(): void
  /** "Encerrar" ou fim do tempo. Devolve a gravação; `null` se nunca começou. Idempotente. */
  finish(): Promise<RecordingResult | null>
}

const browserVibrate = (ms: number) => { if ('vibrate' in navigator) navigator.vibrate(ms) }

/** RF-76b/c/e/f: cronômetro, gravação e revelação das cartas nos momentos sorteados. */
export function useTrainingSession(opts: TrainingOptions): TrainingSession {
  const { durationSec, cards } = opts
  const optsRef = useRef(opts)
  useEffect(() => { optsRef.current = opts })

  const [phase, setPhase] = useState<TrainingPhase>('ready')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [currentCard, setCurrentCard] = useState<TrainingCard | null>(null)
  const [shownCards, setShownCards] = useState<TrainingCard[]>([])
  const [error, setError] = useState<string | null>(null)

  const recorder = useRef<Recorder | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAt = useRef(0)
  const shown = useRef(0)
  const result = useRef<Promise<RecordingResult | null> | null>(null)

  const finish = useCallback((): Promise<RecordingResult | null> => {
    if (result.current) return result.current
    if (!recorder.current) return Promise.resolve(null)
    if (timer.current) clearInterval(timer.current)
    setPhase('finished')
    result.current = recorder.current.stop()
    return result.current
  }, [])

  const tick = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startedAt.current) / 1000)
    setElapsedSec(Math.min(elapsed, durationSec))
    while (shown.current < cards.length && cards[shown.current].atSec <= elapsed) {
      const card = cards[shown.current++]
      setCurrentCard(card)
      setShownCards((prev) => [...prev, card])
      optsRef.current.onCardShown?.(card, elapsed)
      ;(optsRef.current.vibrate ?? browserVibrate)(200)
    }
    if (elapsed >= durationSec) void finish()
  }, [cards, durationSec, finish])

  const start = useCallback(async () => {
    if (recorder.current) return
    setError(null)
    try {
      recorder.current = await (optsRef.current.begin ?? startRecording)()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível iniciar a gravação.')
      return
    }
    startedAt.current = Date.now()
    setPhase('recording')
    timer.current = setInterval(tick, 500)
  }, [tick])

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  return {
    phase, elapsedSec, remainingSec: Math.max(0, durationSec - elapsedSec), currentCard, shownCards, error,
    start, dismissCard: () => setCurrentCard(null), finish,
  }
}
