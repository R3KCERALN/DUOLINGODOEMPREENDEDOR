import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/design/ui'

/** Registra o service worker. Versão nova só entra quando ela toca em "Atualizar": recarregar sozinho no meio de um treino perderia a gravação. */
export function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({ immediate: true })
  if (!needRefresh) return null
  return (
    <div role="status" className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-card border border-edge bg-raised p-3">
      <p className="flex-1 text-sm">Nova versão do app disponível.</p>
      <Button size="sm" onClick={() => void updateServiceWorker(true)}>Atualizar</Button>
      <Button size="sm" variant="secondary" onClick={() => setNeedRefresh(false)}>Depois</Button>
    </div>
  )
}
