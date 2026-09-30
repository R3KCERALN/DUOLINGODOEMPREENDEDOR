/// <reference types="node" />
import { readFileSync } from 'node:fs'

interface Header { key: string; value: string }
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  rewrites: { source: string; destination: string }[]
  headers?: { source: string; headers: Header[] }[]
}
const bySource = (source: string) => vercel.headers?.find((h) => h.source === source)?.headers
const header = (key: string) => bySource('/(.*)')?.find((h) => h.key === key)?.value
const csp = new Map((header('Content-Security-Policy') ?? '').split(';').map((d) => d.trim()).filter(Boolean)
  .map((d) => { const [name, ...values] = d.split(/\s+/); return [name, values] as const }))

test('CSP: script só do próprio site, sem inline nem eval', () => {
  expect(csp.get('default-src')).toEqual(["'self'"])
  expect(csp.get('script-src')).toEqual(["'self'", "'wasm-unsafe-eval'"])
  expect(csp.get('object-src')).toEqual(["'none'"])
  expect(csp.get('base-uri')).toEqual(["'self'"])
  expect(csp.get('frame-ancestors')).toEqual(["'none'"])
  expect(csp.has('upgrade-insecure-requests')).toBe(true)
})

test('CSP: libera só o que o app usa — Supabase, vídeo sem cookies, áudio e worker', () => {
  expect(csp.get('connect-src')).toEqual(["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'])
  expect(csp.get('media-src')).toEqual(["'self'", 'blob:', 'https://*.supabase.co'])
  expect(csp.get('frame-src')).toEqual(['https://www.youtube-nocookie.com'])
  expect(csp.get('worker-src')).toEqual(["'self'", 'blob:'])
  expect(csp.get('img-src')).toEqual(["'self'", 'data:', 'blob:'])
})

test('demais cabeçalhos de segurança', () => {
  expect(header('X-Content-Type-Options')).toBe('nosniff')
  expect(header('X-Frame-Options')).toBe('DENY')
  // o player do YouTube exige o Referer com a origem: "no-referrer" quebraria os vídeos da trilha
  expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  expect(header('Permissions-Policy')).toBe('camera=(), geolocation=(), microphone=(self), screen-wake-lock=(self)')
  expect(header('Strict-Transport-Security')).toMatch(/^max-age=\d{8,}/)
})

test('SPA continua indo para o index.html; assets imutáveis; service worker nunca em cache', () => {
  expect(vercel.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }])
  expect(bySource('/assets/(.*)')).toEqual([{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }])
  expect(bySource('/sw.js')).toEqual([{ key: 'Cache-Control', value: 'no-cache' }])
})
