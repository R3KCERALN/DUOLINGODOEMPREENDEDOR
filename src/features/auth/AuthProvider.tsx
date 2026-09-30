import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type Profile = { id: string; role: 'aluna' | 'mentor'; name: string }
type AuthState = { session: Session | null; profile: Profile | null; loading: boolean; signOut: () => Promise<void> }

const AuthContext = createContext<AuthState | null>(null)

/** Perfil da última sessão, para o app abrir sem internet (PWA). Só vale para a mesma pessoa;
 *  o papel só muda a interface — quem decide o acesso aos dados é o RLS. */
const PROFILE_KEY = 'trilha.profile'

function readCachedProfile(userId: string): Profile | null {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null') as Profile | null
    return p?.id === userId ? p : null
  } catch {
    return null
  }
}

function writeCachedProfile(p: Profile | null) {
  try {
    if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
    else localStorage.removeItem(PROFILE_KEY)
  } catch {
    // aba anônima ou armazenamento cheio: segue sem o modo offline
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setProfile(null); return }
    // Sem internet, o supabase-js tenta de novo por ~7 s antes de desistir: abre já com o perfil guardado.
    const cached = navigator.onLine ? null : readCachedProfile(session.user.id)
    setProfile(cached)
    setLoading(!cached)
    supabase.from('profiles').select('id, role, name').eq('id', session.user.id).single()
      .then(({ data }) => {
        const fresh = data as Profile | null
        if (fresh) writeCachedProfile(fresh)
        setProfile(fresh ?? readCachedProfile(session.user.id))
        setLoading(false)
      })
  }, [session])

  const signOut = async () => { writeCachedProfile(null); await supabase.auth.signOut() }

  return <AuthContext.Provider value={{ session, profile, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
