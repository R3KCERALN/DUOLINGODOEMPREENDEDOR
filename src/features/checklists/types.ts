export interface ChecklistItem { id: string; text: string; done: boolean; position: number }

export interface Checklist {
  id: string
  title: string
  weekId: string | null
  dueDate: string | null
  createdAt: string
  /** A lista é de quem está logado; a outra pessoa só lê (RLS). */
  mine: boolean
  items: ChecklistItem[]
}

/** Os ids da lista e dos itens são gerados no cliente, então repetir o envio é idempotente. */
export interface SaveChecklistVars { id: string; title: string; weekId: string | null; dueDate: string | null; items: { id: string; text: string }[] }
export interface ToggleChecklistItemVars { itemId: string; done: boolean }
