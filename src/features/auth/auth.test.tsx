import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'

const { signInWithOtp, getSession, from } = vi.hoisted(() => ({
  signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
  getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  from: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp,
      getSession,
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
    },
    from,
  },
}))

import { AuthProvider } from './AuthProvider'
import { RequireAuth } from './RequireAuth'
import { LoginScreen } from './LoginScreen'

test('envia magic link sem criar usuário', async () => {
  render(<MemoryRouter><AuthProvider><LoginScreen /></AuthProvider></MemoryRouter>)
  await userEvent.type(screen.getByLabelText(/e-mail/i), 'ela@exemplo.com')
  await userEvent.click(screen.getByRole('button', { name: /enviar link/i }))
  expect(signInWithOtp).toHaveBeenCalledWith({
    email: 'ela@exemplo.com',
    options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
  })
  expect(await screen.findByText(/confira seu e-mail/i)).toBeInTheDocument()
})

test('rota protegida manda visitante para /login', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>tela de login</p>} />
          <Route path="/" element={<RequireAuth><p>privado</p></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
  expect(await screen.findByText('tela de login')).toBeInTheDocument()
})

test('sessão sem perfil não abre rota privada', async () => {
  getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'sem-perfil' } } } })
  from.mockReturnValueOnce({
    select: () => ({ eq: () => ({ single: async () => ({ data: null, error: new Error('perfil ausente') }) }) }),
  })
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RequireAuth><p>privado</p></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível verificar seu acesso')
  expect(screen.queryByText('privado')).not.toBeInTheDocument()
})
