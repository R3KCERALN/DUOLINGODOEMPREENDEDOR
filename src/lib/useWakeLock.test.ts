import { renderHook, waitFor } from '@testing-library/react'
import { useWakeLock } from './useWakeLock'

interface FakeSentinel { released: boolean; release: ReturnType<typeof vi.fn> }

function fakeWakeLock(request?: () => Promise<FakeSentinel>) {
  const sentinels: FakeSentinel[] = []
  const req = vi.fn(request ?? (async () => {
    const s: FakeSentinel = { released: false, release: vi.fn(async () => { s.released = true }) }
    sentinels.push(s)
    return s
  }))
  Object.defineProperty(navigator, 'wakeLock', { value: { request: req }, configurable: true })
  return { request: req, sentinels }
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock')
  Reflect.deleteProperty(document, 'visibilityState')
})

test('inativo: não pede nada', () => {
  const { request } = fakeWakeLock()
  const { result } = renderHook(() => useWakeLock(false))
  expect(result.current.supported).toBe(true)
  expect(request).not.toHaveBeenCalled()
})

test('ativo: pede a tela ligada; ao desativar, solta', async () => {
  const { request, sentinels } = fakeWakeLock()
  const { rerender } = renderHook(({ on }) => useWakeLock(on), { initialProps: { on: true } })
  await waitFor(() => expect(sentinels).toHaveLength(1))
  expect(request).toHaveBeenCalledWith('screen')
  rerender({ on: false })
  expect(sentinels[0].release).toHaveBeenCalled()
})

test('a aba sumiu e voltou: pede de novo (Review Focus 5)', async () => {
  const { request, sentinels } = fakeWakeLock()
  renderHook(() => useWakeLock(true))
  await waitFor(() => expect(sentinels).toHaveLength(1))
  sentinels[0].released = true // o navegador solta sozinho ao esconder a aba
  setVisibility('hidden')
  expect(request).toHaveBeenCalledTimes(1)
  setVisibility('visible')
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
})

test('desmontar solta o bloqueio', async () => {
  const { sentinels } = fakeWakeLock()
  const { unmount } = renderHook(() => useWakeLock(true))
  await waitFor(() => expect(sentinels).toHaveLength(1))
  unmount()
  expect(sentinels[0].release).toHaveBeenCalled()
})

test('sem suporte: informa e não quebra', () => {
  const { result } = renderHook(() => useWakeLock(true))
  expect(result.current.supported).toBe(false)
})

test('navegador recusa (bateria fraca, permissão): não lança', async () => {
  const { request } = fakeWakeLock(async () => { throw new DOMException('denied', 'NotAllowedError') })
  const { result } = renderHook(() => useWakeLock(true))
  await waitFor(() => expect(request).toHaveBeenCalled())
  expect(result.current.supported).toBe(true)
})
