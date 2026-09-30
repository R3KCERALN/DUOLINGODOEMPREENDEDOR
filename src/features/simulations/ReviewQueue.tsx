import { Link } from 'react-router'
import { Badge } from '@/design/ui'
import { needsMentorReview } from '@/domain/simulationState'
import { useAuth } from '@/features/auth/AuthProvider'
import { DIFFICULTY_LABEL, formatWhen } from './format'
import { useSimulations } from './hooks'

/** RF-76h: "Treinos para avaliar" (só o mentor). Cada item abre o simulado com cenário, cartas, autoavaliação e áudio. */
export function ReviewQueue() {
  const { profile } = useAuth()
  const sims = useSimulations()
  if (profile?.role !== 'mentor') return null

  const queue = (sims.data ?? []).filter((s) => needsMentorReview(s, 'mentor'))
  return (
    <section aria-labelledby="review" className="flex flex-col gap-3">
      <h2 id="review" className="font-display text-2xl font-black">Treinos para avaliar</h2>
      {sims.isLoading && <p role="status" className="text-muted">Carregando…</p>}
      {sims.data && queue.length === 0 && <p className="text-muted">Nenhum treino esperando a sua nota.</p>}
      <ul className="flex flex-col gap-2">
        {queue.map((s) => (
          <li key={s.id}>
            <Link to={`/simulados/${s.id}`} className="flex items-center justify-between gap-3 rounded-card border border-edge bg-surface p-3">
              <span>
                <span className="block font-bold">{formatWhen(s.createdAt)}</span>
                <span className="text-sm text-muted">{DIFFICULTY_LABEL[s.difficulty]}{s.isBoss ? ' · chefe' : ''}</span>
              </span>
              <Badge tone={s.hasRecording ? 'brand' : 'muted'}>{s.hasRecording ? 'Com áudio' : 'Sem áudio'}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
