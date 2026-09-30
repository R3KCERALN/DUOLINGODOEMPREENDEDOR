import { useParams } from 'react-router'
import { Badge, Button, Card } from '@/design/ui'
import { CRITERIA, CRITERIA_LABELS, officialScore } from '@/domain/scoring'
import { canSubmitScore, isScenarioHidden, statusLabel } from '@/domain/simulationState'
import { useAuth } from '@/features/auth/AuthProvider'
import { DIFFICULTY_LABEL, formatWhen, mmss } from './format'
import { useAdvanceSimulation, useScores, useSimulation } from './hooks'
import { RecordingPlayer } from './RecordingPlayer'
import { ScoreSheetForm } from './ScoreSheetForm'

const short = (t: string) => (t.length > 28 ? `${t.slice(0, 28)}…` : t)

/** `/simulados/:id`: cenário (respeitando o RF-75), cartas, áudio, ficha e nota oficial. */
export function SimulationDetail() {
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const role = profile?.role ?? 'aluna'
  const detail = useSimulation(id)
  const scores = useScores(id)
  const advance = useAdvanceSimulation()

  if (detail.isLoading) return <p role="status" className="p-6 text-muted">Carregando o simulado…</p>
  if (!detail.data) return <p role="alert" className="p-6 text-danger">Simulado não encontrado.</p>

  const { summary, scenario, cards, recording } = detail.data
  const hidden = isScenarioHidden(summary.mode, summary.status, role)
  // RF-76a: no treino em andamento as complicações e as cartas só aparecem como cartas, nunca aqui.
  const secret = role === 'aluna' && summary.mode === 'treino' && summary.status === 'em_andamento'
  const canEnd = summary.status === 'em_andamento'
    && ((role === 'mentor' && summary.mode === 'surpresa') || (role === 'aluna' && summary.mode === 'treino'))
  const sheets = scores.data ?? []
  const student = sheets.find((s) => s.raterRole === 'aluna')
  const mentor = sheets.find((s) => s.raterRole === 'mentor')
  const official = student && mentor ? officialScore(student.scores, mentor.scores) : null

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-6 pb-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl leading-tight font-black text-brand text-glow">{statusLabel(summary.mode, summary.status, role)}</h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {formatWhen(summary.createdAt)}
          <Badge tone="muted">{DIFFICULTY_LABEL[summary.difficulty]}</Badge>
          {summary.isBoss && <Badge tone="brand">Chefe</Badge>}
        </p>
      </header>

      {hidden && <Card><p>O cenário aparece quando o mentor encerrar o simulado.</p></Card>}

      {!hidden && scenario && (
        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-2xl font-black">Cenário</h2>
          <p><span className="font-bold text-muted">Objetivo:</span> {scenario.objective.label}</p>
          {scenario.objective.mentorRole && <p><span className="font-bold text-muted">Papel do mentor:</span> {scenario.objective.mentorRole}</p>}
          {scenario.objective.studentGoal && <p><span className="font-bold text-muted">Meta dela:</span> {scenario.objective.studentGoal}</p>}
          <p><span className="font-bold text-muted">Cliente:</span> {scenario.profile.label}</p>
          <p><span className="font-bold text-muted">Produto:</span> {scenario.product.label}</p>
          {secret
            ? <p className="text-sm text-muted">As complicações aparecem como cartas durante o treino.</p>
            : scenario.complications.map((c) => (
              <p key={c.id}><span className="font-bold text-muted">Complicação:</span> {c.label}{c.clientLine ? ` — “${c.clientLine}”` : ''}</p>
            ))}
        </Card>
      )}

      {!secret && cards.length > 0 && (
        <section aria-labelledby="cartas" className="flex flex-col gap-2">
          <h2 id="cartas" className="font-display text-2xl font-black">Cartas do treino</h2>
          <ol className="flex flex-col gap-2">
            {cards.map((c) => (
              <li key={c.position} className="rounded-card border border-edge bg-surface p-3">
                <span className="font-bold tabular-nums">{c.shownAtSec === null ? 'Não apareceu' : mmss(c.shownAtSec)}</span> · {c.text}
              </li>
            ))}
          </ol>
        </section>
      )}

      {recording && (
        <RecordingPlayer simulationId={id} recording={recording} role={role}
          markers={cards.flatMap((c) => (c.shownAtSec === null ? [] : [{ atSec: c.shownAtSec, label: short(c.text) }]))} />
      )}

      {canEnd && (
        <>
          <Button variant="danger" loading={advance.isPending} onClick={() => advance.mutate({ id, to: 'aguardando_notas' })}>
            {summary.mode === 'surpresa' ? 'Encerrar simulado' : 'Encerrar treino'}
          </Button>
          {advance.error && <p role="alert" className="text-danger">{advance.error.message}</p>}
        </>
      )}

      {canSubmitScore(summary) && <ScoreSheetForm simulationId={id} />}
      {summary.myScoreDone && summary.status !== 'concluido' && <p role="status" className="text-muted">Ficha enviada. Falta a ficha da outra pessoa.</p>}
      {summary.mode === 'treino' && summary.status !== 'concluido' && (
        <p className="text-sm text-muted">Treino ainda não conta na média oficial: só depois da nota do mentor.</p>
      )}

      {summary.status === 'concluido' && official && student && mentor && (
        <section aria-labelledby="oficial" className="flex flex-col gap-3">
          <h2 id="oficial" className="font-display text-2xl font-black">Nota oficial</h2>
          <p className="font-display text-5xl font-black tabular-nums text-brand">{official.total.toFixed(1)} <span className="text-xl text-muted">de 30</span></p>
          <table className="w-full text-left">
            <thead><tr className="text-sm text-muted"><th scope="col">Critério</th><th scope="col">Aluna</th><th scope="col">Mentor</th><th scope="col">Oficial</th></tr></thead>
            <tbody>
              {CRITERIA.map((c) => (
                <tr key={c} className="border-t border-edge">
                  <th scope="row" className="py-2 font-normal">{CRITERIA_LABELS[c].label}</th>
                  <td className="tabular-nums">{student.scores[c]}</td>
                  <td className="tabular-nums">{mentor.scores[c]}</td>
                  <td className="font-bold tabular-nums">{official.byCriterion[c].toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {[['Aluna', student], ['Mentor', mentor]].map(([who, s]) => (
            <Card key={who as string} className="flex flex-col gap-1">
              <h3 className="font-bold">{who as string}</h3>
              {(s as typeof student).good && <p><span className="font-bold text-muted">Foi bom:</span> {(s as typeof student).good}</p>}
              {(s as typeof student).improve && <p><span className="font-bold text-muted">Melhorar:</span> {(s as typeof student).improve}</p>}
            </Card>
          ))}
        </section>
      )}
    </main>
  )
}
