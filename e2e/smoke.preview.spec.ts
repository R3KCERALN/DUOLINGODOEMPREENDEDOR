import { expect, test } from '@playwright/test'
import { PREVIEW_URL, resetProgress, signIn, studentEmail } from './support'

test.beforeEach(async () => { await resetProgress() })

test('build de produção: a aluna entra por magic link e vê a tela Hoje', async ({ page }) => {
  await signIn(page, await studentEmail(), PREVIEW_URL)
  await expect(page.getByRole('heading', { level: 1, name: 'Hoje' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Trilha', exact: true })).toBeVisible()
})
