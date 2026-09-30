import { Link } from 'react-router'
import { Badge, Card, Checkbox, ProgressBar } from '@/design/ui'
import { dailyRoutine, routineItemId, type RoutineItem } from '@/domain/routine'
import { currentStreak } from '@/domain/streak'
import { useJournalDays, useNodeStates, useProgress, useToggleItem } from '@/features/progress/hooks'
import { spDate, TZ } from '@/lib/dates'

const longDate = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' })
const withMinutes = (i: RoutineItem) => (i.minutes ? `${i.label} (${i.minutes} min)` : i.label)

export function TodayScreen() {
  const now = new Date()
  const today = spDate(now)
  const trail = useNodeStates()
  const progress = useProgress()
  const journal = useJournalDays()
  const toggle = useToggleItem()

  if (trail.isLoading || progress.isLoading || journal.isLoading) {
    return <p role="status" className="p-6 text-muted">Carregando o seu dia…</p>
  }
  if (!trail.data || !progress.data || !journal.data) {
    return <p role="alert" className="p-6 text-danger">Não foi possível carregar o seu dia. Verifique a conexão e recarregue a página.</p>
  }

  const doneItems = progress.data.doneItems
  const journalDays = journal.data
  const journalDone = journalDays.has(today)
  const items = dailyRoutine(today, trail.data.currentPhase, journalDone)
  const isDone = (i: RoutineItem) => (i.key === 'caderno' ? journalDone : doneItems.has(routineItemId(today, i.key)))
  const doneCount = items.filter(isDone).length
  const streak = currentStreak(journalDays, today)
  const next = trail.data.next

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pb-8">
      <div aria-hidden className="relative -mx-4 h-40 overflow-hidden">
        <img src="/art/lobo2.png" alt="" width={480} height={360}
          className="pixelated size-full object-cover object-[50%_30%] opacity-80" />
        <div className="absolute inset-0 scanlines" />
        <div className="absolute inset-x-0 bottom-0 h-8 dither-fade" />
      </div>
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="font-bold text-muted first-letter:uppercase">{longDate.format(now)}</p>
          <h1 className="font-display text-6xl leading-none font-black text-brand text-glow">Hoje</h1>
        </div>
        <Badge tone={streak > 0 ? 'streak' : 'muted'}>
          {streak === 0 ? 'Sequência começa hoje' : `${streak} ${streak === 1 ? 'dia seguido' : 'dias seguidos'}`}
        </Badge>
      </header>

      <Card>
        {next ? (
          <>
            <p className="text-sm font-bold text-muted">Próximo da trilha</p>
            <p className="mt-1 text-lg font-bold">{next.item.title}</p>
            <Link to={`/trilha/${next.node.id}`} className="mt-2 inline-block font-bold text-brand underline underline-offset-4">
              Abrir {next.node.week !== undefined ? `Semana ${next.node.week}` : next.node.title}
            </Link>
          </>
        ) : (
          <p className="font-bold">Você está em dia com a trilha.</p>
        )}
      </Card>

      <section aria-labelledby="rotina" className="flex flex-col gap-3">
        <h2 id="rotina" className="text-lg font-bold">Rotina de hoje</h2>
        <ProgressBar value={doneCount / items.length} label="Rotina de hoje" />
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.key} className="flex flex-col">
              {item.key === 'caderno' ? (
                <Link to="/caderno"
                  className={`flex min-h-12 items-center justify-between gap-3 rounded-control border-2 px-3 font-bold
                    focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink
                    ${journalDone ? 'border-edge text-muted' : 'border-brand bg-surface glow'}`}>
                  <span>{withMinutes(item)}</span>
                  <Badge tone={journalDone ? 'muted' : 'brand'}>{journalDone ? 'Feito' : 'Obrigatório'}</Badge>
                </Link>
              ) : (
                <Checkbox checked={isDone(item)} label={withMinutes(item)}
                  onChange={(checked) => toggle.mutate({ itemId: routineItemId(today, item.key), done: checked })} />
              )}
              {item.hint && <p className="pl-12 text-sm text-muted">{item.hint}</p>}
            </li>
          ))}
        </ul>
        {toggle.error && <p role="alert" className="text-danger">{toggle.error.message}</p>}
      </section>
    </main>
  )
}
