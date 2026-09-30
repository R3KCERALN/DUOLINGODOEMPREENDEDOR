import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const pdfState = vi.hoisted(() => ({ numPages: 10, fail: false }))
vi.mock('react-pdf', async () => {
  const { useEffect } = await import('react')
  return {
    pdfjs: { GlobalWorkerOptions: {} },
    Document: ({ children, onLoadSuccess, onLoadError }: { children: ReactNode; onLoadSuccess: (d: { numPages: number }) => void; onLoadError: () => void }) => {
      useEffect(() => { if (pdfState.fail) onLoadError(); else onLoadSuccess({ numPages: pdfState.numPages }) }, [onLoadSuccess, onLoadError])
      return pdfState.fail ? null : <div data-testid="document">{children}</div>
    },
    Page: ({ pageNumber }: { pageNumber: number }) => <div data-testid="page">página {pageNumber}</div>,
  }
})

import { PdfReader } from './PdfReader'

beforeEach(() => { pdfState.numPages = 10; pdfState.fail = false })

test('abre na última página lida e avisa o total (RF-63)', async () => {
  const onPageChange = vi.fn()
  render(<PdfReader url="https://signed.test/a.pdf" initialPage={4} onPageChange={onPageChange} />)
  expect(await screen.findByText('página 4')).toBeInTheDocument()
  await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(4, 10))
  expect(screen.getByText('de 10')).toBeInTheDocument()
})

test('PDF trocado por um menor: a página salva é ajustada ao novo total (Review Focus 4)', async () => {
  pdfState.numPages = 6
  const onPageChange = vi.fn()
  render(<PdfReader url="u" initialPage={80} onPageChange={onPageChange} />)
  expect(await screen.findByText('página 6')).toBeInTheDocument()
  expect(onPageChange).toHaveBeenLastCalledWith(6, 6)
})

test('próxima e anterior respeitam os limites e avisam a cada troca', async () => {
  const onPageChange = vi.fn()
  render(<PdfReader url="u" initialPage={1} onPageChange={onPageChange} />)
  await screen.findByText('página 1')
  const prev = screen.getByRole('button', { name: 'Página anterior' })
  const next = screen.getByRole('button', { name: 'Próxima página' })
  expect(prev).toBeDisabled()
  await userEvent.click(next)
  expect(screen.getByText('página 2')).toBeInTheDocument()
  expect(onPageChange).toHaveBeenLastCalledWith(2, 10)
  await userEvent.click(prev)
  expect(screen.getByText('página 1')).toBeInTheDocument()
})

test('ir direto para uma página, com limite no total', async () => {
  render(<PdfReader url="u" initialPage={1} />)
  await screen.findByText('página 1')
  const input = screen.getByLabelText('Ir para a página')
  await userEvent.clear(input)
  await userEvent.type(input, '7{Enter}')
  expect(screen.getByText('página 7')).toBeInTheDocument()
  await userEvent.clear(input)
  await userEvent.type(input, '99{Enter}')
  expect(screen.getByText('página 10')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
})

test('falha ao abrir mostra alerta legível', async () => {
  pdfState.fail = true
  render(<PdfReader url="u" initialPage={1} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível abrir o PDF')
})
