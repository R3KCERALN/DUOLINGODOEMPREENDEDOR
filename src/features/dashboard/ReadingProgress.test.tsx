import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { bookOf, courseOf } from '@/test/e6Mocks'
import { ReadingProgress } from './ReadingProgress'

test('página atual de cada livro; cursos ficam de fora (RF-97)', () => {
  render(<MemoryRouter><ReadingProgress books={[
    bookOf({ filePath: 'carnegie/1.pdf', progress: { page: 12, totalPages: 200, updatedAt: 'x' } }),
    bookOf({ id: 'gitomer', title: 'O Livro de Ouro', filePath: 'gitomer/1.pdf', progress: null }),
    bookOf({ id: 'outro', title: 'Sem PDF', filePath: null }),
    courseOf(),
  ]} /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 2, name: 'Leitura' })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
  expect(screen.getByRole('link', { name: /Como Fazer Amigos/ })).toHaveAttribute('href', '/biblioteca/carnegie')
  expect(screen.getByText('página 12 de 200')).toBeVisible()
  expect(screen.getByText('ainda não começou')).toBeVisible()
  expect(screen.getByText('PDF ainda não disponível')).toBeVisible()
  expect(screen.queryByText(/Sebrae/)).not.toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Leitura de Como Fazer Amigos e Influenciar Pessoas' })).toHaveAttribute('aria-valuenow', '6')
})

test('página sem total conhecido não vira barra nem NaN', () => {
  render(<MemoryRouter><ReadingProgress books={[bookOf({ filePath: 'c/1.pdf', progress: { page: 7, totalPages: null, updatedAt: 'x' } })]} /></MemoryRouter>)
  expect(screen.getByText('página 7')).toBeVisible()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('sem livros', () => {
  render(<MemoryRouter><ReadingProgress books={[]} /></MemoryRouter>)
  expect(screen.getByText('Nenhum livro na biblioteca.')).toBeVisible()
})
