import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { asyncMutationOf, queryOf } from '@/test/simulationMocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import * as sim from './hooks'
import { RecordingPlayer } from './RecordingPlayer'
import type { RecordingInfo } from './types'

const rec: RecordingInfo = { filePath: 's1/audio.webm', mime: 'audio/webm', durationSec: 300, sizeBytes: 100, keep: false, deleteAfter: null }
const keepMutate = vi.fn()
const play = vi.fn()

function setup(role: 'aluna' | 'mentor', recording = rec) {
  vi.mocked(sim.useRecordingUrl).mockReturnValue(queryOf('https://signed.test/s1/audio.webm'))
  vi.mocked(sim.useKeepRecording).mockReturnValue({ ...(asyncMutationOf() as object), mutate: keepMutate } as never)
  return render(<RecordingPlayer simulationId="s1" recording={recording} role={role} markers={[{ atSec: 62, label: 'Tá caro' }, { atSec: 130, label: 'Tem nota fiscal?' }]} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  window.HTMLMediaElement.prototype.play = play
})

test('pular para o marcador posiciona o áudio e toca (RF-76f)', async () => {
  const { container } = setup('mentor')
  await userEvent.click(screen.getByRole('button', { name: '1:02 · Tá caro' }))
  const audio = container.querySelector('audio')!
  expect(audio.currentTime).toBe(62)
  expect(play).toHaveBeenCalled()
  expect(audio).toHaveAttribute('src', 'https://signed.test/s1/audio.webm')
})

test('só o mentor vê "Guardar" e ele avisa da retenção (RF-76j)', async () => {
  setup('mentor')
  expect(screen.getByText('Será apagada 30 dias depois da nota do mentor.')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Guardar esta gravação' }))
  expect(keepMutate).toHaveBeenCalledWith({ simulationId: 's1', keep: true })
})

test('aluna não vê "Guardar"; gravação guardada e data de exclusão aparecem no texto', () => {
  setup('aluna', { ...rec, keep: true })
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  expect(screen.getByText('Esta gravação será guardada.')).toBeInTheDocument()
})

test('mostra a data de exclusão quando já agendada', () => {
  setup('aluna', { ...rec, deleteAfter: '2026-10-30T15:00:00Z' })
  expect(screen.getByText('Será apagada em 30/10, 12:00.')).toBeInTheDocument()
})
