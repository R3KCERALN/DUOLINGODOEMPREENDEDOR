import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { queryOf, summaryOf } from '@/test/simulationMocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')

import { useAuth } from '@/features/auth/AuthProvider'
import * as sim from './hooks'
import { ReviewQueue } from './ReviewQueue'

const list = [
  summaryOf({ id: 'a', mode: 'treino', status: 'aguardando_notas', hasRecording: true, createdAt: '2026-09-29T15:00:00Z' }),
  summaryOf({ id: 'b', mode: 'treino', status: 'aguardando_notas', myScoreDone: true }),
  summaryOf({ id: 'c', mode: 'surpresa', status: 'aguardando_notas' }),
  summaryOf({ id: 'd', mode: 'treino', status: 'em_andamento' }),
]
function setup(role: 'aluna' | 'mentor', data = list) {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(sim.useSimulations).mockReturnValue(queryOf(data))
  return render(<MemoryRouter><ReviewQueue /></MemoryRouter>)
}

test('lista só treinos terminados que ainda esperam a nota do mentor', () => {
  setup('mentor')
  const links = screen.getAllByRole('link')
  expect(links).toHaveLength(1)
  expect(links[0]).toHaveAttribute('href', '/simulados/a')
  expect(links[0]).toHaveTextContent('29/09, 12:00')
  expect(screen.getByText('Com áudio')).toBeInTheDocument()
})

test('fila vazia mostra a mensagem', () => {
  setup('mentor', [])
  expect(screen.getByText('Nenhum treino esperando a sua nota.')).toBeInTheDocument()
})

test('a aluna não vê a fila', () => {
  const { container } = setup('aluna')
  expect(container).toBeEmptyDOMElement()
})
