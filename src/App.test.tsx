import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from './App'

test('renderiza a tela de login para visitante', () => {
  render(<MemoryRouter initialEntries={['/login']}><AppRoutes /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
})
