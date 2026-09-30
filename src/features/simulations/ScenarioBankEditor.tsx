import { useState } from 'react'
import { Badge, Button, Card, Checkbox, TextArea } from '@/design/ui'
import { REEL_TITLES, validateChallengeText, validateReelItem, type ReelNumber } from '@/domain/scenarioBank'
import {
  useSaveChallengeCard, useSaveReelItem, useScenarioBank, useSetChallengeCardActive, useSetReelItemActive,
} from './hooks'
import type { BankItem, ChallengeCard } from './types'

type Tab = ReelNumber | 'cards'
const TABS: { key: Tab; label: string }[] = [
  { key: 1, label: REEL_TITLES[1] }, { key: 2, label: REEL_TITLES[2] }, { key: 3, label: REEL_TITLES[3] },
  { key: 4, label: 'Complicação' }, { key: 'cards', label: 'Perguntas do produto' },
]

const inputClass = 'h-12 rounded-control border-2 border-line bg-surface px-3 font-normal focus:border-brand focus:outline-none'

function ReelTab({ reel, items }: { reel: ReelNumber; items: BankItem[] }) {
  const save = useSaveReelItem()
  const setActive = useSetReelItemActive()
  const [editing, setEditing] = useState<BankItem | null>(null)
  const [label, setLabel] = useState('')
  const [mentorRole, setMentorRole] = useState('')
  const [studentGoal, setStudentGoal] = useState('')
  const [clientLine, setClientLine] = useState('')

  const draft = { reel, label, mentorRole, studentGoal, clientLine }
  const problem = validateReelItem(draft)
  const activeCount = items.filter((i) => i.active && !i.isNone).length

  function reset() { setEditing(null); setLabel(''); setMentorRole(''); setStudentGoal(''); setClientLine('') }
  function edit(i: BankItem) {
    setEditing(i); setLabel(i.label); setMentorRole(i.mentorRole ?? ''); setStudentGoal(i.studentGoal ?? ''); setClientLine(i.clientLine ?? '')
  }

  return (
    <div className="flex flex-col gap-4">
      {reel !== 4 && activeCount === 0 && (
        <p role="alert" className="text-danger">Ative pelo menos um item: a roleta precisa de objetivo, perfil e produto.</p>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-3 rounded-card border border-edge bg-surface p-3">
            <div className="flex flex-col gap-1">
              <span className={`font-bold ${i.active ? '' : 'text-muted line-through'}`}>{i.label}</span>
              {i.mentorRole && <span className="text-sm text-muted">Você interpreta: {i.mentorRole}</span>}
              {i.studentGoal && <span className="text-sm text-muted">Meta dela: {i.studentGoal}</span>}
              {i.clientLine && <span className="text-sm text-muted">“{i.clientLine}”</span>}
              <span className="flex gap-2">{i.original && <Badge tone="muted">Original</Badge>}{i.isNone && <Badge tone="muted">Fixo</Badge>}</span>
            </div>
            {!i.isNone && (
              <div className="flex flex-col items-end gap-2">
                <Checkbox checked={i.active} onChange={(a) => setActive.mutate({ id: i.id, active: a })} label={`Ativo: ${i.label}`} disabled={setActive.isPending} />
                <Button size="sm" variant="ghost" onClick={() => edit(i)}>Editar {i.label}</Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <Card className="flex flex-col gap-3">
        <h3 className="font-bold">{editing ? `Editando ${editing.label}` : 'Novo item'}</h3>
        <label className="flex flex-col gap-1 font-bold">Nome
          <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
        </label>
        {reel === 1 && (
          <>
            <label className="flex flex-col gap-1 font-bold">Papel do mentor
              <input value={mentorRole} onChange={(e) => setMentorRole(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 font-bold">Meta dela
              <input value={studentGoal} onChange={(e) => setStudentGoal(e.target.value)} className={inputClass} />
            </label>
          </>
        )}
        {reel === 4 && <TextArea label="Fala do cliente (1ª pessoa)" value={clientLine} onChange={setClientLine} />}
        {label !== '' && problem && <p aria-live="polite" className="text-sm text-muted">{problem}</p>}
        {save.error && <p role="alert" className="text-danger">{save.error.message}</p>}
        <div className="flex gap-2">
          <Button disabled={problem !== null} loading={save.isPending}
            onClick={() => save.mutate({ id: editing?.id, ...draft }, { onSuccess: reset })}>
            {editing ? 'Salvar alterações' : 'Adicionar'}
          </Button>
          {editing && <Button variant="ghost" onClick={reset}>Cancelar</Button>}
        </div>
      </Card>
    </div>
  )
}

function CardsTab({ cards }: { cards: ChallengeCard[] }) {
  const save = useSaveChallengeCard()
  const setActive = useSetChallengeCardActive()
  const [editing, setEditing] = useState<ChallengeCard | null>(null)
  const [text, setText] = useState('')
  const problem = validateChallengeText(text)
  const reset = () => { setEditing(null); setText('') }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {cards.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-3 rounded-card border border-edge bg-surface p-3">
            <span className={c.active ? '' : 'text-muted line-through'}>{c.text}</span>
            <div className="flex flex-col items-end gap-2">
              <Checkbox checked={c.active} onChange={(a) => setActive.mutate({ id: c.id, active: a })} label={`Ativa: ${c.text}`} disabled={setActive.isPending} />
              <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setText(c.text) }}>Editar {c.id}</Button>
            </div>
          </li>
        ))}
      </ul>
      <Card className="flex flex-col gap-3">
        <h3 className="font-bold">{editing ? `Editando ${editing.id}` : 'Nova pergunta'}</h3>
        <TextArea label="Pergunta do cliente" value={text} onChange={setText} />
        {save.error && <p role="alert" className="text-danger">{save.error.message}</p>}
        <div className="flex gap-2">
          <Button disabled={problem !== null} loading={save.isPending} onClick={() => save.mutate({ id: editing?.id, text }, { onSuccess: reset })}>
            {editing ? 'Salvar alterações' : 'Adicionar'}
          </Button>
          {editing && <Button variant="ghost" onClick={reset}>Cancelar</Button>}
        </div>
      </Card>
    </div>
  )
}

/** `/cenarios` (só mentor): adicionar, editar e desativar itens dos 4 rolos e do baralho (RF-84/85). */
export function ScenarioBankEditor() {
  const bank = useScenarioBank()
  const [tab, setTab] = useState<Tab>(1)

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-6 pb-8">
      <h1 className="font-display text-4xl leading-none font-black text-brand text-glow">Cenários</h1>
      <div role="tablist" aria-label="Rolos" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.key} role="tab" aria-selected={tab === t.key} size="sm" variant={tab === t.key ? 'primary' : 'secondary'} onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>
      {bank.isLoading && <p role="status" className="text-muted">Carregando…</p>}
      {bank.error && <p role="alert" className="text-danger">Não foi possível carregar o banco de cenários.</p>}
      {bank.data && (tab === 'cards'
        ? <CardsTab cards={bank.data.challenges} />
        : <ReelTab key={tab} reel={tab} items={bank.data.items.filter((i) => i.reel === tab)} />)}
    </main>
  )
}
