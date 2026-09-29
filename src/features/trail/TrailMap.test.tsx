import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { NODES } from '@/content/trail'
import { mutationOf, nodeStatesOf } from '@/test/progressMocks'

vi.mock('@/features/progress/hooks', () => ({ useNodeStates: vi.fn(), useToggleItem: vi.fn(), useSetOverride: vi.fn() }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))

import { useNodeStates, useSetOverride, useToggleItem } from '@/features/progress/hooks'
import { useAuth } from '@/features/auth/AuthProvider'
import { TrailMap } from './TrailMap'

const toggle = vi.fn()
const setOverride = vi.fn()
const W01 = NODES.find((n) => n.id === 'w01')!.items.map((i) => i.id)

function asRole(role: 'aluna' | 'mentor') {
  vi.mocked(useAuth).mockReturnValue({
    session: null, loading: false, signOut: vi.fn(),
    profile: { id: role, role, name: role === 'mentor' ? 'Allan' : 'Ana' },
  })
}

function renderMap() {
  return render(
    <MemoryRouter initialEntries={['/trilha']}>
      <Routes>
        <Route path="/trilha" element={<TrailMap />} />
        <Route path="/trilha/:nodeId" element={<p>Semana aberta</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  toggle.mockReset()
  setOverride.mockReset()
  vi.mocked(useToggleItem).mockReturnValue(mutationOf(toggle))
  vi.mocked(useSetOverride).mockReturnValue(mutationOf(setOverride))
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf())
  asRole('aluna')
})

test('trilha nova: fases agrupadas, semana 1 disponível e semana 2 bloqueada', () => {
  renderMap()
  expect(screen.getByRole('heading', { name: 'Fase 1: Comunicação' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Fase 4: Avançado' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Semana 1, disponível' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Semana 2, bloqueada' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Negociação, bloqueada' })).toBeDisabled()
})

test('semana concluída libera a próxima, que abre a tela da semana', async () => {
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf(W01))
  renderMap()
  expect(screen.getByRole('button', { name: 'Semana 1, concluída' })).toBeEnabled()
  await userEvent.click(screen.getByRole('button', { name: 'Semana 2, disponível' }))
  expect(screen.getByText('Semana aberta')).toBeInTheDocument()
})

test('baú da fase marca item manual e trava o automático', async () => {
  renderMap()
  await userEvent.click(screen.getByRole('button', { name: 'Baú da Fase 1, 0 de 5 itens' }))
  expect(screen.getByRole('checkbox', { name: 'Assistiu aos 6 vídeos da fase (automático)' })).toBeDisabled()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Completou os 4 degraus da escada do medo' }))
  expect(toggle).toHaveBeenCalledWith({ itemId: 'f1.gate.2', done: true })
})

test('item automático gravado à mão não aparece marcado no baú', async () => {
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf(['f1.gate.1']))
  renderMap()
  await userEvent.click(screen.getByRole('button', { name: 'Baú da Fase 1, 0 de 5 itens' }))
  expect(screen.getByRole('checkbox', { name: 'Assistiu aos 6 vídeos da fase (automático)' })).not.toBeChecked()
})

test('mentor vê quem liberou e pode bloquear', async () => {
  asRole('mentor')
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf([], [{ nodeId: 'w03', state: 'unlocked', byName: 'Allan', at: '2026-09-29T15:00:00Z' }]))
  renderMap()
  expect(screen.getByRole('button', { name: 'Semana 3, disponível' })).toBeEnabled()
  await userEvent.click(screen.getByRole('button', { name: 'Ajustar Semana 3' }))
  expect(screen.getByText('Liberada por Allan em 29/09, 12:00')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Bloquear' }))
  expect(setOverride).toHaveBeenCalledWith({ nodeId: 'w03', state: 'locked' })
  await userEvent.click(screen.getByRole('button', { name: 'Voltar ao automático' }))
  expect(setOverride).toHaveBeenCalledWith({ nodeId: 'w03', state: null })
})

test('aluna não vê os controles do mentor', () => {
  renderMap()
  expect(screen.queryByRole('button', { name: /^Ajustar/ })).not.toBeInTheDocument()
})

test('Fase 4 explica a escolha de 1 tema por mês', () => {
  renderMap()
  expect(screen.getByText(/Escolha 1 por mês/)).toBeInTheDocument()
})

test('mostra carregamento e erro legível', () => {
  vi.mocked(useNodeStates).mockReturnValue({ data: undefined, isLoading: true, error: null })
  const { unmount } = renderMap()
  expect(screen.getByRole('status')).toHaveTextContent('Carregando a trilha')
  unmount()
  vi.mocked(useNodeStates).mockReturnValue({ data: undefined, isLoading: false, error: new Error('rede') })
  renderMap()
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar a trilha')
})
