import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { asyncMutationOf, bankQuery } from '@/test/simulationMocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import * as sim from './hooks'
import { ScenarioBankEditor } from './ScenarioBankEditor'

const saveReel = vi.fn()
const setReelActive = vi.fn()
const saveCard = vi.fn()
const setCardActive = vi.fn()

function setup(bank = bankQuery()) {
  vi.mocked(sim.useScenarioBank).mockReturnValue(bank)
  vi.mocked(sim.useSaveReelItem).mockReturnValue({ ...(asyncMutationOf() as object), mutate: saveReel } as never)
  vi.mocked(sim.useSetReelItemActive).mockReturnValue({ ...(asyncMutationOf() as object), mutate: setReelActive } as never)
  vi.mocked(sim.useSaveChallengeCard).mockReturnValue({ ...(asyncMutationOf() as object), mutate: saveCard } as never)
  vi.mocked(sim.useSetChallengeCardActive).mockReturnValue({ ...(asyncMutationOf() as object), mutate: setCardActive } as never)
  return render(<ScenarioBankEditor />)
}

beforeEach(() => vi.clearAllMocks())

test('lista os itens do rolo, com os inativos riscados e o selo "Original"', () => {
  setup()
  expect(screen.getByText('Captura de lead')).toBeInTheDocument()
  expect(screen.getByText('Follow-up')).toBeInTheDocument()
  expect(screen.getAllByText('Original')).toHaveLength(2)
  expect(screen.getByRole('checkbox', { name: 'Ativo: Follow-up' })).not.toBeChecked()
})

test('desativar um item chama a mutation e o histórico continua no banco (RF-84)', async () => {
  setup()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Ativo: Captura de lead' }))
  expect(setReelActive).toHaveBeenCalledWith({ id: 'obj-01', active: false })
})

test('novo objetivo exige papel do mentor e meta dela (RF-85)', async () => {
  setup()
  const add = screen.getByRole('button', { name: 'Adicionar' })
  await userEvent.type(screen.getByLabelText('Nome'), 'Follow-up 2')
  expect(add).toBeDisabled()
  expect(screen.getByText(/papel do mentor/)).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('Papel do mentor'), 'Lead que sumiu')
  await userEvent.type(screen.getByLabelText('Meta dela'), 'Obter sim ou não')
  expect(add).toBeEnabled()
  await userEvent.click(add)
  expect(saveReel).toHaveBeenCalledWith(
    { id: undefined, reel: 1, label: 'Follow-up 2', mentorRole: 'Lead que sumiu', studentGoal: 'Obter sim ou não', clientLine: '' },
    expect.objectContaining({ onSuccess: expect.any(Function) }),
  )
})

test('editar preenche o formulário e salva com o id do item', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: 'Editar Agendamento' }))
  expect(screen.getByLabelText('Nome')).toHaveValue('Agendamento')
  await userEvent.clear(screen.getByLabelText('Nome'))
  await userEvent.type(screen.getByLabelText('Nome'), 'Agendar reunião')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect(saveReel).toHaveBeenCalledWith(expect.objectContaining({ id: 'obj-02', label: 'Agendar reunião' }), expect.anything())
})

test('rolo 4: "Nenhuma" é fixa e a complicação pede a fala do cliente', async () => {
  setup()
  await userEvent.click(screen.getByRole('tab', { name: 'Complicação' }))
  expect(screen.getByText('Fixo')).toBeInTheDocument()
  expect(screen.queryByRole('checkbox', { name: /Ativo: Nenhuma/ })).not.toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('Nome'), 'Concorrente barato')
  expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled()
  await userEvent.type(screen.getByLabelText('Fala do cliente (1ª pessoa)'), 'O concorrente cobra metade.')
  expect(screen.getByRole('button', { name: 'Adicionar' })).toBeEnabled()
})

test('avisa quando todos os itens de um rolo obrigatório estão inativos (Review Focus 3)', async () => {
  const bank = bankQuery()
  bank.data!.items = bank.data!.items.map((i) => (i.reel === 2 ? { ...i, active: false } : i))
  setup(bank)
  await userEvent.click(screen.getByRole('tab', { name: 'Perfil do cliente' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Ative pelo menos um item')
})

test('baralho de perguntas: adicionar e desativar', async () => {
  setup()
  await userEvent.click(screen.getByRole('tab', { name: 'Perguntas do produto' }))
  await userEvent.click(screen.getByRole('checkbox', { name: 'Ativa: Qual a garantia?' }))
  expect(setCardActive).toHaveBeenCalledWith({ id: 'card-02', active: false })
  await userEvent.type(screen.getByLabelText('Pergunta do cliente'), 'Tem nota fiscal?')
  await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
  expect(saveCard).toHaveBeenCalledWith({ id: undefined, text: 'Tem nota fiscal?' }, expect.anything())
})
