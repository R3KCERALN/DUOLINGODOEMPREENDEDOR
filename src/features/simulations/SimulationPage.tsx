import { useLocation, useNavigate, useParams } from 'react-router'
import { SimulationDetail } from './SimulationDetail'
import { usePendingRecordings, useSimulation } from './hooks'
import { SoloTraining } from './SoloTraining'
import type { TrainingPlan } from './types'

/**
 * `/simulados/:id`. Logo depois de sortear, a aluna chega com o plano das cartas no estado da rota e cai no treino;
 * em qualquer outro caso (inclusive recarregar a página no meio do treino) mostra o detalhe do simulado.
 */
export function SimulationPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const detail = useSimulation(id)
  usePendingRecordings() // reenvia a gravação guardada quando a rede volta, mesmo fora da lista de simulados
  const plan = (location.state as { plan?: TrainingPlan } | null)?.plan
  const data = detail.data

  if (plan && data && data.summary.mode === 'treino' && data.summary.status === 'em_andamento' && data.scenario) {
    const cards = data.cards.map((c) => ({ position: c.position, kind: c.kind, refId: c.refId, text: c.text, atSec: plan.cardTimes[c.position] ?? 0 }))
    return (
      <SoloTraining simulationId={id} scenario={data.scenario} cards={cards} durationSec={plan.durationSec}
        onDone={() => navigate(`/simulados/${id}`, { replace: true })} />
    )
  }
  return <SimulationDetail />
}
