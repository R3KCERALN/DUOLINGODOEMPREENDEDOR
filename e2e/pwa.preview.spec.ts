import { expect, test } from '@playwright/test'
import { PREVIEW_URL, resetProgress, signIn, studentEmail } from './support'

test.beforeEach(async () => { await resetProgress() })

async function waitForServiceWorker(page: import('@playwright/test').Page) {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
}

test('instalável: manifesto com nome, standalone e ícones que existem (RNF-01)', async ({ page, request }) => {
  await page.goto('/login')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).not.toBeNull()
  const manifest = await (await request.get(new URL(href!, PREVIEW_URL).toString())).json()
  expect(manifest).toMatchObject({ short_name: 'Trilha', display: 'standalone', start_url: '/', lang: 'pt-BR' })
  for (const icon of manifest.icons) expect((await request.get(new URL(icon.src, PREVIEW_URL).toString())).ok(), icon.src).toBe(true)
})

test('sem internet depois da primeira visita, o app ainda abre (login e rota interna)', async ({ page, context }) => {
  await page.goto('/login')
  await waitForServiceWorker(page)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible()
  await page.goto('/trilha')
  await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible() // sem sessão, cai no login — servido do cache
  await context.setOffline(false)
})

test('logada e sem internet: o shell abre com o aviso e a navegação', async ({ page, context }) => {
  await signIn(page, await studentEmail(), PREVIEW_URL)
  await expect(page.getByRole('heading', { level: 1, name: 'Hoje' })).toBeVisible()
  await waitForServiceWorker(page)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('status').filter({ hasText: 'Sem internet' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Trilha', exact: true })).toBeVisible()
  await context.setOffline(false)
})
