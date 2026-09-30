import { Card } from '@/design/ui'
import type { HeaderFacts } from '@/domain/dashboard'

const days = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`

/** RF-90: onde ela está e o quanto tem estudado (dia estudado = caderno completo, RF-99). */
export function DashboardHeader({ facts }: { facts: HeaderFacts }) {
  const stats: [string, string][] = [
    ['Fase atual', facts.phaseLabel],
    ['Semana atual', facts.weekLabel],
    ['Trilha concluída', `${facts.percent}%`],
    ['Streak', days(facts.streak)],
    ['Últimos 7 dias', `${facts.days7} de 7 dias estudados`],
    ['Últimos 30 dias', `${facts.days30} de 30 dias estudados`],
  ]
  return (
    <section aria-label="Resumo">
      <dl className="grid grid-cols-2 gap-3">
        {stats.map(([label, value]) => (
          <Card key={label} className="flex flex-col gap-1 p-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-lg font-bold tabular-nums">{value}</dd>
          </Card>
        ))}
      </dl>
    </section>
  )
}
