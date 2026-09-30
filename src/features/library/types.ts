export interface BookProgress { page: number; totalPages: number | null; updatedAt: string }

export interface Book {
  id: string
  order: number
  title: string
  author: string | null
  phase: string
  kind: 'livro' | 'curso'
  /** Caminho no bucket privado `books` (`<id>/<timestamp>.pdf`); `null` = "PDF ainda não disponível". */
  filePath: string | null
  externalUrl: string | null
  /** Última página lida (só a aluna grava). */
  progress: BookProgress | null
}

export interface SaveProgressVars { bookId: string; page: number; totalPages: number | null }
export interface UploadBookVars { bookId: string; file: File; previousPath: string | null }
export interface RemoveBookFileVars { bookId: string; filePath: string }
export interface SaveBookLinkVars { bookId: string; externalUrl: string | null }
