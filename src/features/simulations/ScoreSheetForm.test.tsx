import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { asyncMutationOf } from '@/test/simulationMocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import * as sim from './hooks'
import { ScoreSheetForm } from './ScoreSheetForm'

const mutate = vi.fn()
function setup(error: Error | null = null) {
  vi.mocked(sim.useSubmitScore).mockReturnValue({ ...(asyncMutationOf(vi.fn(), error) as object), mutate } as never)
  const onSubmitted = vi.fn()
  render(<ScoreSheetForm simulationId="s1" onSubmitted={onSubmitted} />)
  return onSubmitted
}
const rate = (criterion: string, n: number) =>
  userEvent.click(within(screen.getByRole('group', { name: criterion })).getByLabelText(String(n), { selector: 'input' }))

beforeEach(() => vi.clearAllMocks())

test('mostra os 6 critérios com o texto "o que observar" (RF-78)', () => {
  setup()
  for (const c of ['Abertura', 'Tom e energia', 'Perguntas', 'Escuta', 'Objeção', 'Fechamento']) expect(screen.getByRole('group', { name: c })).toBeInTheDocument()
  expect(screen.getByText('Disse quem é e o motivo em até 20 segundos?')).toBeInTheDocument()
})

test('só envia com os 6 critérios preenchidos e mostra o total', async () => {
  setup()
  const send = screen.getByRole('button', { name: 'Enviar ficha' })
  expect(send).toBeDisabled()
  expect(screen.getByText('Total: —')).toBeInTheDocument()
  for (const c of ['Abertura', 'Tom e energia', 'Perguntas', 'Escuta', 'Objeção']) await rate(c, 4)
  expect(send).toBeDisabled()
  await rate('Fechamento', 5)
  expect(send).toBeEnabled()
  expect(screen.getByText('Total: 25 de 30')).toBeInTheDocument()
})

test('envia notas e textos no formato do contrato (RF-79)', async () => {
  const onSubmitted = setup()
  for (const c of ['Abertura', 'Tom e energia', 'Perguntas', 'Escuta', 'Objeção', 'Fechamento']) await rate(c, 3)
  await userEvent.type(screen.getByLabelText('1 coisa que foi boa'), 'Boa abertura')
  await userEvent.type(screen.getByLabelText('1 coisa para melhorar'), 'Calar depois de pedir a venda')
  await userEvent.click(screen.getByRole('button', { name: 'Enviar ficha' }))
  expect(mutate).toHaveBeenCalledWith(
    { simulationId: 's1', scores: { abertura: 3, tom: 3, perguntas: 3, escuta: 3, objecao: 3, fechamento: 3 }, good: 'Boa abertura', improve: 'Calar depois de pedir a venda' },
    { onSuccess: onSubmitted },
  )
})

test('erro do banco (ficha duplicada) aparece como alerta', () => {
  setup(new Error('Você já enviou a sua ficha.'))
  expect(screen.getByRole('alert')).toHaveTextContent('Você já enviou a sua ficha.')
})
