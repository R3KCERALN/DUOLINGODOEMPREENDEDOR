import { act, renderHook } from '@testing-library/react'
import { useAutosave } from './useAutosave'
import { useDebounced } from './useDebounced'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

const setup = (initial: string, save = vi.fn().mockResolvedValue(undefined)) => {
  const hook = renderHook(({ v }) => useAutosave({ value: v, save }), { initialProps: { v: initial } })
  return { ...hook, save }
}

test('não salva o valor inicial', () => {
  const { save } = setup('a')
  act(() => { vi.advanceTimersByTime(5000) })
  expect(save).not.toHaveBeenCalled()
})

test('salva 1 s depois da última alteração e mostra "salvo" (RF-54)', async () => {
  const { result, rerender, save } = setup('a')
  rerender({ v: 'ab' })
  act(() => { vi.advanceTimersByTime(600) })
  rerender({ v: 'abc' })
  act(() => { vi.advanceTimersByTime(900) })
  expect(save).not.toHaveBeenCalled()
  await act(async () => { vi.advanceTimersByTime(200) })
  expect(save).toHaveBeenCalledTimes(1)
  expect(save).toHaveBeenCalledWith('abc')
  expect(result.current.status).toBe('saved')
})

test('mudança durante um salvamento em andamento espera a vez e salva o valor mais novo', async () => {
  let release: () => void = () => {}
  const save = vi.fn().mockImplementationOnce(() => new Promise<void>((r) => { release = r })).mockResolvedValue(undefined)
  const { result, rerender } = setup('a', save)
  rerender({ v: 'b' })
  await act(async () => { vi.advanceTimersByTime(1000) })
  expect(save).toHaveBeenCalledTimes(1)
  rerender({ v: 'c' })
  await act(async () => { vi.advanceTimersByTime(1000) })
  expect(save).toHaveBeenCalledTimes(1) // ainda esperando a primeira resposta
  await act(async () => { release() })
  expect(save.mock.calls.map((c) => c[0])).toEqual(['b', 'c'])
  expect(result.current.status).toBe('saved')
})

test('erro é informado e o próximo ajuste tenta de novo', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('sem rede')).mockResolvedValue(undefined)
  const { result, rerender } = setup('a', save)
  rerender({ v: 'b' })
  await act(async () => { vi.advanceTimersByTime(1000) })
  expect(result.current.status).toBe('error')
  expect(result.current.error).toBe('sem rede')
  rerender({ v: 'bc' })
  await act(async () => { vi.advanceTimersByTime(1000) })
  expect(result.current.status).toBe('saved')
})

test('sair da tela com alteração pendente salva na hora (Review Focus 3)', async () => {
  const { rerender, unmount, save } = setup('a')
  rerender({ v: 'novo texto' })
  unmount()
  await act(async () => { await Promise.resolve() })
  expect(save).toHaveBeenCalledWith('novo texto')
})

test('flush salva sem esperar o tempo', async () => {
  const { result, rerender, save } = setup('a')
  rerender({ v: 'b' })
  await act(async () => { await result.current.flush() })
  expect(save).toHaveBeenCalledWith('b')
})

test('useDebounced só assenta depois da pausa', () => {
  const { result, rerender } = renderHook(({ v }) => useDebounced(v, 300), { initialProps: { v: 'a' } })
  rerender({ v: 'ab' })
  expect(result.current).toBe('a')
  act(() => { vi.advanceTimersByTime(300) })
  expect(result.current).toBe('ab')
})
