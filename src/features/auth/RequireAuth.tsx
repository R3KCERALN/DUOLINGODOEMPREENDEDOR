import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './AuthProvider'

export function RequireAuth({ children, role }: { children: ReactNode; role?: 'aluna' | 'mentor' }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <p className="p-6 text-muted" role="status">Carregando…</p>
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <p className="p-6 text-danger" role="alert">Não foi possível verificar seu acesso. Recarregue a página.</p>
  if (role && profile?.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}
