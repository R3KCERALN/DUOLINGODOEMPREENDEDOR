import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { CadernoLayout } from './CadernoLayout'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/caderno" element={<CadernoLayout />}>
          <Route index element={<p>tela do dia</p>} />
          <Route path="dia/:date" element={<p>tela de outro dia</p>} />
          <Route path="notas" element={<p>tela de notas</p>} />
          <Route path="notas/:id" element={<p>tela de uma nota</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

test('abas com a atual destacada', () => {
  renderAt('/caderno')
  expect(screen.getByRole('heading', { level: 1, name: 'Caderno' })).toBeInTheDocument()
  expect(screen.getByText('tela do dia')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Dia' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Notas' })).not.toHaveAttribute('aria-current')
  expect(screen.getByRole('link', { name: 'Biblioteca' })).toHaveAttribute('href', '/biblioteca')
})

test('a aba Notas continua ativa dentro de uma nota; Dia não', () => {
  renderAt('/caderno/notas/n1')
  expect(screen.getByText('tela de uma nota')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Notas' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Dia' })).not.toHaveAttribute('aria-current')
})

test('um dia de outra data continua na aba Dia', () => {
  renderAt('/caderno/dia/2026-09-28')
  expect(screen.getByText('tela de outro dia')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Dia' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Notas' })).not.toHaveAttribute('aria-current')
})
