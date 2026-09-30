import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { detailOf, queryOf, summaryOf } from '@/test/simulationMocks'
import type { TrainingPlan } from './types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')
vi.mock('./SimulationDetail', () => ({ SimulationDetail: () => <p>detalhe</p> }))
vi.mock('./SoloTraining', () => ({
  SoloTraining: (p: { durationSec: number; cards: { atSec: number; text: string }[] }) => <p>treino {p.durationSec} {p.cards.map((c) => `${c.atSec}:${c.text}`).join('|')}</p>,
}))

import * as sim from './hooks'
import { SimulationPage } from './SimulationPage'

const plan: TrainingPlan = { durationSec: 300, cardTimes: [45, 130] }
const cards = [
  { position: 0, kind: 'questionamento' as const, refId: 'card-01', text: 'Pergunta A', shownAtSec: null },
  { position: 1, kind: 'complicacao' as const, refId: 'comp-01', text: 'Fala B', shownAtSec: null },
]
function renderAt(detail: ReturnType<typeof detailOf>, state?: { plan: TrainingPlan }) {
  vi.mocked(sim.useSimulation).mockReturnValue(queryOf(detail))
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/simulados/sim-1', state }]}>
      <Routes><Route path="/simulados/:id" element={<SimulationPage />} /></Routes>
    </MemoryRouter>,
  )
}

test('treino recém-sorteado com plano vai para a tela de treino, cartas nos horários do plano', () => {
  renderAt(detailOf({ summary: summaryOf({ mode: 'treino', status: 'em_andamento' }), cards }), { plan })
  expect(screen.getByText('treino 300 45:Pergunta A|130:Fala B')).toBeInTheDocument()
})

test('sem plano (página recarregada) cai no detalhe em vez de reiniciar o treino', () => {
  renderAt(detailOf({ summary: summaryOf({ mode: 'treino', status: 'em_andamento' }), cards }))
  expect(screen.getByText('detalhe')).toBeInTheDocument()
})

test('com plano mas já encerrado mostra o detalhe', () => {
  renderAt(detailOf({ summary: summaryOf({ mode: 'treino', status: 'aguardando_notas' }), cards }), { plan })
  expect(screen.getByText('detalhe')).toBeInTheDocument()
})
