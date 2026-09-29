import { Button } from '@/design/ui'
import type { NodeOverride } from '@/domain/trailState'
import { useSetOverride } from '@/features/progress/hooks'
import { TZ } from '@/lib/dates'

const when = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export function OverridePanel({ nodeId, label, current }: { nodeId: string; label: string; current?: NodeOverride }) {
  const setOverride = useSetOverride()
  const busy = setOverride.isPending
  const choose = (state: 'unlocked' | 'locked' | null) => setOverride.mutate({ nodeId, state })
  return (
    <div role="group" aria-label={`Liberação de ${label}`} className="flex w-full flex-col gap-2 rounded-card border border-edge bg-surface p-3">
      <p className="text-sm text-muted">
        {current
          ? `${current.state === 'unlocked' ? 'Liberada' : 'Bloqueada'} por ${current.byName} em ${when.format(new Date(current.at))}`
          : 'Seguindo a regra automática.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={busy || current?.state === 'unlocked'} onClick={() => choose('unlocked')}>Liberar</Button>
        <Button size="sm" variant="secondary" disabled={busy || current?.state === 'locked'} onClick={() => choose('locked')}>Bloquear</Button>
        <Button size="sm" variant="ghost" disabled={busy || !current} onClick={() => choose(null)}>Voltar ao automático</Button>
      </div>
      {setOverride.error && <p role="alert" className="text-sm text-danger">Não foi possível salvar: {setOverride.error.message}</p>}
    </div>
  )
}
