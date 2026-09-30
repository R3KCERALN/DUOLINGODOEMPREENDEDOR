/// <reference types="node" />
import { readFileSync } from 'node:fs'

const css = readFileSync('src/design/tokens.css', 'utf8')
const token = (name: string) => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9A-Fa-f]{6});`))
  if (!m) throw new Error(`token --color-${name} não encontrado`)
  return m[1]
}
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(token(a)), luminance(token(b))].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

test.each(['ink', 'muted', 'brand', 'brand-strong', 'success', 'streak', 'danger', 'f1', 'f2', 'f3', 'f4'])(
  'texto %s tem contraste AA (4,5:1) sobre bg, surface e raised (RNF-06)', (fg) => {
    for (const bg of ['bg', 'surface', 'raised']) expect(ratio(fg, bg), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(4.5)
  })

test('texto dos botões e nó bloqueado', () => {
  expect(ratio('on-brand', 'brand')).toBeGreaterThanOrEqual(4.5)
  expect(ratio('on-brand', 'danger')).toBeGreaterThanOrEqual(4.5)
  expect(ratio('locked', 'bg')).toBeGreaterThanOrEqual(4.5)
})
