export const MAX_SECONDS = 720
export const AUDIO_BITS_PER_SECOND = 24_000

// iOS/Safari só grava em MP4; Chrome e Firefox preferem WebM/Ogg com Opus.
const CANDIDATES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm']

export function pickMime(isSupported: (mime: string) => boolean): string | null {
  return CANDIDATES.find(isSupported) ?? null
}

export class RecorderError extends Error {}

export interface RecordingResult { blob: Blob; mime: string; durationSec: number }
export interface Recorder { mime: string; stop(): Promise<RecordingResult> }

export interface RecorderDeps {
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>
  /** Ausente em navegadores sem gravação (ex.: iOS antigo). */
  MediaRecorder: typeof MediaRecorder | undefined
  now: () => number
}

export const browserDeps = (): RecorderDeps => ({
  getUserMedia: (c) => navigator.mediaDevices.getUserMedia(c),
  MediaRecorder: globalThis.MediaRecorder,
  now: () => Date.now(),
})

/** RF-76b: áudio mono, ~24 kbps, no máximo 12 min. */
export async function startRecording(deps: RecorderDeps = browserDeps()): Promise<Recorder> {
  const Ctor = deps.MediaRecorder
  const mime = Ctor ? pickMime((m) => Ctor.isTypeSupported(m)) : null
  if (!Ctor || !mime) throw new RecorderError('Este navegador não grava áudio. Use o Chrome ou o Safari atualizado.')

  let stream: MediaStream
  try {
    stream = await deps.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
  } catch {
    throw new RecorderError('Não foi possível usar o microfone. Libere a permissão e tente de novo.')
  }

  const chunks: Blob[] = []
  let rec: MediaRecorder
  let stopped: Promise<void>
  try {
    rec = new Ctor(stream, { mimeType: mime, audioBitsPerSecond: AUDIO_BITS_PER_SECOND })
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    stopped = new Promise<void>((resolve) => { rec.onstop = () => resolve() })
    rec.start(1000)
  } catch {
    stream.getTracks().forEach((t) => t.stop())
    throw new RecorderError('Este navegador não conseguiu iniciar a gravação. Use o Chrome ou o Safari atualizado.')
  }
  const startedAt = deps.now()
  const limit = setTimeout(() => { if (rec.state !== 'inactive') rec.stop() }, MAX_SECONDS * 1000)

  return {
    mime,
    async stop() {
      clearTimeout(limit)
      if (rec.state !== 'inactive') rec.stop()
      await stopped
      stream.getTracks().forEach((t) => t.stop())
      const durationSec = Math.min(MAX_SECONDS, Math.round((deps.now() - startedAt) / 1000))
      return { blob: new Blob(chunks, { type: mime }), mime, durationSec }
    },
  }
}
