/** Cores dos gráficos: só tokens do tema (src/design/tokens.css), resolvidos pelo navegador via var(). */
export const CHART = {
  grid: 'var(--color-edge)',
  axis: 'var(--color-line)',
  text: 'var(--color-muted)',
  ink: 'var(--color-ink)',
  official: 'var(--color-brand-strong)',
  student: 'var(--color-f2)',
  mentor: 'var(--color-f3)',
  goalF2: 'var(--color-success)',
  goalF4: 'var(--color-streak)',
} as const

export const TICK = { fill: CHART.text, fontSize: 12 } as const

export const TOOLTIP_STYLE = {
  background: 'var(--color-raised)',
  border: '1px solid var(--color-edge)',
  borderRadius: 8,
  color: 'var(--color-ink)',
} as const

/** Tamanho do primeiro desenho (antes de medir a tela) e do jsdom. */
export const INITIAL = { width: 320, height: 240 } as const
