import { act, renderHook } from '@testing-library/react'
import type { Recorder } from './recorder'
import { useTrainingSession, type TrainingCard } from './useTrainingSession'

const card = (position: number, atSec: number, kind: TrainingCard['kind'] = 'questionamento'): TrainingCard =>
  ({ position, kind, refId: `c${position}`, text: `fala ${position}`, atSec })

const recorder = () => {
  const stop = vi.fn().mockResolvedValue({ blob: new Blob(['a']), mime: 'audio/webm', durationSec: 300 })
  return { rec: { mime: 'audio/webm', stop } as Recorder, stop }
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

async function startedSession(cards: TrainingCard[], over: Partial<Parameters<typeof useTrainingSession>[0]> = {}) {
  const { rec, stop } = recorder()
  const onCardShown = vi.fn()
  const vibrate = vi.fn()
  const hook = renderHook(() => useTrainingSession({ durationSec: 300, cards, onCardShown, vibrate, begin: async () => rec, ...over }))
  await act(async () => { await hook.result.current.start() })
  return { hook, stop, onCardShown, vibrate }
}

test('começa parado e só grava depois de "Começar"', async () => {
  const { hook } = await startedSession([])
  expect(hook.result.current.phase).toBe('recording')
  expect(hook.result.current.remainingSec).toBe(300)
})

test('revela a carta no momento sorteado, registra o segundo e vibra', async () => {
  const { hook, onCardShown, vibrate } = await startedSession([card(0, 40), card(1, 120)])
  act(() => { vi.advanceTimersByTime(39_000) })
  expect(hook.result.current.currentCard).toBeNull()
  act(() => { vi.advanceTimersByTime(2_000) })
  expect(hook.result.current.currentCard?.position).toBe(0)
  expect(onCardShown).toHaveBeenCalledWith(expect.objectContaining({ position: 0 }), 40)
  expect(vibrate).toHaveBeenCalledTimes(1)
})

test('a carta fica até "respondi" ou até a próxima (RF-76e)', async () => {
  const { hook } = await startedSession([card(0, 40), card(1, 100)])
  act(() => { vi.advanceTimersByTime(60_000) })
  expect(hook.result.current.currentCard?.position).toBe(0)
  act(() => { hook.result.current.dismissCard() })
  expect(hook.result.current.currentCard).toBeNull()
  act(() => { vi.advanceTimersByTime(45_000) })
  expect(hook.result.current.currentCard?.position).toBe(1)
  expect(hook.result.current.shownCards.map((c) => c.position)).toEqual([0, 1])
})

test('cada carta aparece uma vez só', async () => {
  const { hook, onCardShown } = await startedSession([card(0, 30)])
  act(() => { vi.advanceTimersByTime(120_000) })
  expect(onCardShown).toHaveBeenCalledTimes(1)
  expect(hook.result.current.shownCards).toHaveLength(1)
})

test('encerra sozinho quando o tempo acaba e entrega a gravação', async () => {
  const { hook, stop } = await startedSession([], { durationSec: 60 })
  await act(async () => { vi.advanceTimersByTime(61_000) })
  expect(hook.result.current.phase).toBe('finished')
  expect(stop).toHaveBeenCalledTimes(1)
  expect(hook.result.current.remainingSec).toBe(0)
})

test('"Encerrar" é idempotente: para a gravação uma única vez', async () => {
  const { hook, stop } = await startedSession([card(0, 30)])
  let a: unknown, b: unknown
  await act(async () => { [a, b] = await Promise.all([hook.result.current.finish(), hook.result.current.finish()]) })
  expect(stop).toHaveBeenCalledTimes(1)
  expect(a).toBe(b)
})

test('microfone negado: continua parado e mostra o erro', async () => {
  const hook = renderHook(() => useTrainingSession({
    durationSec: 300, cards: [], begin: async () => { throw new Error('Não foi possível usar o microfone.') },
  }))
  await act(async () => { await hook.result.current.start() })
  expect(hook.result.current.phase).toBe('ready')
  expect(hook.result.current.error).toMatch(/microfone/)
  expect(await hook.result.current.finish()).toBeNull()
})

test('a contagem usa o relógio real: aba em segundo plano não atrasa as cartas (Review Focus 3)', async () => {
  const { hook } = await startedSession([card(0, 100)])
  vi.setSystemTime(Date.now() + 130_000) // aba congelada por 130 s
  act(() => { vi.advanceTimersByTime(500) })
  expect(hook.result.current.currentCard?.position).toBe(0)
  expect(hook.result.current.elapsedSec).toBe(130)
})
