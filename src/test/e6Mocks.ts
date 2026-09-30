import type { Book } from '@/features/library/types'
import type { Checklist } from '@/features/checklists/types'
import type { JournalEntry } from '@/features/journal/types'
import type { Note } from '@/features/notes/types'

export { asyncMutationOf, mutationOf, queryOf } from './simulationMocks'

export function entryOf(over: Partial<JournalEntry> = {}): JournalEntry {
  return {
    date: '2026-09-29', learned: 'aprendi a ouvir o cliente', practiced: 'pratiquei o pitch de 30 s', tomorrow: 'ligar para 3 empresas',
    complete: true, late: false, createdAt: '2026-09-29T22:10:00Z', updatedAt: '2026-09-29T23:02:00Z', ...over,
  }
}

export function noteOf(over: Partial<Note> = {}): Note {
  return { id: 'n1', title: 'Ideias de abertura', body: 'Começar pelo **porquê**.', private: true, link: null, updatedAt: '2026-09-29T15:00:00Z', mine: true, ...over }
}

export function checklistOf(over: Partial<Checklist> = {}): Checklist {
  return {
    id: 'c1', title: 'Semana 5', weekId: 'w05', dueDate: null, createdAt: '2026-09-29T15:00:00Z', mine: true,
    items: [
      { id: 'i1', text: 'Ligar para 5 empresas', done: true, position: 0 },
      { id: 'i2', text: 'Escrever 10 respostas', done: false, position: 1 },
    ],
    ...over,
  }
}

export function bookOf(over: Partial<Book> = {}): Book {
  return {
    id: 'carnegie', order: 1, title: 'Como Fazer Amigos e Influenciar Pessoas', author: 'Dale Carnegie', phase: '1', kind: 'livro',
    filePath: null, externalUrl: null, progress: null, ...over,
  }
}

export const courseOf = (over: Partial<Book> = {}): Book =>
  bookOf({ id: 'sebrae', order: 2, title: 'Cursos online Sebrae', author: null, phase: '2-3', kind: 'curso', externalUrl: 'https://loja.sebrae.com.br/cursos/cursos-online', ...over })
