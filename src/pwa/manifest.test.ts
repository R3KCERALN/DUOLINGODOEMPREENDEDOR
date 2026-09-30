/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { MANIFEST, THEME } from './manifest'

/** Largura × altura de um PNG (cabeçalho IHDR, bytes 16 a 23). */
function pngSize(publicPath: string): string {
  const b = readFileSync(`public${publicPath}`)
  expect(b.subarray(1, 4).toString(), publicPath).toBe('PNG')
  return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`
}

test('cada ícone do manifesto existe e tem o tamanho declarado', () => {
  expect(MANIFEST.icons?.length).toBe(3)
  for (const icon of MANIFEST.icons ?? []) expect(pngSize(icon.src), icon.src).toBe(icon.sizes)
})

test('instalável (RNF-01): nome curto, standalone, início em /, pt-BR, 512 maskable e cor = --color-bg', () => {
  expect(MANIFEST.short_name).toBe('Trilha')
  expect(MANIFEST.display).toBe('standalone')
  expect(MANIFEST.start_url).toBe('/')
  expect(MANIFEST.lang).toBe('pt-BR')
  expect(MANIFEST.icons?.some((i) => i.purpose === 'maskable' && i.sizes === '512x512')).toBe(true)
  expect(MANIFEST.theme_color).toBe(THEME)
  expect(readFileSync('src/design/tokens.css', 'utf8')).toContain(`--color-bg: ${THEME};`)
})

test('o index.html aponta para os ícones do iPhone e da aba, e não para o logo do Vite', () => {
  const html = readFileSync('index.html', 'utf8')
  expect(html).toContain('href="/icons/apple-touch-icon.png"')
  expect(pngSize('/icons/apple-touch-icon.png')).toBe('180x180')
  expect(html).toContain('href="/icons/favicon-32.png"')
  expect(pngSize('/icons/favicon-32.png')).toBe('32x32')
  expect(html).not.toContain('favicon.svg')
  expect(html).toContain(`<meta name="theme-color" content="${THEME}" />`)
})
