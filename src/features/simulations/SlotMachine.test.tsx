import { act, render, screen } from '@testing-library/react'
import { SlotMachine, type SlotResult } from './SlotMachine'

const faces: [string[], string[], string[], string[]] = [['Captura de lead', 'Agendamento'], ['Apressado', 'Grosso'], ['Plano de internet', 'Academia'], ['Tá caro', 'Vou pensar']]
const result: SlotResult = { objective: 'Objeção de preço', profile: 'Desconfiado', product: 'Seguro de carro', complications: ['Sócio/cônjuge', 'Interrupção'] }

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

test('antes do primeiro giro mostra interrogações', () => {
  render(<SlotMachine faces={faces} result={null} spinId={0} reducedMotion={false} />)
  expect(screen.getAllByText('?')).toHaveLength(4)
})

test('os rolos param em sequência, da esquerda para a direita, e avisa no fim (RF-70)', () => {
  const onSettled = vi.fn()
  render(<SlotMachine faces={faces} result={result} spinId={1} onSettled={onSettled} reducedMotion={false} />)
  expect(screen.queryByText('Objeção de preço')).not.toBeInTheDocument()
  act(() => { vi.advanceTimersByTime(750) })
  expect(screen.getByText('Objeção de preço')).toBeInTheDocument()
  expect(screen.queryByText('Desconfiado')).not.toBeInTheDocument()
  act(() => { vi.advanceTimersByTime(500) })
  expect(screen.getByText('Desconfiado')).toBeInTheDocument()
  expect(onSettled).not.toHaveBeenCalled()
  act(() => { vi.advanceTimersByTime(1100) })
  expect(screen.getByText('Seguro de carro')).toBeInTheDocument()
  expect(screen.getByText('Sócio/cônjuge')).toBeInTheDocument()
  expect(screen.getByText('Interrupção')).toBeInTheDocument()
  expect(onSettled).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('status')).toHaveTextContent('Sorteio: Objeção de preço')
})

test('reduced motion: mostra o resultado na hora, sem animação (RF-74)', () => {
  const onSettled = vi.fn()
  render(<SlotMachine faces={faces} result={result} spinId={1} onSettled={onSettled} reducedMotion />)
  expect(screen.getByText('Objeção de preço')).toBeInTheDocument()
  expect(screen.getByText('Interrupção')).toBeInTheDocument()
  expect(onSettled).toHaveBeenCalledTimes(1)
})

test('"girar de novo" reinicia a animação com o novo resultado (RF-73)', () => {
  const { rerender } = render(<SlotMachine faces={faces} result={result} spinId={1} reducedMotion={false} />)
  act(() => { vi.advanceTimersByTime(3000) })
  expect(screen.getByText('Objeção de preço')).toBeInTheDocument()
  rerender(<SlotMachine faces={faces} result={{ ...result, objective: 'Pós-venda' }} spinId={2} reducedMotion={false} />)
  expect(screen.queryByText('Pós-venda')).not.toBeInTheDocument()
  act(() => { vi.advanceTimersByTime(3000) })
  expect(screen.getByText('Pós-venda')).toBeInTheDocument()
})

test('desmontar no meio do giro não dispara onSettled', () => {
  const onSettled = vi.fn()
  const { unmount } = render(<SlotMachine faces={faces} result={result} spinId={1} onSettled={onSettled} reducedMotion={false} />)
  unmount()
  act(() => { vi.advanceTimersByTime(5000) })
  expect(onSettled).not.toHaveBeenCalled()
})
