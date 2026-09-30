import { act, fireEvent, render, screen } from '@testing-library/react'
import { asyncMutationOf, entryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import { JournalForm } from './JournalForm'
import * as api from './hooks'

const saveAsync = vi.fn()

function setup(date: string, initial = undefined as ReturnType<typeof entryOf> | undefined, saved?: ReturnType<typeof entryOf>) {
  saveAsync.mockResolvedValue(saved ?? entryOf({ date }))
  vi.mocked(api.useSaveJournalEntry).mockReturnValue({ ...(asyncMutationOf(saveAsync) as object), data: saved } as never)
  return render(<JournalForm date={date} initial={initial} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-29T15:00:00Z')) // 12:00 em SP
})
afterEach(() => vi.useRealTimers())

test('três campos com contador de 15 caracteres e o dia pendente (RF-50)', () => {
  setup('2026-09-29')
  expect(screen.getByLabelText('Uma coisa que aprendi')).toBeInTheDocument()
  expect(screen.getByLabelText('Uma coisa que pratiquei')).toBeInTheDocument()
  expect(screen.getByLabelText('Uma coisa para amanhã')).toBeInTheDocument()
  expect(screen.getByText('Pendente')).toBeInTheDocument()
  expect(screen.getByText(/3 campos de pelo menos 15 caracteres/)).toBeInTheDocument()
})

test('digitar salva sozinho depois de 1 s e mostra "Salvo" (RF-54)', async () => {
  setup('2026-09-29')
  fireEvent.change(screen.getByLabelText('Uma coisa que aprendi'), { target: { value: 'aprendi a ouvir o cliente' } })
  expect(saveAsync).not.toHaveBeenCalled()
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveAsync).toHaveBeenCalledWith({ date: '2026-09-29', learned: 'aprendi a ouvir o cliente', practiced: '', tomorrow: '' })
  expect(screen.getByText('Salvo')).toBeInTheDocument()
})

test('a marca "Completo" vem do banco, não do navegador', () => {
  setup('2026-09-29', entryOf({ date: '2026-09-29', complete: false }), entryOf({ date: '2026-09-29', complete: true }))
  expect(screen.getByText('Completo')).toBeInTheDocument()
})

test('ontem antes do meio-dia ainda dá para preencher e vira "com atraso" (RF-50)', () => {
  vi.setSystemTime(new Date('2026-09-30T14:59:00Z')) // 11:59 em SP
  setup('2026-09-29')
  expect(screen.getByText(/ainda pode preencher este dia até 12:00/)).toBeInTheDocument()
  expect(screen.getByLabelText('Uma coisa que aprendi')).toBeEnabled()
})

test('a entrada preenchida com atraso mostra a marca depois de fechar', () => {
  vi.setSystemTime(new Date('2026-10-02T15:00:00Z'))
  setup('2026-09-29', entryOf({ date: '2026-09-29', complete: true, late: true }))
  expect(screen.getByText('Preenchido com atraso')).toBeInTheDocument()
})

test('meio-dia em ponto: o dia fecha e nada é editável nem salvo (Review Focus 1)', async () => {
  vi.setSystemTime(new Date('2026-09-30T15:00:00Z')) // 12:00 em SP
  setup('2026-09-29')
  expect(screen.getByText(/Este dia está fechado/)).toBeInTheDocument()
  expect(screen.getByText('Em falta')).toBeInTheDocument()
  expect(screen.getByLabelText('Uma coisa que aprendi')).toBeDisabled()
  await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
  expect(saveAsync).not.toHaveBeenCalled()
})

test('erro ao salvar aparece como alerta', async () => {
  setup('2026-09-29')
  saveAsync.mockRejectedValue(new Error('O prazo deste dia já passou'))
  fireEvent.change(screen.getByLabelText('Uma coisa que aprendi'), { target: { value: 'aprendi algo novo hoje' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(screen.getByRole('alert')).toHaveTextContent('O prazo deste dia já passou')
})
