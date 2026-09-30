import { useEffect, useRef, useState } from 'react'
import { Document, Page } from 'react-pdf'
import { Button } from '@/design/ui'
import { clampPage } from '@/domain/library'
import './pdfWorker'

export interface PdfReaderProps {
  /** URL assinada do PDF (RF-65). */
  url: string
  /** Última página lida (RF-63); o leitor a ajusta ao tamanho real do PDF. */
  initialPage: number
  /** Chamado ao abrir e a cada troca de página. */
  onPageChange?: (page: number, total: number) => void
}

/** Leitor de PDF embutido (PDF.js via react-pdf), que abre na última página lida. Camadas de texto e de anotação desligadas: só a imagem da página. */
export function PdfReader({ url, initialPage, onPageChange }: PdfReaderProps) {
  const [total, setTotal] = useState<number | null>(null)
  const [page, setPage] = useState(() => clampPage(initialPage, null))
  const [typed, setTyped] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [width, setWidth] = useState(360)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.floor(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function go(next: number) {
    const safe = clampPage(next, total)
    setPage(safe)
    if (total !== null) onPageChange?.(safe, total)
  }

  // O número digitado só vale ao dar Enter ou sair do campo; digitar "17" não passa por "1" nem "7".
  function commitTyped() {
    if (typed !== null && typed !== '') go(Number(typed))
    setTyped(null)
  }

  return (
    <div ref={box} className="flex w-full flex-col gap-3">
      {failed ? (
        <p role="alert" className="text-danger">Não foi possível abrir o PDF. Recarregue a página ou peça ao mentor para enviar de novo.</p>
      ) : (
        <Document
          file={url}
          loading={<p role="status" className="text-muted">Abrindo o PDF…</p>}
          error={null}
          onLoadError={() => setFailed(true)}
          onLoadSuccess={({ numPages }) => {
            setTotal(numPages)
            const safe = clampPage(page, numPages)
            setPage(safe)
            onPageChange?.(safe, numPages)
          }}
        >
          <Page pageNumber={page} width={Math.min(width, 900)} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => go(page - 1)}>Página anterior</Button>
        <label className="flex items-center gap-2 text-sm font-bold">
          Ir para a página
          <input type="number" min={1} max={total ?? undefined} value={typed ?? String(page)}
            onChange={(e) => setTyped(e.target.value)} onBlur={commitTyped}
            onKeyDown={(e) => { if (e.key === 'Enter') commitTyped() }}
            className="h-9 w-20 rounded-control border-2 border-line bg-surface px-2 tabular-nums focus:border-brand" />
        </label>
        <span aria-live="polite" className="text-sm text-muted">de {total ?? '…'}</span>
        <Button size="sm" variant="secondary" disabled={total === null || page >= total} onClick={() => go(page + 1)}>Próxima página</Button>
      </div>
    </div>
  )
}
