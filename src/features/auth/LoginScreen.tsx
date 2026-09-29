import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/design/ui'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-4">
      <h1 className="text-3xl font-black">Entrar</h1>
      {status === 'sent' ? (
        <p role="status">Confira seu e-mail e toque no link para entrar.</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 font-bold">
            E-mail
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-card border-2 border-line bg-surface px-3 font-normal focus:border-brand focus:outline-none" />
          </label>
          <Button type="submit" loading={status === 'sending'}>Enviar link</Button>
          {status === 'error' && <p role="alert" className="text-danger">Não foi possível enviar. Esse e-mail tem acesso?</p>}
        </form>
      )}
    </main>
  )
}
