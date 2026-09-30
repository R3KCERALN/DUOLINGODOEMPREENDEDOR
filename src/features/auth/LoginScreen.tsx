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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center overflow-hidden px-4 pb-10">
      <div aria-hidden className="pointer-events-none relative -mx-4">
        <img src="/art/lobo1.png" alt="" width={480} height={230} className="pixelated block w-full opacity-70" />
        <div className="absolute inset-0 scanlines" />
        <div className="absolute inset-x-0 bottom-0 h-8 dither-fade" />
      </div>
      <div className="relative -mt-4 flex flex-col gap-6">
        <div>
          <p className="font-display text-7xl leading-none font-black text-brand text-glow">Trilha</p>
          <p className="mt-2 text-muted">De iniciante a empresária e grande vendedora.</p>
        </div>
        <div className="flex flex-col gap-4 rounded-card border border-edge bg-surface p-4">
          <h1 className="text-2xl font-bold">Entrar</h1>
          {status === 'sent' ? (
            <p role="status">Confira seu e-mail e toque no link para entrar.</p>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 font-bold">
                E-mail
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-control border-2 border-line bg-bg px-3 font-normal text-ink caret-brand focus:border-brand focus:glow" />
              </label>
              <Button type="submit" size="lg" loading={status === 'sending'}>Enviar link</Button>
              {status === 'error' && <p role="alert" className="text-danger">Não foi possível enviar. Esse e-mail tem acesso?</p>}
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
