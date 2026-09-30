import { AUDIO_BITS_PER_SECOND, MAX_SECONDS, pickMime, RecorderError, startRecording, type RecorderDeps } from './recorder'

class FakeRecorder {
  static supported = new Set<string>(['audio/webm;codecs=opus'])
  static last: FakeRecorder
  static isTypeSupported = (m: string) => FakeRecorder.supported.has(m)
  state: 'inactive' | 'recording' = 'inactive'
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  options: { mimeType: string; audioBitsPerSecond: number }
  constructor(_stream: MediaStream, options: { mimeType: string; audioBitsPerSecond: number }) {
    this.options = options
    FakeRecorder.last = this
  }
  start() { this.state = 'recording' }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['abc']) })
    this.onstop?.()
  }
}

const track = { stop: vi.fn() }
const stream = { getTracks: () => [track] } as unknown as MediaStream
let clock = 0
const deps = (over: Partial<RecorderDeps> = {}): RecorderDeps => ({
  getUserMedia: vi.fn().mockResolvedValue(stream),
  MediaRecorder: FakeRecorder as unknown as typeof MediaRecorder,
  now: () => clock,
  ...over,
})

beforeEach(() => {
  vi.useFakeTimers()
  clock = 0
  track.stop.mockClear()
  FakeRecorder.supported = new Set(['audio/webm;codecs=opus'])
})
afterEach(() => vi.useRealTimers())

test('escolhe o primeiro formato suportado (Safari cai em MP4)', () => {
  expect(pickMime((m) => m === 'audio/mp4')).toBe('audio/mp4')
  expect(pickMime(() => false)).toBeNull()
})

test('grava mono a ~24 kbps e devolve blob, formato e duração', async () => {
  const d = deps()
  const r = await startRecording(d)
  expect(d.getUserMedia).toHaveBeenCalledWith({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
  expect(FakeRecorder.last.options).toEqual({ mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: AUDIO_BITS_PER_SECOND })
  clock = 65_400
  const out = await r.stop()
  expect(out.mime).toBe('audio/webm;codecs=opus')
  expect(out.durationSec).toBe(65)
  expect(out.blob.size).toBe(3)
  expect(track.stop).toHaveBeenCalled()
})

test('microfone negado gera mensagem legível', async () => {
  await expect(startRecording(deps({ getUserMedia: vi.fn().mockRejectedValue(new Error('denied')) }))).rejects.toThrow(/microfone/)
})

test('navegador sem suporte a gravação gera erro legível', async () => {
  FakeRecorder.supported = new Set()
  await expect(startRecording(deps())).rejects.toBeInstanceOf(RecorderError)
})

test('navegador sem MediaRecorder gera erro legível e nem pede o microfone', async () => {
  const d = deps({ MediaRecorder: undefined })
  await expect(startRecording(d)).rejects.toBeInstanceOf(RecorderError)
  expect(d.getUserMedia).not.toHaveBeenCalled()
})

test('falha ao iniciar o MediaRecorder solta o microfone e gera erro legível', async () => {
  const Broken = class { static isTypeSupported = () => true; constructor() { throw new Error('NotSupportedError') } }
  await expect(startRecording(deps({ MediaRecorder: Broken as unknown as typeof MediaRecorder }))).rejects.toBeInstanceOf(RecorderError)
  expect(track.stop).toHaveBeenCalled()
})

test('para sozinho no limite de 12 min e a duração nunca passa disso', async () => {
  const r = await startRecording(deps())
  clock = (MAX_SECONDS + 30) * 1000
  vi.advanceTimersByTime(MAX_SECONDS * 1000)
  expect(FakeRecorder.last.state).toBe('inactive')
  expect((await r.stop()).durationSec).toBe(MAX_SECONDS)
})
