import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { mentorEmail, resetJournal, resetProgress, resetSimulations, signIn, studentEmail } from './support'

/** Cada pessoa em um contexto próprio (sessões separadas), no mesmo formato de celular do projeto. */
async function pageFor(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL: 'http://localhost:5173' })
  const page = await context.newPage()
  await signIn(page, email)
  return page
}

test.beforeEach(async () => {
  await resetProgress()
  await resetSimulations()
  await resetJournal()
})

test('aluna: o item marcado hoje vira um dia sem caderno no mapa de calor, e o painel não tem nada do mentor', async ({ browser }) => {
  const student = await pageFor(browser, await studentEmail())
  await expect(student.getByRole('heading', { level: 1, name: 'Hoje' })).toBeVisible()
  const box = student.getByRole('checkbox').first()
  await box.click()
  await expect(box).toBeChecked()
  await student.reload()
  await expect(student.getByRole('checkbox').first()).toBeChecked() // gravou no banco

  await student.getByRole('link', { name: 'Painel', exact: true }).click()
  await expect(student.getByRole('heading', { level: 1, name: 'Seu painel' })).toBeVisible()
  await expect(student.getByText('1 dia com atividade: 0 com caderno e 1 sem caderno.')).toBeVisible()
  await expect(student.getByText('Ainda não há simulados com as duas fichas.').first()).toBeVisible()
  for (const name of ['Caderno em dia', 'Treinos', 'Leitura', 'Últimos simulados', 'Uso do armazenamento']) {
    await expect(student.getByRole('heading', { level: 2, name, exact: true })).toHaveCount(0)
  }
})

test('mentor: vê o painel completo, com o uso do Storage', async ({ browser }) => {
  const mentor = await pageFor(browser, await mentorEmail())
  await mentor.getByRole('link', { name: 'Painel', exact: true }).click()
  await expect(mentor.getByRole('heading', { level: 1, name: 'Painel da aluna' })).toBeVisible()
  for (const name of [
    'Evolução das notas', 'Autoavaliação × mentor', 'Radar por critério', 'Atividade', 'Checklists por fase',
    'Caderno em dia', 'Treinos', 'Leitura', 'Últimos simulados', 'Uso do armazenamento',
  ]) {
    await expect(mentor.getByRole('heading', { level: 2, name, exact: true })).toBeVisible()
  }
  await expect(mentor.getByText(/de 1,0 GB \(\d+%\)/)).toBeVisible()
  await expect(mentor.getByText('Nenhum treino aguardando a sua avaliação.')).toBeVisible()
})
