import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { UpdatePrompt } from './UpdatePrompt'

vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW: vi.fn() }))

const update = vi.fn()
const setNeedRefresh = vi.fn()
function mockSW(needRefresh: boolean) {
  vi.mocked(useRegisterSW).mockReturnValue({
    needRefresh: [needRefresh, setNeedRefresh], offlineReady: [false, vi.fn()], updateServiceWorker: update,
  } as never)
}
beforeEach(() => { vi.clearAllMocks() })

test('registra o service worker e, sem versão nova, não mostra nada', () => {
  mockSW(false)
  render(<UpdatePrompt />)
  expect(useRegisterSW).toHaveBeenCalledWith({ immediate: true })
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('versão nova: nada recarrega sozinho; só "Atualizar" troca (Review Focus 1)', async () => {
  mockSW(true)
  render(<UpdatePrompt />)
  expect(screen.getByRole('status')).toHaveTextContent('Nova versão do app disponível.')
  expect(update).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
  expect(update).toHaveBeenCalledWith(true)
})

test('"Depois" esconde o aviso sem atualizar', async () => {
  mockSW(true)
  render(<UpdatePrompt />)
  await userEvent.click(screen.getByRole('button', { name: 'Depois' }))
  expect(setNeedRefresh).toHaveBeenCalledWith(false)
  expect(update).not.toHaveBeenCalled()
})
