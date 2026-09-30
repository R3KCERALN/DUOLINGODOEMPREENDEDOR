export const MAX_PDF_BYTES = 50 * 1024 * 1024

/** RF-61: só PDF, até 50 MB. Alguns navegadores entregam `type` vazio; nesse caso vale a extensão. */
export function validatePdfFile(f: { name: string; size: number; type: string }): string | null {
  const isPdf = f.type === 'application/pdf' || (f.type === '' && /\.pdf$/i.test(f.name))
  if (!isPdf) return 'Envie um arquivo PDF.'
  if (f.size <= 0) return 'O arquivo está vazio.'
  if (f.size > MAX_PDF_BYTES) return 'O PDF pode ter no máximo 50 MB.'
  return null
}

/** Caminho no bucket `books`: sempre dentro da pasta do livro; nome único para nunca sobrescrever. */
export const bookFilePath = (bookId: string, stamp: number): string => `${bookId}/${stamp}.pdf`

/** RF-62: link externo (compra ou audiolivro). Devolve a URL normalizada ou `null` se não for http(s). */
export function normalizeExternalUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim())
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

/** RF-63: página segura para abrir o leitor (o PDF pode ter sido trocado por um menor). */
export function clampPage(page: number, total: number | null): number {
  const p = Number.isFinite(page) ? Math.floor(page) : 1
  const min = Math.max(1, p)
  return total !== null && total >= 1 ? Math.min(min, total) : min
}

/** '1' → "Fase 1"; '2-3' → "Fases 2 e 3"; '1-3' → "Fases 1 a 3". */
export function phaseLabel(phase: string): string {
  const m = /^(\d)-(\d)$/.exec(phase)
  if (!m) return `Fase ${phase}`
  return Number(m[2]) === Number(m[1]) + 1 ? `Fases ${m[1]} e ${m[2]}` : `Fases ${m[1]} a ${m[2]}`
}
