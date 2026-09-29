import { useState, type ReactNode } from 'react'
import { Badge, BottomNav, Button, Card, Checkbox, PathNode, PixelIcon, ProgressBar, TextArea } from './ui'

// Mock estático da roleta: [anterior, sorteado, próximo] por rolo.
const reels = [
  { name: 'Objetivo', items: ['Agendar visita', 'Fechar à vista', 'Vender o kit'] },
  { name: 'Cliente', items: ['Apressada', 'Desconfiada', 'Indecisa'] },
  { name: 'Produto', items: ['Perfume', 'Kit skincare', 'Maquiagem'] },
  { name: 'Complicação', items: ['Nenhuma', 'Achou caro', 'Vai pensar'] },
]

const nav = [
  { to: '/ui', label: 'Hoje', icon: <PixelIcon name="today" /> },
  { to: '/trilha', label: 'Trilha', icon: <PixelIcon name="trail" /> },
  { to: '/simulados', label: 'Simulados', icon: <PixelIcon name="reels" /> },
  { to: '/caderno', label: 'Caderno', icon: <PixelIcon name="notes" /> },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-bold text-muted">{title}</h2>
      {children}
    </section>
  )
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="-mx-4 flex flex-col">
      <div className="relative">
        <img src="/art/lobo1.png" alt="" width={480} height={230} className="pixelated block w-full" />
        <div aria-hidden className="pointer-events-none absolute inset-0 scanlines" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-8 dither-fade" />
      </div>
      <div className="flex flex-col gap-4 px-4 pt-2">
        <div>
          <p className="font-bold text-muted">Fase 2, semana 5 de 16</p>
          <h1 id="hero-title" className="font-display text-6xl leading-[0.95] font-black text-brand text-glow">Semana 5</h1>
          <p className="mt-1 text-xl font-bold">Mentalidade de vendas</p>
        </div>
        <ProgressBar value={0.4} label="Progresso da semana 5" tone="f2" />
        <Button size="lg" className="w-full">Abrir a semana</Button>
      </div>
    </section>
  )
}

function ReelsMock() {
  return (
    <section aria-labelledby="reels-title" className="rounded-card border-2 border-edge bg-surface p-3 shadow-press">
      <div className="flex items-center justify-between px-1 pb-3">
        <h2 id="reels-title" className="font-display text-3xl font-black text-brand text-glow">Roleta</h2>
        <Badge tone="muted">Médio</Badge>
      </div>
      <div className="relative grid grid-cols-4 gap-1 rounded-control border-2 border-line bg-bg p-1">
        {reels.map((r) => (
          <div key={r.name} className="relative grid h-48 grid-rows-3 overflow-hidden rounded-[4px] border border-edge text-center">
            {r.items.map((item, i) => (
              <p key={item} className={`grid place-items-center px-1 text-[13px] leading-tight ${i === 1 ? 'font-bold text-ink' : 'text-muted'}`}>
                {item}
              </p>
            ))}
            <div aria-hidden className="absolute inset-x-0 top-0 h-8 rotate-180 dither-fade" />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-8 dither-fade" />
          </div>
        ))}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-16 -translate-y-1/2 border-y-2 border-brand glow" />
      </div>
      <div className="grid grid-cols-4 gap-1 pt-2 text-center text-[11px] font-bold text-muted">
        {reels.map((r) => <span key={r.name}>{r.name}</span>)}
      </div>
      <Button size="lg" className="mt-3 w-full">Girar</Button>
    </section>
  )
}

export default function UiPreview() {
  const [checked, setChecked] = useState(false)
  const [text, setText] = useState('')
  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 overflow-x-clip px-4 pb-32">
      <Hero />
      <ReelsMock />
      <Section title="Botões">
        <div className="flex flex-wrap gap-3">
          <Button>Começar</Button>
          <Button variant="secondary">Pular</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="danger">Excluir</Button>
          <Button loading>Enviando</Button>
        </div>
      </Section>
      <Section title="Selos">
        <div className="flex flex-wrap gap-2">
          <Badge tone="streak">12 dias seguidos</Badge>
          <Badge tone="success">Concluída</Badge>
          <Badge tone="brand">Nova</Badge>
          <Badge tone="muted">Treino</Badge>
        </div>
      </Section>
      <Section title="Fichas da trilha">
        <div className="flex items-center justify-between">
          <PathNode state="done" phase="f1" label="Semana 1" />
          <PathNode state="available" phase="f2" label="Semana 5" />
          <PathNode state="locked" phase="f3" label="Semana 11" />
          <PathNode state="done" phase="f4" label="Semana 16" />
        </div>
      </Section>
      <Section title="Energia por fase">
        <div className="flex flex-col gap-3">
          {([['f1', 1], ['f2', 0.4], ['f3', 0.15], ['f4', 0]] as const).map(([f, v]) => (
            <div key={f} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm"><span className="font-bold">Fase {f[1]}</span><span className="tabular-nums text-muted">{v * 100}%</span></div>
              <ProgressBar value={v} label={`Fase ${f[1]}`} tone={f} />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Caderno">
        <Card><Checkbox checked={checked} onChange={setChecked} label="Assistiu ao vídeo da semana" /></Card>
        <Card><TextArea label="1 coisa que aprendi" value={text} onChange={setText} minChars={15} /></Card>
        <Card className="border-brand">
          <p className="text-sm font-bold text-muted">O cliente acabou de dizer:</p>
          <p className="mt-1 text-lg font-extrabold">"Olha, achei caro. Tá fora do meu orçamento."</p>
        </Card>
      </Section>
      <BottomNav items={nav} />
    </main>
  )
}
