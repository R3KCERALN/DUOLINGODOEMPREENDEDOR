import { checklistProgress, validateChecklistDraft, type ChecklistDraft } from './checklists'

const ok: ChecklistDraft = { title: 'Semana 5', weekId: 'w05', dueDate: '2026-10-04', items: [{ text: 'Ligar para 5 empresas' }] }

test('lista válida', () => expect(validateChecklistDraft(ok)).toBeNull())

test('título, itens e limites (RF-42)', () => {
  expect(validateChecklistDraft({ ...ok, title: '  ' })).toMatch(/título/)
  expect(validateChecklistDraft({ ...ok, title: 'x'.repeat(121) })).toMatch(/120/)
  expect(validateChecklistDraft({ ...ok, items: [] })).toMatch(/pelo menos um item/)
  expect(validateChecklistDraft({ ...ok, items: [{ text: 'a' }, { text: ' ' }] })).toMatch(/em branco/)
  expect(validateChecklistDraft({ ...ok, items: [{ text: 'x'.repeat(301) }] })).toMatch(/300/)
})

test('semana e data são opcionais, mas se vierem precisam ser válidas', () => {
  expect(validateChecklistDraft({ ...ok, weekId: null, dueDate: null })).toBeNull()
  expect(validateChecklistDraft({ ...ok, weekId: 'w99' })).toMatch(/Semana/)
  expect(validateChecklistDraft({ ...ok, weekId: 'f4-marca' })).toMatch(/Semana/)
  expect(validateChecklistDraft({ ...ok, dueDate: '2026-02-30' })).toMatch(/Data/)
})

test('progresso', () => {
  expect(checklistProgress([])).toEqual({ done: 0, total: 0, ratio: 0 })
  expect(checklistProgress([{ done: true }, { done: false }])).toEqual({ done: 1, total: 2, ratio: 0.5 })
})
