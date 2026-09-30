import { useState, type FormEvent } from 'react'
import { Button, Card, TextArea } from '@/design/ui'
import { CRITERIA, CRITERIA_LABELS, isValidScores, total, type Criterion } from '@/domain/scoring'
import { useSubmitScore } from './hooks'

const RATINGS = [1, 2, 3, 4, 5] as const

/** Ficha de avaliação (RF-78/79): 6 critérios de 1 a 5, "o que foi bom" e "o que melhorar". */
export function ScoreSheetForm({ simulationId, onSubmitted }: { simulationId: string; onSubmitted?: () => void }) {
  const submit = useSubmitScore()
  const [picked, setPicked] = useState<Partial<Record<Criterion, number>>>({})
  const [good, setGood] = useState('')
  const [improve, setImprove] = useState('')

  const complete = isValidScores(picked)
  const sum = complete ? total(picked) : null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidScores(picked)) return
    submit.mutate({ simulationId, scores: picked, good, improve }, { onSuccess: onSubmitted })
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <h2 className="font-display text-2xl font-black">Ficha de avaliação</h2>
        <p className="text-sm text-muted">Você só vê a nota da outra pessoa depois que as duas fichas forem enviadas.</p>

        {CRITERIA.map((c) => (
          <fieldset key={c} className="flex flex-col gap-2">
            <legend className="font-bold">{CRITERIA_LABELS[c].label}</legend>
            <p className="text-sm text-muted">{CRITERIA_LABELS[c].hint}</p>
            <div className="flex gap-2">
              {RATINGS.map((n) => (
                <label key={n} className="flex-1">
                  <input type="radio" name={c} value={n} checked={picked[c] === n} onChange={() => setPicked((p) => ({ ...p, [c]: n }))}
                    className="peer sr-only" />
                  <span className="flex h-12 items-center justify-center rounded-control border-2 border-line bg-bg font-bold tabular-nums
                    peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-checked:glow peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                    {n}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <TextArea label="1 coisa que foi boa" value={good} onChange={setGood} />
        <TextArea label="1 coisa para melhorar" value={improve} onChange={setImprove} />

        <p aria-live="polite" className="font-display text-3xl font-black tabular-nums">
          {sum === null ? 'Total: —' : `Total: ${sum} de 30`}
        </p>
        {submit.error && <p role="alert" className="text-danger">{submit.error.message}</p>}
        <Button type="submit" disabled={!complete} loading={submit.isPending}>Enviar ficha</Button>
      </form>
    </Card>
  )
}
