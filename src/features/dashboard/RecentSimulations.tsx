import { useId } from 'react'
import { Link } from 'react-router'
import { Card } from '@/design/ui'
import { formatScore } from '@/domain/dashboard'
import { statusLabel } from '@/domain/simulationState'
import { DIFFICULTY_LABEL, formatWhen } from '@/features/simulations/format'
import type { SimulationSummary } from '@/features/simulations/types'

/** RF-96 (só mentor): os últimos simulados; o histórico completo, com cenário, notas e feedback, é a tela de Simulados. */
export function RecentSimulations({ sims, limit = 5 }: { sims: SimulationSummary[]; limit?: number }) {
  const id = useId()
  const latest = [...sims].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
  return (
    <section aria-labelledby={id}>
      <Card className="flex flex-col gap-3">
        <h2 id={id} className="text-lg font-bold">Últimos simulados</h2>
        {latest.length === 0 ? (
          <p className="text-sm text-muted">Nenhum simulado ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {latest.map((s) => (
              <li key={s.id}>
                <Link to={`/simulados/${s.id}`} className="font-bold text-brand underline underline-offset-4">
                  {formatWhen(s.createdAt)} · {s.mode === 'treino' ? 'Treino' : 'Surpresa'} · {DIFFICULTY_LABEL[s.difficulty]} ·{' '}
                  {s.official !== null ? `nota ${formatScore(s.official)}` : statusLabel(s.mode, s.status, 'mentor')}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/simulados" className="w-fit text-sm font-bold text-brand underline underline-offset-4">Ver todos os simulados</Link>
      </Card>
    </section>
  )
}
