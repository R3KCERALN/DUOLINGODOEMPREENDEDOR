import { useOnline } from '@/lib/useOnline'

/** Sem internet o app abre do cache (PWA); o treino grava e a fila envia o áudio quando a conexão voltar (E5). */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <p role="status" className="sticky top-0 z-40 border-b border-edge bg-raised px-4 py-2 text-center text-sm font-bold text-streak">
      Sem internet. O treino e a gravação continuam; o envio e o resto do app voltam quando a conexão voltar.
    </p>
  )
}
