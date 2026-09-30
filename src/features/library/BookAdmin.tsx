import { useState } from 'react'
import { Button, Card } from '@/design/ui'
import { MAX_PDF_BYTES } from '@/domain/library'
import { useRemoveBookFile, useSaveBookLink, useUploadBook } from './hooks'
import type { Book } from './types'

/** Só o mentor vê (RF-61/62): enviar, trocar ou remover o PDF e guardar o link externo. */
export function BookAdmin({ book }: { book: Book }) {
  const upload = useUploadBook()
  const remove = useRemoveBookFile()
  const saveLink = useSaveBookLink()
  const [link, setLink] = useState(book.externalUrl ?? '')
  const [confirming, setConfirming] = useState(false)
  const maxMb = MAX_PDF_BYTES / (1024 * 1024)

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-black">Administrar material</h2>

      <label className="flex flex-col gap-1 font-bold">
        {book.filePath ? 'Trocar o PDF' : 'Enviar o PDF'} (até {maxMb} MB)
        <input type="file" accept="application/pdf" disabled={upload.isPending}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) upload.mutate({ bookId: book.id, file, previousPath: book.filePath })
            e.target.value = ''
          }}
          className="font-normal file:mr-3 file:rounded-control file:border-2 file:border-line file:bg-raised file:px-3 file:py-2 file:font-bold" />
      </label>
      {upload.isPending && <p role="status" className="text-muted">Enviando o PDF…</p>}
      {upload.error && <p role="alert" className="text-danger">{upload.error.message}</p>}

      {book.filePath && (
        <div className="flex gap-2">
          {confirming
            ? <Button variant="danger" size="sm" loading={remove.isPending} onClick={() => { remove.mutate({ bookId: book.id, filePath: book.filePath! }); setConfirming(false) }}>Confirmar remoção</Button>
            : <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>Remover PDF</Button>}
        </div>
      )}
      {remove.error && <p role="alert" className="text-danger">{remove.error.message}</p>}

      <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); saveLink.mutate({ bookId: book.id, externalUrl: link }) }}>
        <label className="flex flex-col gap-1 font-bold">Link externo (compra ou audiolivro)
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://"
            className="h-12 rounded-control border-2 border-line bg-surface px-3 font-normal focus:border-brand focus:outline-none" />
        </label>
        <Button type="submit" size="sm" variant="secondary" loading={saveLink.isPending}>Salvar link</Button>
        {saveLink.error && <p role="alert" className="text-danger">{saveLink.error.message}</p>}
        {saveLink.isSuccess && <p role="status" className="text-sm text-success">Link salvo.</p>}
      </form>
    </Card>
  )
}
