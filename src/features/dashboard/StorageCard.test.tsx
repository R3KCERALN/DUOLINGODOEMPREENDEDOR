import { render, screen } from '@testing-library/react'
import { storageSummary } from '@/domain/dashboard'
import { StorageCard } from './StorageCard'

test('uso total, barra e separação entre livros e gravações (RNF-11)', () => {
  render(<StorageCard summary={storageSummary([
    { bucket: 'books', bytes: 52_428_800, files: 1 }, { bucket: 'recordings', bytes: 3_145_728, files: 2 },
  ])} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Uso do armazenamento' })).toBeInTheDocument()
  expect(screen.getByText('53,0 MB de 1,0 GB (5%)')).toBeVisible()
  expect(screen.getByRole('progressbar', { name: 'Uso do armazenamento' })).toHaveAttribute('aria-valuenow', '5')
  expect(screen.getByText('Livros: 50,0 MB (1 arquivo)')).toBeVisible()
  expect(screen.getByText('Gravações: 3,0 MB (2 arquivos)')).toBeVisible()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('vazio: zero arquivos, sem aviso', () => {
  render(<StorageCard summary={storageSummary([])} />)
  expect(screen.getByText('0 B de 1,0 GB (0%)')).toBeVisible()
  expect(screen.getByText('Livros: 0 B (0 arquivos)')).toBeVisible()
})

test('a partir de 80% avisa; a partir de 95% é alerta', () => {
  const { rerender } = render(<StorageCard summary={storageSummary([{ bucket: 'books', bytes: Math.round(0.85 * 1024 ** 3), files: 9 }])} />)
  expect(screen.getByRole('status')).toHaveTextContent('Mais de 80% do plano gratuito em uso')
  rerender(<StorageCard summary={storageSummary([{ bucket: 'recordings', bytes: Math.round(0.97 * 1024 ** 3), files: 90 }])} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Quase no limite do plano gratuito')
})
