import { useRef } from 'react'
import { Button, Checkbox } from '@/design/ui'
import { formatWhen, mmss } from './format'
import { useKeepRecording, useRecordingUrl } from './hooks'
import type { RecordingInfo, Role } from './types'

export interface Marker { atSec: number; label: string }

/** Player com marcadores nos momentos das cartas (RF-76f) e a opção "guardar" do mentor (RF-76j). */
export function RecordingPlayer({ simulationId, recording, markers, role }: { simulationId: string; recording: RecordingInfo; markers: Marker[]; role: Role }) {
  const url = useRecordingUrl(recording.filePath)
  const keep = useKeepRecording()
  const audio = useRef<HTMLAudioElement>(null)

  const jump = (atSec: number) => {
    if (!audio.current) return
    audio.current.currentTime = atSec
    void audio.current.play()
  }
  const retention = recording.keep
    ? 'Esta gravação será guardada.'
    : recording.deleteAfter
      ? `Será apagada em ${formatWhen(recording.deleteAfter)}.`
      : 'Será apagada 30 dias depois da nota do mentor.'

  return (
    <section aria-label="Gravação do treino" className="flex flex-col gap-3">
      {url.isLoading && <p role="status" className="text-muted">Carregando o áudio…</p>}
      {url.error && <p role="alert" className="text-danger">Não foi possível carregar o áudio.</p>}
      {url.data && <audio ref={audio} controls preload="metadata" src={url.data} className="w-full" />}
      {markers.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Momentos das cartas">
          {markers.map((m) => (
            <li key={`${m.atSec}-${m.label}`}>
              <Button size="sm" variant="secondary" onClick={() => jump(m.atSec)}>{mmss(m.atSec)} · {m.label}</Button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted">{retention}</p>
      {role === 'mentor' && (
        <Checkbox checked={recording.keep} onChange={(k) => keep.mutate({ simulationId, keep: k })} label="Guardar esta gravação" disabled={keep.isPending} />
      )}
      {keep.error && <p role="alert" className="text-danger">{keep.error.message}</p>}
    </section>
  )
}
