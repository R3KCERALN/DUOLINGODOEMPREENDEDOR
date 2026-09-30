import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card } from '@/design/ui'
import { useWakeLock } from '@/lib/useWakeLock'
import { mmss } from './format'
import { useAdvanceSimulation, useRecordCardShown, useUploadRecording } from './hooks'
import type { Scenario, UploadOutcome } from './types'
import { useTrainingSession, type TrainingCard } from './useTrainingSession'

export interface SoloTrainingProps {
  simulationId: string
  scenario: Scenario
  /** Cartas agendadas (`atSec`) com o texto resolvido. */
  cards: TrainingCard[]
  durationSec: number
  onDone(outcome: UploadOutcome | 'sem_audio'): void
}

/** Treino solo (RF-76a–g): mostra objetivo, meta, perfil e produto; as complicações só aparecem como cartas. */
export function SoloTraining({ simulationId, scenario, cards, durationSec, onDone }: SoloTrainingProps) {
  const shown = useRecordCardShown()
  const advance = useAdvanceSimulation()
  const upload = useUploadRecording()
  const session = useTrainingSession({
    durationSec, cards,
    onCardShown: (c, atSec) => shown.mutate({ simulationId, position: c.position, atSec }),
  })
  const wake = useWakeLock(session.phase === 'recording')
  const [saveError, setSaveError] = useState<string | null>(null)
  const finalizing = useRef(false)
  const [queued, setQueued] = useState(false)

  async function finalize() {
    setSaveError(null)
    try {
      const rec = await session.finish()
      let outcome: UploadOutcome | 'sem_audio' = 'sem_audio'
      if (rec) outcome = await upload.mutateAsync({ simulationId, blob: rec.blob, mime: rec.mime, durationSec: rec.durationSec })
      setQueued(outcome === 'queued')
      await advance.mutateAsync({ id: simulationId, to: 'aguardando_notas' })
      onDone(outcome)
    } catch (e) {
      finalizing.current = false
      setSaveError(e instanceof Error ? e.message : 'Não foi possível salvar o treino.')
    }
  }

  // Fim do tempo ou "Encerrar": o hook muda para "finished" e o treino é salvo uma única vez.
  useEffect(() => {
    if (session.phase === 'finished' && !finalizing.current) {
      finalizing.current = true
      void finalize()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase])

  const { objective, profile, product } = scenario

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-6 pb-8">
      <h1 className="font-display text-4xl leading-none font-black text-brand text-glow">Treino</h1>

      <Card className="flex flex-col gap-2">
        <p><span className="font-bold text-muted">Objetivo:</span> {objective.label}</p>
        {objective.studentGoal && <p><span className="font-bold text-muted">Sua meta:</span> {objective.studentGoal}</p>}
        <p><span className="font-bold text-muted">Cliente:</span> {profile.label}</p>
        <p><span className="font-bold text-muted">Produto:</span> {product.label}</p>
        <p className="text-sm text-muted">Durante o treino podem aparecer cartas com falas e dúvidas do cliente. Responda em voz alta.</p>
      </Card>

      {session.phase === 'ready' && (
        <>
          {session.error && <p role="alert" className="text-danger">{session.error}</p>}
          <Button size="lg" onClick={() => void session.start()}>Começar</Button>
          <p className="text-sm text-muted">Mantenha a tela ligada e o celular desbloqueado: o áudio é gravado enquanto você treina.</p>
        </>
      )}

      {session.phase === 'recording' && (
        <>
          <p role="timer" aria-label="Tempo restante" className="text-center font-display text-7xl font-black tabular-nums text-brand">
            {mmss(session.remainingSec)}
          </p>
          <Badge tone="brand">● Gravando</Badge>
          {!wake.supported && (
            <p className="text-sm text-streak">Este navegador não mantém a tela ligada sozinho: toque na tela de vez em quando para ela não apagar.</p>
          )}
          {session.currentCard && (
            <section aria-label="Carta do cliente" aria-live="assertive" className="flex flex-col gap-3 rounded-card border-2 border-brand bg-raised p-4 glow">
              <p className="text-xs font-bold tracking-wide text-muted uppercase">
                {session.currentCard.kind === 'complicacao' ? 'O cliente diz' : 'Pergunta do cliente'}
              </p>
              <p className="text-xl leading-snug font-bold">{session.currentCard.text}</p>
              <Button variant="secondary" onClick={session.dismissCard}>Respondi</Button>
            </section>
          )}
          <Button variant="danger" onClick={() => void session.finish()}>Encerrar treino</Button>
        </>
      )}

      {session.phase === 'finished' && (
        saveError ? (
          <div className="flex flex-col gap-3">
            <p role="alert" className="text-danger">{saveError}</p>
            {queued && <p role="status" className="font-bold">Gravação pendente de envio. Ela sobe sozinha quando a conexão voltar.</p>}
            <Button onClick={() => { finalizing.current = true; void finalize() }}>Tentar de novo</Button>
          </div>
        ) : <p role="status" className="text-muted">Salvando o treino…</p>
      )}
    </main>
  )
}
