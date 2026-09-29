/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8')

function color(name: string): string {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`token --color-${name} não encontrado`)
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

test('tema é único e escuro', () => {
  expect(css).toMatch(/color-scheme:\s*dark/)
  expect(css).not.toMatch(/prefers-color-scheme/)
})

test.each([
  ['texto no fundo', color('ink'), color('bg')],
  ['texto no card', color('ink'), color('surface')],
  ['texto na superfície elevada', color('ink'), color('raised')],
  ['texto secundário no fundo', color('muted'), color('bg')],
  ['texto secundário no card', color('muted'), color('surface')],
  ['texto secundário na superfície elevada', color('muted'), color('raised')],
  ['primária como texto no card', color('brand'), color('surface')],
  ['sucesso como texto no card', color('success'), color('surface')],
  ['erro como texto no card', color('danger'), color('surface')],
  ['botão primário', color('on-brand'), color('brand')],
  ['botão primário (hover)', color('on-brand'), color('brand-strong')],
  ['botão primário (pressionado)', color('on-brand'), color('brand-press')],
  ['selo sucesso', color('on-brand'), color('success')],
  ['selo sequência', color('on-brand'), color('streak')],
  ['botão perigo', color('on-brand'), color('danger')],
  ['ficha fase 1', color('on-brand'), color('f1')],
  ['ficha fase 2', color('on-brand'), color('f2')],
  ['ficha fase 3', color('on-brand'), color('f3')],
  ['ficha fase 4', color('on-brand'), color('f4')],
])('%s tem contraste ≥ 4.5', (_, fg, bg) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
})

test.each([
  ['borda de campo no fundo', color('line'), color('bg')],
  ['borda de campo no card', color('line'), color('surface')],
  ['ficha bloqueada no fundo', color('locked'), color('bg')],
  ['anel de foco no card', color('ink'), color('surface')],
])('%s tem contraste de UI ≥ 3', (_, fg, bg) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3)
})
