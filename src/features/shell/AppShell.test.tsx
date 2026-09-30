import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AppShell } from './AppShell'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<h1>Tela hoje</h1>} />
          <Route path="trilha" element={<h1>Tela trilha</h1>} />
          <Route path="trilha/:nodeId" element={<h1>Tela semana</h1>} />
          <Route path="simulados/:id" element={<h1>Tela simulado</h1>} />
          <Route path="caderno/notas" element={<h1>Tela notas</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

test('mostra a tela atual e a navegação com a aba ativa', () => {
  renderAt('/')
  expect(screen.getByRole('heading', { name: 'Tela hoje' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page')
})

test('aba Trilha continua ativa dentro de uma semana', () => {
  renderAt('/trilha/w05')
  expect(screen.getByRole('heading', { name: 'Tela semana' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Trilha' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Hoje' })).not.toHaveAttribute('aria-current')
})

test('aba Simulados continua ativa dentro de um simulado', () => {
  renderAt('/simulados/abc')
  expect(screen.getByRole('link', { name: 'Simulados' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Trilha' })).not.toHaveAttribute('aria-current')
})

test('aba Caderno continua ativa dentro das notas', () => {
  renderAt('/caderno/notas')
  expect(screen.getByRole('link', { name: 'Caderno' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Simulados' })).not.toHaveAttribute('aria-current')
})
