import { createClient } from '@supabase/supabase-js'
import type { Page } from '@playwright/test'

const url = process.env.API_URL ?? 'http://127.0.0.1:55321'
const serviceKey = process.env.SERVICE_ROLE_KEY
if (!serviceKey) throw new Error('Defina SERVICE_ROLE_KEY: set -a; eval "$(npx supabase status -o env)"; set +a')
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) throw new Error(`E2E só roda contra o Supabase local, não contra ${url}`)

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

/** E-mail da conta aluna local; cria uma conta de teste se ainda não existir. */
export async function studentEmail(): Promise<string> {
  const { data: existing, error } = await admin.from('profiles').select('id').eq('role', 'aluna').maybeSingle()
  if (error) throw error
  if (existing) {
    const { data, error: userError } = await admin.auth.admin.getUserById(existing.id)
    if (userError || !data.user.email) throw userError ?? new Error('Conta aluna sem e-mail')
    return data.user.email
  }
  const email = 'aluna.e2e@trilha.test'
  const { data, error: createError } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (createError) throw createError
  const { error: profileError } = await admin.from('profiles').insert({ id: data.user.id, role: 'aluna', name: 'Aluna E2E' })
  if (profileError) throw profileError
  return email
}

/** Zera progresso e overrides do banco local. */
export async function resetProgress(): Promise<void> {
  const a = await admin.from('item_progress').delete().neq('item_id', '')
  if (a.error) throw a.error
  const b = await admin.from('node_overrides').delete().neq('node_id', '')
  if (b.error) throw b.error
}

/** Login por magic link gerado pelo admin (sem abrir e-mail). */
export async function signIn(page: Page, email: string): Promise<void> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink', email, options: { redirectTo: 'http://localhost:5173/' },
  })
  if (error) throw error
  await page.goto(data.properties.action_link)
  await page.waitForURL(/^http:\/\/localhost:5173\//)
}
