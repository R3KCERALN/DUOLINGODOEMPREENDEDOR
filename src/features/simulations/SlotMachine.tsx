import { useEffect, useRef, useState } from 'react'

export interface SlotResult { objective: string; profile: string; product: string; complications: string[] }

export interface SlotMachineProps {
  /** Rótulos que passam girando em cada rolo (objetivo, perfil, produto, complicação). */
  faces: [string[], string[], string[], string[]]
  /** Rótulos sorteados; `null` até o primeiro giro. */
  result: SlotResult | null
  /** Incrementa a cada giro (inclusive "girar de novo") para reiniciar a animação. */
  spinId: number
  onSettled?: () => void
  /** Padrão: `prefers-reduced-motion` do sistema (RF-74). */
  reducedMotion?: boolean
}

const TITLES = ['Objetivo', 'Perfil do cliente', 'Produto', 'Complicação'] as const
const FIRST_STOP_MS = 700
const STOP_GAP_MS = 500
const TICK_MS = 90
const BULBS = 14

const finals = (r: SlotResult): string[][] => [[r.objective], [r.profile], [r.product], r.complications]
const prefersReduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const faceAt = (list: string[], n: number) => (list.length ? list[((n % list.length) + list.length) % list.length] : '…')

/** RF-70: 4 rolos que giram e param da esquerda para a direita. */
export function SlotMachine({ faces, result, spinId, onSettled, reducedMotion }: SlotMachineProps) {
  const [stopped, setStopped] = useState(0)
  const [tick, setTick] = useState(0)
  const settled = useRef(onSettled)
  const strips = useRef<(HTMLDivElement | null)[]>([])
  useEffect(() => { settled.current = onSettled })
  const reduced = reducedMotion ?? prefersReduced()

  // Gira só quando `spinId` muda; o resto é lido no momento do giro.
  useEffect(() => {
    if (!result) { setStopped(0); return }
    if (reduced) { setStopped(4); settled.current?.(); return }
    setStopped(0)
    const interval = setInterval(() => setTick((t) => t + 1), TICK_MS)
    const stops = [0, 1, 2, 3].map((i) => setTimeout(() => {
      setStopped(i + 1)
      if (i === 3) { clearInterval(interval); settled.current?.() }
    }, FIRST_STOP_MS + i * STOP_GAP_MS))
    return () => { clearInterval(interval); stops.forEach(clearTimeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId])

  const spinning = result !== null && stopped < 4

  // Cada passo do giro desce a fita de rótulos (Web Animations API; ausente no jsdom).
  useEffect(() => {
    if (!spinning || reduced) return
    strips.current.forEach((el, i) => {
      if (i >= stopped) el?.animate?.([{ transform: 'translateY(-34%)' }, { transform: 'translateY(0)' }], { duration: TICK_MS, easing: 'linear' })
    })
  }, [tick, spinning, stopped, reduced])

  // O rolo que acabou de parar dá um tranco curto, como uma trava mecânica.
  useEffect(() => {
    if (reduced || stopped === 0) return
    strips.current[stopped - 1]?.animate?.(
      [{ transform: 'translateY(14%)' }, { transform: 'translateY(-4%)' }, { transform: 'translateY(0)' }],
      { duration: 240, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    )
  }, [stopped, reduced])

  const done = result !== null && stopped === 4
  return (
    <div role="group" aria-label="Roleta de cenário" className="rounded-card border-2 border-edge bg-surface p-3 shadow-press">
      <div aria-hidden className="flex justify-between px-1 pb-3">
        {Array.from({ length: BULBS }, (_, b) => {
          const lit = done || (spinning && (b + tick) % 3 === 0)
          return <span key={b} className={`size-1.5 rounded-full ${lit ? 'bg-brand glow' : 'bg-raised'}`} />
        })}
      </div>
      <div className="relative grid grid-cols-4 gap-1 rounded-control border-2 border-line bg-bg p-1">
        {TITLES.map((title, i) => {
          const landed = result !== null && stopped > i
          const offset = tick + i * 3
          const center = result === null ? null : landed ? finals(result)[i] : [faceAt(faces[i], offset)]
          const above = result === null ? '' : faceAt(faces[i], offset + 1)
          const below = result === null ? '' : faceAt(faces[i], offset - 1)
          return (
            <div key={title} aria-label={`Rolo ${i + 1}: ${title}`}
              className={`relative min-h-44 overflow-hidden rounded-[4px] border ${landed ? 'border-brand/60' : 'border-edge'}`}>
              <div ref={(el) => { strips.current[i] = el }}
                className="grid h-full grid-rows-[3rem_minmax(5rem,1fr)_3rem] text-center text-[13px] leading-tight hyphens-auto [overflow-wrap:anywhere]">
                <p aria-hidden className="grid place-items-center px-1 text-muted">{above}</p>
                <div className={`grid place-items-center px-1 ${landed ? 'font-bold text-ink' : 'text-muted'}`}>
                  {center === null
                    ? <span className="font-display text-3xl font-black text-brand/70">?</span>
                    : <p className={`flex flex-col py-2 ${center.length > 1 ? 'gap-1.5 text-[12px]' : ''}`}>{center.map((l) => <span key={l}>{l}</span>)}</p>}
                </div>
                <p aria-hidden className="grid place-items-center px-1 text-muted">{below}</p>
              </div>
              {!landed && result !== null && <div aria-hidden className="pointer-events-none absolute inset-0 dither-dots" />}
              <div aria-hidden className="absolute inset-x-0 top-0 h-8 rotate-180 dither-fade" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-8 dither-fade" />
            </div>
          )
        })}
        <div aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-[calc(0.25rem+3rem)] bottom-[calc(0.25rem+3rem)] border-y-2 border-brand
            ${done ? 'glow' : ''}`} />
      </div>
      <div aria-hidden className="grid grid-cols-4 gap-1 pt-2 text-center text-[11px] leading-tight font-bold text-muted">
        {TITLES.map((t) => <span key={t}>{t}</span>)}
      </div>
      <p role="status" className="sr-only">
        {done ? `Sorteio: ${result.objective}, ${result.profile}, ${result.product}, ${result.complications.join(' e ')}` : ''}
      </p>
    </div>
  )
}
