import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { mentorEmail, resetSimulations, signIn, studentEmail } from './support'

/** Cada pessoa em um contexto próprio (sessões separadas), no mesmo formato de celular do projeto. */
async function pageFor(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL: 'http://localhost:5173' })
  const page = await context.newPage()
  await signIn(page, email)
  return page
}

async function sendSheet(page: Page, note: number) {
  for (const criterion of ['Abertura', 'Tom e energia', 'Perguntas', 'Escuta', 'Objeção', 'Fechamento']) {
    await page.getByRole('group', { name: criterion }).getByText(String(note), { exact: true }).click()
  }
  await page.getByRole('button', { name: 'Enviar ficha' }).click()
  await expect(page.getByText('Ficha enviada. Falta a ficha da outra pessoa.').or(page.getByRole('heading', { name: 'Nota oficial' }))).toBeVisible()
}

test.beforeEach(async () => { await resetSimulations() })

test('surpresa: a aluna só vê o cenário depois que o mentor encerra; duas fichas geram a nota oficial', async ({ browser }) => {
  const mentor = await pageFor(browser, await mentorEmail())
  await mentor.getByRole('link', { name: 'Simulados', exact: true }).click()
  await mentor.getByRole('button', { name: 'Girar a roleta' }).click()
  await mentor.getByRole('button', { name: 'Iniciar simulado surpresa' }).click() // habilita quando os 4 rolos param
  await expect(mentor).toHaveURL(/\/simulados\/[0-9a-f-]{36}$/)
  await expect(mentor.getByRole('heading', { name: 'Cenário' })).toBeVisible()
  const detailUrl = mentor.url()

  const student = await pageFor(browser, await studentEmail())
  await student.goto(detailUrl)
  await expect(student.getByRole('heading', { level: 1, name: 'Simulado surpresa em andamento' })).toBeVisible()
  await expect(student.getByRole('heading', { name: 'Cenário' })).toHaveCount(0)

  await mentor.getByRole('button', { name: 'Encerrar simulado' }).click()
  await expect(mentor.getByRole('button', { name: 'Enviar ficha' })).toBeVisible()
  await student.reload()
  await expect(student.getByRole('heading', { name: 'Cenário' })).toBeVisible()

  await sendSheet(student, 3)
  await sendSheet(mentor, 5)
  await student.reload()
  await expect(student.getByRole('heading', { name: 'Nota oficial' })).toBeVisible()
  await expect(student.getByText('24.0')).toBeVisible()
})
