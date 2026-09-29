/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8')

const darkStart = css.indexOf('@media (prefers-color-scheme: dark)')
const darkEnd = css.indexOf('@theme inline')
const darkCss = css.slice(darkStart, darkEnd)
const lightCss = css.slice(0, darkStart) + css.slice(darkEnd)

function token(name: string, scope: 'light' | 'dark' = 'light'): string {
  const block = scope === 'light' ? lightCss : darkCss
  const m = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`token ${name} (${scope}) não encontrado`)
  return m[1]
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const WHITE = '#ffffff'

test.each([
  ['texto no fundo (claro)', token('ink'), token('bg')],
  ['texto secundário no fundo (claro)', token('muted'), token('bg')],
  ['texto no card (claro)', token('ink'), token('surface')],
  ['texto no fundo (escuro)', token('ink', 'dark'), token('bg', 'dark')],
  ['texto secundário no fundo (escuro)', token('muted', 'dark'), token('bg', 'dark')],
  ['botão marca', WHITE, token('color-brand-strong')],
  ['botão sucesso', WHITE, token('color-success')],
  ['nó fase 2', WHITE, token('color-f2')],
  ['nó fase 3', WHITE, token('color-f3')],
  ['texto sobre dourado', token('ink'), token('color-streak')],
])('%s tem contraste ≥ 4.5', (_, fg, bg) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
})
