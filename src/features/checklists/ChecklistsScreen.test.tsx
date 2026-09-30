import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { asyncMutationOf, checklistOf, queryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')

import { useAuth } from '@/features/auth/AuthProvider'
import { ChecklistsScreen } from './ChecklistsScreen'
import * as api from './hooks'

const toggle = vi.fn()
const save = vi.fn()
const remove = vi.fn()

function setup(lists = [checklistOf()], role: 'aluna' | 'mentor' = 'aluna') {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(api.useChecklists).mockReturnValue(queryOf(lists))
  vi.mocked(api.useToggleChecklistItem).mockReturnValue({ ...(asyncMutationOf() as object), mutate: toggle } as never)
  vi.mocked(api.useSaveChecklist).mockReturnValue({ ...(asyncMutationOf() as object), mutate: save } as never)
  vi.mocked(api.useDeleteChecklist).mockReturnValue({ ...(asyncMutationOf() as object), mutate: remove } as never)
  return render(<ChecklistsScreen />)
}

beforeEach(() => vi.clearAllMocks())

test('mostra a lista com semana, progresso e itens marcados', () => {
  setup()
  expect(screen.getByRole('heading', { name: 'Semana 5' })).toBeInTheDocument()
  expect(screen.getByText('Semana 5', { selector: 'span' })).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: 'Ligar para 5 empresas' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Escrever 10 respostas' })).not.toBeChecked()
})

test('marcar um item chama a mutation', async () => {
  setup()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Escrever 10 respostas' }))
  expect(toggle).toHaveBeenCalledWith({ itemId: 'i2', done: true })
})

test('lista da outra pessoa é só leitura, com o nome de quem é', () => {
  setup([checklistOf({ mine: false })], 'mentor')
  expect(screen.getByText('Lista da aluna')).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: 'Escrever 10 respostas' })).toBeDisabled()
  expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Apagar/ })).not.toBeInTheDocument()
})

test('nova lista: título, itens, semana e data; só salva quando válida (RF-42)', async () => {
  setup([])
  await userEvent.click(screen.getByRole('button', { name: 'Nova lista' }))
  const saveButton = screen.getByRole('button', { name: 'Salvar lista' })
  expect(saveButton).toBeDisabled()
  await userEvent.type(screen.getByLabelText('Título'), 'Preparar a semana')
  expect(saveButton).toBeDisabled() // item vazio
  await userEvent.type(screen.getByLabelText('Item 1'), 'Ler o capítulo 3')
  await userEvent.click(screen.getByRole('button', { name: 'Adicionar item' }))
  await userEvent.type(screen.getByLabelText('Item 2'), 'Ligar para 3 empresas')
  await userEvent.selectOptions(screen.getByLabelText('Semana (opcional)'), 'w05')
  await userEvent.type(screen.getByLabelText('Data (opcional)'), '2026-10-04')
  expect(saveButton).toBeEnabled()
  await userEvent.click(saveButton)
  const vars = save.mock.calls[0][0]
  expect(vars).toMatchObject({ title: 'Preparar a semana', weekId: 'w05', dueDate: '2026-10-04' })
  expect(vars.id).toEqual(expect.any(String))
  expect(vars.items.map((i: { text: string }) => i.text)).toEqual(['Ler o capítulo 3', 'Ligar para 3 empresas'])
  expect(new Set(vars.items.map((i: { id: string }) => i.id)).size).toBe(2)
})

test('editar preserva os ids dos itens e remover tira o item', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: 'Editar Semana 5' }))
  await userEvent.click(screen.getByRole('button', { name: 'Remover item 2' }))
  await userEvent.click(screen.getByRole('button', { name: 'Salvar lista' }))
  expect(save.mock.calls[0][0]).toMatchObject({ id: 'c1', items: [{ id: 'i1', text: 'Ligar para 5 empresas' }] })
})

test('apagar pede confirmação', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: 'Apagar Semana 5' }))
  expect(remove).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))
  expect(remove).toHaveBeenCalledWith('c1')
})

test('sem listas mostra a mensagem', () => {
  setup([])
  expect(within(document.body).getByText('Nenhuma lista ainda.')).toBeInTheDocument()
})
