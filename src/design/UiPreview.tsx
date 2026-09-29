import { useState } from 'react'
import { Badge, Button, Card, Checkbox, PathNode, ProgressBar, TextArea } from './ui'

export default function UiPreview() {
  const [checked, setChecked] = useState(false)
  const [text, setText] = useState('')
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-4">
      <h1 className="text-2xl font-black">Design system</h1>
      <section className="flex flex-wrap gap-3">
        <Button>Começar</Button>
        <Button variant="secondary">Pular</Button>
        <Button variant="ghost">Cancelar</Button>
        <Button loading>Enviando</Button>
      </section>
      <section className="flex gap-2"><Badge tone="streak">🔥 12 dias</Badge><Badge tone="success">Concluída</Badge><Badge tone="muted">Treino</Badge></section>
      <section className="flex items-center gap-6">
        <PathNode state="done" phase="f1" label="Semana 1" />
        <PathNode state="available" phase="f2" label="Semana 5" />
        <PathNode state="locked" phase="f3" label="Semana 11" />
      </section>
      <ProgressBar value={0.4} label="Fase 1" tone="f1" />
      <Card>
        <Checkbox checked={checked} onChange={setChecked} label="Assistiu ao vídeo da semana" />
      </Card>
      <Card><TextArea label="1 coisa que aprendi" value={text} onChange={setText} minChars={15} /></Card>
      <Card className="border-brand">
        <p className="text-sm font-bold text-muted">⚡ O cliente acabou de dizer:</p>
        <p className="mt-1 text-lg font-extrabold">"Olha, achei caro. Tá fora do meu orçamento."</p>
      </Card>
    </main>
  )
}
