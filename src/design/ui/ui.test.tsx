import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Button, Checkbox, TextArea, PathNode, ProgressBar, BottomNav } from '.'

test('Button loading fica desabilitado e anuncia carregamento', () => {
  render(<Button loading>Salvar</Button>)
  const b = screen.getByRole('button', { name: /salvar/i })
  expect(b).toBeDisabled()
  expect(b).toHaveAttribute('aria-busy', 'true')
})

test('Button bloqueia clique duplo enquanto loading', async () => {
  const fn = vi.fn()
  render(<Button loading onClick={fn}>Enviar</Button>)
  await userEvent.click(screen.getByRole('button'))
  expect(fn).not.toHaveBeenCalled()
})

test('Checkbox alterna e é acessível por teclado', async () => {
  const fn = vi.fn()
  render(<Checkbox checked={false} onChange={fn} label="Assistiu ao vídeo" />)
  const cb = screen.getByRole('checkbox', { name: 'Assistiu ao vídeo' })
  cb.focus()
  await userEvent.keyboard(' ')
  expect(fn).toHaveBeenCalledWith(true)
})

test('TextArea mostra contador e estado insuficiente', async () => {
  const Wrapper = () => {
    const [v, setV] = React.useState('')
    return <TextArea label="1 coisa que aprendi" value={v} onChange={setV} minChars={15} />
  }
  render(<Wrapper />)
  await userEvent.type(screen.getByLabelText('1 coisa que aprendi'), 'curto')
  expect(screen.getByText('5/15')).toBeInTheDocument()
  expect(screen.getByLabelText('1 coisa que aprendi')).toHaveAttribute('aria-invalid', 'true')
})

test('PathNode bloqueado não é clicável e anuncia o estado', async () => {
  const fn = vi.fn()
  render(<PathNode state="locked" phase="f1" label="Semana 2" onClick={fn} />)
  const b = screen.getByRole('button', { name: /semana 2.*bloqueada/i })
  expect(b).toBeDisabled()
  await userEvent.click(b)
  expect(fn).not.toHaveBeenCalled()
})

test('PathNode disponível e concluído', () => {
  render(<><PathNode state="available" phase="f2" label="Semana 5" /><PathNode state="done" phase="f2" label="Semana 4" /></>)
  expect(screen.getByRole('button', { name: /semana 5.*disponível/i })).toBeEnabled()
  expect(screen.getByRole('button', { name: /semana 4.*concluída/i })).toBeEnabled()
})

test('ProgressBar expõe valor', () => {
  render(<ProgressBar value={0.4} label="Fase 1" />)
  expect(screen.getByRole('progressbar', { name: 'Fase 1' })).toHaveAttribute('aria-valuenow', '40')
})

test('BottomNav marca a aba atual', () => {
  render(
    <MemoryRouter initialEntries={['/trilha']}>
      <BottomNav items={[{ to: '/', label: 'Hoje', icon: null }, { to: '/trilha', label: 'Trilha', icon: null }]} />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link', { name: 'Trilha' })).toHaveAttribute('aria-current', 'page')
})
