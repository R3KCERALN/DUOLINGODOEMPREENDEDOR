import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthProvider'

const single = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ single }) }) })),
  },
}))

const KEY = 'trilha.profile'
const ana = { id: 'u1', role: 'aluna', name: 'Ana' }
const offline = { data: null, error: { message: 'TypeError: Failed to fetch' } }

function Who() {
  const { profile, loading, signOut } = useAuth()
  return (
    <>
      <p>{loading ? 'carregando' : profile ? `${profile.name} (${profile.role})` : 'sem perfil'}</p>
      <button onClick={() => void signOut()}>Sair</button>
    </>
  )
}
const renderIt = () => render(<AuthProvider><Who /></AuthProvider>)

beforeEach(() => { localStorage.clear(); single.mockReset() })

test('online: usa o perfil do banco e guarda para abrir sem internet', async () => {
  single.mockResolvedValue({ data: ana, error: null })
  renderIt()
  expect(await screen.findByText('Ana (aluna)')).toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(ana)
})

test('sem internet: usa o perfil guardado da mesma pessoa', async () => {
  localStorage.setItem(KEY, JSON.stringify(ana))
  single.mockResolvedValue(offline)
  renderIt()
  expect(await screen.findByText('Ana (aluna)')).toBeInTheDocument()
})

test('perfil guardado de outra pessoa não vale', async () => {
  localStorage.setItem(KEY, JSON.stringify({ id: 'outra', role: 'mentor', name: 'X' }))
  single.mockResolvedValue(offline)
  renderIt()
  expect(await screen.findByText('sem perfil')).toBeInTheDocument()
})

test('sair apaga o perfil guardado', async () => {
  localStorage.setItem(KEY, JSON.stringify(ana))
  single.mockResolvedValue({ data: ana, error: null })
  renderIt()
  await screen.findByText('Ana (aluna)')
  await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
  await waitFor(() => expect(localStorage.getItem(KEY)).toBeNull())
})

test('sem internet: abre na hora com o perfil guardado, sem esperar as novas tentativas do banco', async () => {
  localStorage.setItem(KEY, JSON.stringify(ana))
  single.mockReturnValue(new Promise(() => {})) // o supabase-js ainda está tentando de novo
  Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
  try {
    renderIt()
    expect(await screen.findByText('Ana (aluna)')).toBeInTheDocument()
  } finally {
    Reflect.deleteProperty(navigator, 'onLine')
  }
})
