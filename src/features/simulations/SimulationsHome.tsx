import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Badge, Button, Card, Checkbox } from '@/design/ui'
import { planCards } from '@/domain/cards'
import { difficultyForPhase, drawScenario, RouletteError, type Difficulty, type Draw, type ReelItem } from '@/domain/roulette'
import { statusLabel } from '@/domain/simulationState'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNodeStates } from '@/features/progress/hooks'
import { DIFFICULTY_LABEL, formatWhen } from './format'
import {
  useAdvanceSimulation, useCreateSimulation, usePendingRecordings, useRecentObjectives, useScenarioBank, useSimulations,
} from './hooks'
import { SlotMachine, type SlotResult } from './SlotMachine'
import type { BankData, TrainingPlan } from './types'

const LEVELS = Object.keys(DIFFICULTY_LABEL) as Difficulty[]

function labelsOf(bank: BankData, d: Draw): SlotResult {
  const label = (id: string) => bank.items.find((i) => i.id === id)?.label ?? id
  return { objective: label(d.objectiveId), profile: label(d.profileId), product: label(d.productId), complications: d.complicationIds.map(label) }
}

/** `/simulados`: roleta (RF-70–74), início do simulado surpresa (mentor) ou do treino (aluna) e histórico. */
export function SimulationsHome() {
  const { profile } = useAuth()
  const role = profile?.role ?? 'aluna'
  const navigate = useNavigate()
  const trail = useNodeStates()
  const bank = useScenarioBank()
  const recent = useRecentObjectives()
  const sims = useSimulations()
  const create = useCreateSimulation()
  const advance = useAdvanceSimulation()
  const { pending } = usePendingRecordings()

  const phase = trail.data?.currentPhase ?? 'f1'
  const [chosen, setChosen] = useState<Difficulty | null>(null) // null = padrão da fase (RF-71)
  const level = chosen ?? difficultyForPhase(phase)
  const [boss, setBoss] = useState(false)
  const [draw, setDraw] = useState<Draw | null>(null)
  const [spinId, setSpinId] = useState(0)
  const [settled, setSettled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items: ReelItem[] = bank.data?.items ?? []
  const faces = ([1, 2, 3, 4] as const).map((reel) => items.filter((i) => i.reel === reel && i.active && !i.isNone).map((i) => i.label)) as [string[], string[], string[], string[]]
  const busy = create.isPending || advance.isPending

  function spin() {
    setError(null)
    setSettled(false)
    try {
      setDraw(drawScenario(items, level, recent.data ?? []))
      setSpinId((n) => n + 1)
    } catch (e) {
      setDraw(null)
      setError(e instanceof RouletteError ? e.message : 'Não foi possível sortear.')
    }
  }

  async function start() {
    if (!draw || !bank.data) return
    const mode = role === 'mentor' ? 'surpresa' : 'treino'
    const durationSec = boss ? 600 : 300
    try {
      const noneIds = new Set(items.filter((i) => i.isNone).map((i) => i.id))
      const challengeIds = bank.data.challenges.filter((c) => c.active).map((c) => c.id)
      const cards = mode === 'treino' ? planCards(draw, challengeIds, level, durationSec, Math.random, noneIds) : []
      const id = await create.mutateAsync({ mode, difficulty: level, phase, isBoss: boss, draw, cards })
      await advance.mutateAsync({ id, to: 'em_andamento' })
      const plan: TrainingPlan = { durationSec, cardTimes: cards.map((c) => c.atSec) }
      navigate(`/simulados/${id}`, { state: mode === 'treino' ? { plan } : undefined })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível iniciar.')
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-6 pb-8">
      <h1 className="font-display text-6xl leading-none font-black text-brand text-glow">Simulados</h1>
      {pending > 0 && (
        <p role="status" className="rounded-card border-2 border-brand bg-surface p-3 font-bold">
          {pending === 1 ? '1 gravação pendente de envio.' : `${pending} gravações pendentes de envio.`} Elas sobem sozinhas quando a conexão voltar.
        </p>
      )}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 font-bold">
            Dificuldade
            <select value={level} onChange={(e) => setChosen(e.target.value as Difficulty)} disabled={busy}
              className="h-12 rounded-control border-2 border-line bg-bg px-3 font-normal focus:border-brand focus:outline-none focus:glow">
              {LEVELS.map((l) => <option key={l} value={l}>{DIFFICULTY_LABEL[l]}</option>)}
            </select>
          </label>
          <Checkbox checked={boss} onChange={setBoss} label="Simulado chefe (10 min)" disabled={busy} />
        </div>

        <SlotMachine faces={faces} result={draw && bank.data ? labelsOf(bank.data, draw) : null} spinId={spinId} onSettled={() => setSettled(true)} />

        {error && <p role="alert" className="text-danger">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={spin} disabled={busy || bank.isLoading || (draw !== null && !settled)}>
            {draw ? 'Girar de novo' : role === 'mentor' ? 'Girar a roleta' : 'Girar para treinar'}
          </Button>
          <Button onClick={start} disabled={!draw || !settled} loading={busy}>
            {role === 'mentor' ? 'Iniciar simulado surpresa' : 'Começar treino'}
          </Button>
        </div>
        {role === 'mentor' && <Link to="/cenarios" className="font-bold text-brand underline">Editar banco de cenários</Link>}
      </Card>

      <section aria-labelledby="hist" className="flex flex-col gap-3">
        <h2 id="hist" className="font-display text-2xl font-black">Histórico</h2>
        {sims.isLoading && <p role="status" className="text-muted">Carregando…</p>}
        {sims.data?.length === 0 && <p className="text-muted">Nenhum simulado ainda.</p>}
        <ul className="flex flex-col gap-2">
          {sims.data?.slice(0, 20).map((s) => (
            <li key={s.id}>
              <Link to={`/simulados/${s.id}`} className="flex items-center justify-between gap-3 rounded-card border border-edge bg-surface p-3">
                <span>
                  <span className="block font-bold">{statusLabel(s.mode, s.status, role)}</span>
                  <span className="text-sm text-muted">{formatWhen(s.createdAt)} · {DIFFICULTY_LABEL[s.difficulty]}{s.isBoss ? ' · chefe' : ''}</span>
                </span>
                {s.official !== null && <Badge tone="brand">{s.official.toFixed(1)} / 30</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
