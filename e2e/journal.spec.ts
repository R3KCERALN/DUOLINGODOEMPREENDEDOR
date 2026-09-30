import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { mentorEmail, resetJournal, signIn, studentEmail } from './support'

/** Cada pessoa em um contexto próprio (sessões separadas), no mesmo formato de celular do projeto. */
async function pageFor(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL: 'http://localhost:5173' })
  const page = await context.newPage()
  await signIn(page, email)
  return page
}

test.beforeEach(async () => { await resetJournal() })

test('caderno do dia enviado pela aluna aparece para o mentor, com os horários', async ({ browser }) => {
  const student = await pageFor(browser, await studentEmail())
  await student.getByRole('link', { name: 'Caderno', exact: true }).click()
  await expect(student.getByText('Pendente').first()).toBeVisible() // selo do dia e linha de hoje na lista

  await student.getByLabel('Uma coisa que aprendi').fill('Aprendi a ouvir mais do que falar')
  await student.getByLabel('Uma coisa que pratiquei').fill('Pratiquei o pitch de 30 segundos')
  await student.getByLabel('Uma coisa para amanhã').fill('Ligar para três empresas amanhã')
  await expect(student.getByText('Salvo')).toBeVisible()
  await expect(student.getByText('Completo').first()).toBeVisible() // a marca vem do banco

  await student.reload()
  await expect(student.getByLabel('Uma coisa que aprendi')).toHaveValue('Aprendi a ouvir mais do que falar')

  const mentor = await pageFor(browser, await mentorEmail())
  await mentor.getByRole('link', { name: 'Caderno', exact: true }).click()
  await expect(mentor.getByText('Aprendi a ouvir mais do que falar')).toBeVisible()
  await expect(mentor.getByText(/Criado .* atualizado /).first()).toBeVisible()
  await expect(mentor.getByLabel('Uma coisa que aprendi')).toHaveCount(0) // o mentor lê, não escreve
})
