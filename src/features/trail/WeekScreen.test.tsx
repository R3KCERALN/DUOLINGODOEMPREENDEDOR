import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { NODES } from '@/content/trail'
import { mutationOf, nodeStatesOf, progressOf } from '@/test/progressMocks'

vi.mock('@/features/progress/hooks', () => ({ useProgress: vi.fn(), useNodeStates: vi.fn(), useToggleItem: vi.fn() }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))

import { useNodeStates, useProgress, useToggleItem } from '@/features/progress/hooks'
import { useAuth } from '@/features/auth/AuthProvider'
import { WeekScreen } from './WeekScreen'

const toggle = vi.fn()
const W01 = NODES.find((n) => n.id === 'w01')!.items.map((i) => i.id)

function asRole(role: 'aluna' | 'mentor') {
  vi.mocked(useAuth).mockReturnValue({ session: null, loading: false, signOut: vi.fn(), profile: { id: role, role, name: role } })
}
function withDone(done: string[]) {
  vi.mocked(useProgress).mockReturnValue(progressOf(done))
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf(done))
}
function renderWeek(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/trilha/${id}`]}>
      <Routes><Route path="/trilha/:nodeId" element={<WeekScreen />} /></Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  toggle.mockReset()
  vi.mocked(useToggleItem).mockReturnValue(mutationOf(toggle))
  withDone([])
  asRole('aluna')
})

test('mostra tema, vídeos embutidos sem cookies e o degrau do medo (RF-20, RF-21)', () => {
  renderWeek('w01')
  expect(screen.getByRole('heading', { level: 1, name: 'Semana 1' })).toBeInTheDocument()
  expect(screen.getByText('Perder o medo de falar')).toBeInTheDocument()
  const player = screen.getByTitle('Vença o medo de falar em público — Reinaldo Polito')
  expect(player).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/ywJw8hjzTig')
  expect(screen.getByRole('heading', { name: 'Degrau da escada do medo' })).toBeInTheDocument()
})

test('marcar vídeo como assistido grava o item', async () => {
  renderWeek('w01')
  await userEvent.click(screen.getByRole('checkbox', { name: 'Assisti: Vença o medo de falar em público — Reinaldo Polito' }))
  expect(toggle).toHaveBeenCalledWith({ itemId: 'w01.video.1', done: true })
})

test('leitura aponta para o livro na Biblioteca e há atalho de nota (RF-22, RF-23)', () => {
  renderWeek('w01')
  expect(screen.getByRole('link', { name: 'Abrir na Biblioteca' })).toHaveAttribute('href', '/biblioteca/carnegie')
  expect(screen.getByRole('link', { name: 'Criar nota sobre esta semana' })).toHaveAttribute('href', '/caderno/notas/nova?semana=w01')
})

test('mostra o progresso dos obrigatórios e a conclusão da semana', () => {
  withDone(W01)
  renderWeek('w01')
  expect(screen.getByRole('progressbar', { name: 'Itens obrigatórios da semana' })).toHaveAttribute('aria-valuenow', '100')
  expect(screen.getByRole('status')).toHaveTextContent('Semana concluída. A semana seguinte já está liberada.')
  expect(screen.getByRole('link', { name: 'Ver a trilha' })).toHaveAttribute('href', '/trilha')
})

test('última semana da fase lembra do baú', () => {
  const f1 = NODES.filter((n) => n.phase === 'f1').flatMap((n) => n.items.map((i) => i.id))
  withDone(f1)
  renderWeek('w04')
  expect(screen.getByRole('status')).toHaveTextContent('Complete o baú da fase')
})

test('semana bloqueada aberta por URL não mostra itens para a aluna', () => {
  renderWeek('w09')
  expect(screen.getByRole('status')).toHaveTextContent('Esta etapa ainda está bloqueada')
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
})

test('mentor vê semana bloqueada com aviso', () => {
  asRole('mentor')
  renderWeek('w09')
  expect(screen.getByText('Bloqueada para a aluna')).toBeInTheDocument()
  expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0)
})

test('id desconhecido mostra mensagem e caminho de volta', () => {
  renderWeek('w99')
  expect(screen.getByRole('alert')).toHaveTextContent('Semana não encontrada.')
  expect(screen.getByRole('link', { name: 'Voltar para a trilha' })).toBeInTheDocument()
})

test('erro ao desmarcar aparece para a aluna', () => {
  vi.mocked(useToggleItem).mockReturnValue(mutationOf(toggle, new Error('Só quem marcou este item ou o mentor pode desmarcá-lo.')))
  renderWeek('w01')
  expect(screen.getByRole('alert')).toHaveTextContent('Só quem marcou este item ou o mentor pode desmarcá-lo.')
})
