import { supabase } from '@/lib/supabase'

type DbError = { message: string; code?: string }

/** Lança um erro legível: `friendly` mapeia código SQL ou trecho da mensagem para texto em pt-BR. */
export function fail(error: DbError, friendly: Record<string, string> = {}): never {
  const key = Object.keys(friendly).find((k) => error.code === k || error.message.includes(k))
  throw new Error(key ? friendly[key] : error.message)
}

export async function myId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sessão expirada. Entre de novo.')
  return session.user.id
}
