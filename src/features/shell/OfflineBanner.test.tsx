import { act, render, screen } from '@testing-library/react'
import { OfflineBanner } from './OfflineBanner'

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true })
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}
afterEach(() => { Reflect.deleteProperty(navigator, 'onLine') })

test('com internet, nada aparece', () => {
  setOnline(true)
  render(<OfflineBanner />)
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('a conexão cai e volta: o aviso aparece e some', () => {
  setOnline(true)
  render(<OfflineBanner />)
  act(() => setOnline(false))
  expect(screen.getByRole('status')).toHaveTextContent('Sem internet. O treino e a gravação continuam')
  act(() => setOnline(true))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
