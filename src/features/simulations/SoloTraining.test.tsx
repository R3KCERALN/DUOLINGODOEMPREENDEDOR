import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { asyncMutationOf, scenarioOf } from '@/test/simulationMocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')
vi.mock('./useTrainingSession')

import * as sim from './hooks'
import { SoloTraining } from './SoloTraining'
import { useTrainingSession, type TrainingCard, type TrainingSession } from './useTrainingSession'

const card: TrainingCard = { position: 0, kind: 'complicacao', refId: 'comp-01', text: 'Olha, achei caro.', atSec: 40 }
const recording = { blob: new Blob(['a']), mime: 'audio/webm', durationSec: 300 }
const uploadAsync = vi.fn()
const advanceAsync = vi.fn()
const shownMutate = vi.fn()

function session(over: Partial<TrainingSession> = {}): TrainingSession {
  return {
    phase: 'ready', elapsedSec: 0, remainingSec: 300, currentCard: null, shownCards: [], error: null,
    start: vi.fn(), dismissCard: vi.fn(), finish: vi.fn().mockResolvedValue(recording), ...over,
  }
}
function setup(s: TrainingSession, onDone = vi.fn()) {
  vi.mocked(useTrainingSession).mockReturnValue(s)
  vi.mocked(sim.useRecordCardShown).mockReturnValue({ mutate: shownMutate } as never)
  vi.mocked(sim.useUploadRecording).mockReturnValue(asyncMutationOf(uploadAsync))
  vi.mocked(sim.useAdvanceSimulation).mockReturnValue(asyncMutationOf(advanceAsync))
  render(<SoloTraining simulationId="s1" scenario={scenarioOf()} cards={[card]} durationSec={300} onDone={onDone} />)
  return onDone
}

beforeEach(() => { vi.clearAllMocks(); uploadAsync.mockResolvedValue('uploaded'); advanceAsync.mockResolvedValue(undefined) })

test('antes de começar mostra só objetivo, meta, perfil e produto; complicações ficam ocultas (RF-76a)', () => {
  setup(session())
  expect(screen.getByText('Objeção de preço')).toBeInTheDocument()
  expect(screen.getByText(/Reancorar valor/)).toBeInTheDocument()
  expect(screen.getByText('Apressado')).toBeInTheDocument()
  expect(screen.getByText('Plano de internet')).toBeInTheDocument()
  expect(screen.queryByText('Tá caro')).not.toBeInTheDocument()
  expect(screen.queryByText(/achei caro/)).not.toBeInTheDocument()
})

test('"Começar" inicia a sessão e erro de microfone aparece como alerta', async () => {
  const start = vi.fn()
  setup(session({ start, error: 'Não foi possível usar o microfone.' }))
  await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
  expect(start).toHaveBeenCalled()
  expect(screen.getByRole('alert')).toHaveTextContent('microfone')
})

test('gravando: cronômetro, carta em texto e "Respondi"', async () => {
  const dismissCard = vi.fn()
  setup(session({ phase: 'recording', remainingSec: 245, currentCard: card, dismissCard }))
  expect(screen.getByRole('timer')).toHaveTextContent('4:05')
  expect(screen.getByRole('region', { name: 'Carta do cliente' })).toHaveTextContent('Olha, achei caro.')
  await userEvent.click(screen.getByRole('button', { name: 'Respondi' }))
  expect(dismissCard).toHaveBeenCalled()
})

test('"Encerrar treino" pede o fim da sessão', async () => {
  const finish = vi.fn().mockResolvedValue(recording)
  setup(session({ phase: 'recording', finish }))
  await userEvent.click(screen.getByRole('button', { name: 'Encerrar treino' }))
  expect(finish).toHaveBeenCalled()
})

test('ao terminar: envia o áudio, avança para "aguardando notas" e avisa (RF-76g)', async () => {
  const onDone = setup(session({ phase: 'finished' }))
  await waitFor(() => expect(onDone).toHaveBeenCalledWith('uploaded'))
  expect(uploadAsync).toHaveBeenCalledWith({ simulationId: 's1', blob: recording.blob, mime: 'audio/webm', durationSec: 300 })
  expect(advanceAsync).toHaveBeenCalledWith({ id: 's1', to: 'aguardando_notas' })
})

test('gravação guardada no aparelho também segue para a ficha', async () => {
  uploadAsync.mockResolvedValue('queued')
  const onDone = setup(session({ phase: 'finished' }))
  await waitFor(() => expect(onDone).toHaveBeenCalledWith('queued'))
})

test('falha ao salvar mostra erro e permite tentar de novo', async () => {
  advanceAsync.mockRejectedValueOnce(new Error('Você não pode alterar este simulado.'))
  const onDone = setup(session({ phase: 'finished' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Você não pode alterar')
  await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  await waitFor(() => expect(onDone).toHaveBeenCalled())
})

test('cada carta mostrada é registrada com o segundo em que apareceu (RF-76f)', () => {
  setup(session())
  const opts = vi.mocked(useTrainingSession).mock.calls[0][0]
  opts.onCardShown?.(card, 41)
  expect(shownMutate).toHaveBeenCalledWith({ simulationId: 's1', position: 0, atSec: 41 })
})
