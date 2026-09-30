import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { mentorEmail, PREVIEW_URL, resetProgress, signIn, studentEmail } from './support'

// O service worker responderia às navegações sem passar pelo page.route (e sem o cabeçalho): aqui ele fica desligado.
test.use({
  serviceWorkers: 'block',
  // Página servida por page.route/fulfill perde o espaço de endereços "local" e o Chrome (Local Network Access) barraria o fetch
  // ao Supabase em 127.0.0.1: só neste spec, o Chrome de teste desliga essa verificação. Não muda nada no app.
  launchOptions: { args: ['--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessRespectPreflightResults'] },
})

const API = process.env.API_URL ?? 'http://127.0.0.1:55321'
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as { headers: { source: string; headers: { key: string; value: string }[] }[] }
const prodCsp = vercel.headers.find((h) => h.source === '/(.*)')!.headers.find((h) => h.key === 'Content-Security-Policy')!.value
/** A mesma CSP de produção; só acrescenta o Supabase local (http, porta 55321) e tira o upgrade para https. */
const localCsp = prodCsp
  .replace('connect-src', `connect-src ${API} ${API.replace(/^http/, 'ws')}`)
  .replace('media-src', `media-src ${API}`)
  .replace(/;\s*upgrade-insecure-requests/, '')

async function withProductionCsp(page: Page): Promise<string[]> {
  const violations: string[] = []
  page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) violations.push(m.text()) })
  await page.route(`${PREVIEW_URL}/**`, async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': localCsp } })
  })
  return violations
}

test.beforeEach(async () => { await resetProgress() })

test('aluna: telas principais e o vídeo da semana sem violar a CSP (Review Focus 4)', async ({ page }) => {
  const violations = await withProductionCsp(page)
  await signIn(page, await studentEmail(), PREVIEW_URL)
  // a sessão do magic link (hash da URL) só vai para o localStorage depois do carregamento: espera o app logado antes de navegar
  await expect(page.getByRole('heading', { level: 1, name: 'Hoje' })).toBeVisible()
  const screens = [['/', 'Hoje'], ['/trilha', 'Trilha'], ['/simulados', 'Simulados'], ['/caderno', 'Caderno'],
    ['/biblioteca', 'Biblioteca'], ['/painel', 'Seu painel']] as const
  for (const [path, name] of screens) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  }
  await page.goto('/trilha/w01')
  const video = page.locator('iframe[src^="https://www.youtube-nocookie.com/embed/"]').first()
  await video.scrollIntoViewIfNeeded()
  await expect(video).toBeAttached()
  expect(violations).toEqual([])
})

test('mentor: painel com uso do armazenamento e banco de cenários sem violar a CSP', async ({ page }) => {
  const violations = await withProductionCsp(page)
  await signIn(page, await mentorEmail(), PREVIEW_URL)
  await expect(page.getByRole('link', { name: 'Painel', exact: true })).toBeVisible()
  await page.goto('/painel')
  await expect(page.getByRole('heading', { level: 1, name: 'Painel da aluna' })).toBeVisible()
  await expect(page.getByText(/de 1,0 GB/)).toBeVisible()
  await page.goto('/cenarios')
  await expect(page.getByRole('heading', { level: 1, name: 'Cenários' })).toBeVisible()
  expect(violations).toEqual([])
})
