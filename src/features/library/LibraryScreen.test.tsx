import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { bookOf, courseOf, queryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import * as api from './hooks'
import { LibraryScreen } from './LibraryScreen'

function setup(books = [bookOf(), courseOf()]) {
  vi.mocked(api.useBooks).mockReturnValue(queryOf(books))
  return render(<MemoryRouter><LibraryScreen /></MemoryRouter>)
}

test('lista os materiais com tipo e fase (RF-60)', () => {
  setup()
  expect(screen.getByText('Como Fazer Amigos e Influenciar Pessoas')).toBeInTheDocument()
  expect(screen.getByText('Livro')).toBeInTheDocument()
  expect(screen.getByText('Curso')).toBeInTheDocument()
  expect(screen.getByText('Fase 1')).toBeInTheDocument()
  expect(screen.getByText('Fases 2 e 3')).toBeInTheDocument()
})

test('livro sem PDF mostra "PDF ainda não disponível" (RF-62)', () => {
  setup([bookOf()])
  expect(screen.getByText('PDF ainda não disponível')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ver detalhes' })).toHaveAttribute('href', '/biblioteca/carnegie')
})

test('livro com PDF e progresso oferece continuar na página lida', () => {
  setup([bookOf({ filePath: 'carnegie/1.pdf', progress: { page: 12, totalPages: 200, updatedAt: 'x' } })])
  expect(screen.getByRole('link', { name: 'Continuar na página 12' })).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: /página 12 de 200/ })).toBeInTheDocument()
  expect(screen.queryByText('PDF ainda não disponível')).not.toBeInTheDocument()
})

test('curso abre por link externo em nova aba (RF-64)', () => {
  setup([courseOf()])
  const link = screen.getByRole('link', { name: 'Abrir curso' })
  expect(link).toHaveAttribute('href', 'https://loja.sebrae.com.br/cursos/cursos-online')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})
