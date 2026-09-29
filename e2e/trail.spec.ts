import { expect, test } from '@playwright/test'
import { resetProgress, signIn, studentEmail } from './support'

test.beforeEach(async ({ page }) => {
  await resetProgress()
  await page.route(/youtube-nocookie\.com/, (route) => route.abort())
  await signIn(page, await studentEmail())
})

test('concluir a semana 1 libera a semana 2', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Hoje' })).toBeVisible()
  await page.getByRole('link', { name: 'Trilha', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Semana 2, bloqueada' })).toBeDisabled()
  await page.getByRole('button', { name: 'Semana 1, disponível' }).click()
  await expect(page).toHaveURL(/\/trilha\/w01$/)

  const boxes = page.getByRole('checkbox')
  await expect(boxes).toHaveCount(5) // count() não espera a tela renderizar
  const count = await boxes.count()
  for (let i = 0; i < count; i++) {
    // click + asserção com retry: a marcação otimista chega um tick depois do clique
    await boxes.nth(i).click()
    await expect(boxes.nth(i)).toBeChecked()
  }
  await expect(page.getByText('Semana concluída')).toBeVisible()

  await page.getByRole('link', { name: 'Ver a trilha' }).click()
  await expect(page.getByRole('button', { name: 'Semana 1, concluída' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Semana 2, disponível' })).toBeEnabled()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Semana 2, disponível' })).toBeEnabled()
})
