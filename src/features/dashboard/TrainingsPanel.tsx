import { useId } from 'react'
import { Link } from 'react-router'
import { Card } from '@/design/ui'
import { shortDate } from '@/domain/dashboard'

const trainings = (n: number) => `${n} ${n === 1 ? 'treino' : 'treinos'}`

/** RF-97b (só mentor): treinos feitos por semana e quantos aguardam a ficha do mentor. */
export function TrainingsPanel({ weeks, pending }: { weeks: { weekStart: string; count: number }[]; pending: number }) {
  const id = useId()
  return (
    <section aria-labelledby={id}>
      <Card className="flex flex-col gap-3">
        <h2 id={id} className="text-lg font-bold">Treinos</h2>
        {pending === 0 ? (
          <p className="text-sm text-muted">Nenhum treino aguardando a sua avaliação.</p>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-streak">{pending} {pending === 1 ? 'treino aguardando' : 'treinos aguardando'} a sua avaliação.</p>
            <Link to="/simulados" className="w-fit text-sm font-bold text-brand underline underline-offset-4">Avaliar treinos</Link>
          </div>
        )}
        <ul className="flex flex-col gap-1 text-sm tabular-nums">
          {weeks.map((w) => <li key={w.weekStart}>Semana de {shortDate(w.weekStart)}: {trainings(w.count)}</li>)}
        </ul>
      </Card>
    </section>
  )
}
