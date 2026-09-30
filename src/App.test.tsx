import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from './App'
import { AuthProvider } from './features/auth/AuthProvider'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}))

test('renderiza a tela de login para visitante', () => {
  render(<MemoryRouter initialEntries={['/login']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
})

test('rotas da trilha exigem login', async () => {
  render(<MemoryRouter initialEntries={['/trilha/w01']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>)
  expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
})

test('rotas de simulados e de cenários exigem login', async () => {
  for (const path of ['/simulados', '/simulados/abc', '/cenarios']) {
    const { unmount } = render(<MemoryRouter initialEntries={[path]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    unmount()
  }
})

test('rotas do caderno e da biblioteca exigem login', async () => {
  for (const path of ['/caderno', '/caderno/notas/nova', '/caderno/checklists', '/biblioteca', '/biblioteca/carnegie']) {
    const { unmount } = render(<MemoryRouter initialEntries={[path]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    unmount()
  }
})

test('rota do painel exige login', async () => {
  render(<MemoryRouter initialEntries={['/painel']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>)
  expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
})
