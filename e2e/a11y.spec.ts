import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { mentorEmail, resetProgress, signIn, studentEmail } from './support'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/** Abre a tela, espera o carregamento terminar e roda o axe; a mensagem lista regra e seletor de cada violação. */
async function audit(page: Page, path: string) {
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Carregando' })).toHaveCount(0)
  // O <iframe> do vídeo continua auditado (title); o documento do player do YouTube, não:
  // as violações dele são de terceiros e não temos como corrigir.
  const { violations } = await new AxeBuilder({ page })
    .exclude({ fromFrames: ['iframe[src*="youtube"]', 'html'] })
    .withTags(WCAG).analyze()
  expect(violations.map((v) => `${path} · ${v.id} · ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
}

test.beforeEach(async () => { await resetProgress() })

test('login sem violações WCAG A/AA', async ({ page }) => {
  await audit(page, '/login')
})

test('telas da aluna sem violações WCAG A/AA (RNF-06)', async ({ page }) => {
  await signIn(page, await studentEmail())
  for (const path of ['/', '/trilha', '/trilha/w01', '/simulados', '/caderno', '/caderno/notas', '/caderno/checklists', '/biblioteca', '/painel']) {
    await audit(page, path)
  }
})

test('telas do mentor sem violações WCAG A/AA', async ({ page }) => {
  await signIn(page, await mentorEmail())
  for (const path of ['/', '/simulados', '/cenarios', '/painel']) await audit(page, path)
})

test('teclado: todo elemento focado com Tab mostra contorno sólido de pelo menos 2 px', async ({ page }) => {
  await signIn(page, await studentEmail())
  await page.goto('/caderno')
  await expect(page.getByRole('heading', { level: 1, name: 'Caderno' })).toBeVisible()
  const seen: string[] = []
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab')
    const focus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const s = getComputedStyle(el)
      return { what: `${el.tagName.toLowerCase()} "${(el.textContent ?? el.getAttribute('aria-label') ?? '').trim().slice(0, 30)}"`, style: s.outlineStyle, width: parseFloat(s.outlineWidth) }
    })
    if (!focus) continue
    seen.push(focus.what)
    expect(focus.style, focus.what).toBe('solid')
    expect(focus.width, focus.what).toBeGreaterThanOrEqual(2)
  }
  expect(seen.length).toBeGreaterThan(5)
})

test('prefers-reduced-motion: transições e animações viram instantâneas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/login')
  const durations = await page.getByRole('button').first().evaluate((el) => {
    const s = getComputedStyle(el)
    return [...s.transitionDuration.split(','), ...s.animationDuration.split(',')].map((d) => parseFloat(d))
  })
  for (const d of durations) expect(d).toBeLessThanOrEqual(0.001)
})
