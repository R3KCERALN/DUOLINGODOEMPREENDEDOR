# Trilha App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o PWA "Trilha: de iniciante a empresária e grande vendedora" descrito no PRD, pronto para produção em Vercel + Supabase.

**Architecture:** SPA React (Vite) mobile-first hospedada na Vercel, falando direto com o Supabase (Auth por magic link, Postgres com RLS, Storage privado). O conteúdo da trilha vive em código (`src/content`) com IDs estáveis; o banco guarda só progresso e dados gerados pelas usuárias. Regras de negócio ficam em módulos puros em `src/domain` (100% testados); regras de segurança ficam no banco (RLS + triggers, testados com pgTAP).

**Tech Stack:** Vite 8 · React 19 · TypeScript · React Router 8 · TanStack Query 5 · Tailwind CSS 4 · Supabase (supabase-js 2, CLI 2) · Recharts 3 · react-pdf 11 · vite-plugin-pwa 1 · idb-keyval 6 · Vitest 5 · Testing Library 16 · Playwright 1.63 · pgTAP

**Spec:** `PRD.md` (v1.2). Leia o PRD inteiro antes da primeira tarefa; cada tarefa cita os RFs que implementa.

## Global Constraints

- Interface 100% em pt-BR (RNF-02). Código, nomes de arquivo e commits em inglês.
- Mobile-first, utilizável a partir de 360 px; instalável como PWA (RNF-01).
- Todas as tabelas com RLS ativado; nenhum acesso anônimo (RNF-03).
- Custo zero de API: nenhuma chamada a LLM ou serviço pago; gravação só com APIs do navegador (RNF-09).
- Nenhum segredo no front-end além de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (RNF-07). `.env.local` nunca é commitado.
- Fuso de todas as regras de data: `America/Sao_Paulo` (RF-50, RF-99). O servidor é a autoridade; o cliente só espelha para UI.
- Contraste mínimo WCAG AA; respeitar `prefers-reduced-motion` (RNF-06).
- Plano gratuito de Supabase e Vercel (RNF-04); livros ≤ 50 MB; áudio ~24 kbps, limite 12 min (RNF-11, RF-76b).
- Apenas 2 contas (`aluna`, `mentor`), cadastro público desativado (RF-03).
- Cartas do treino são **somente texto**, sem voz (RF-76e).
- Não adicionar dependências de produção além das listadas no Tech Stack sem justificar no PR.

## Review Focus

1. **Fronteira do prazo do caderno:** entrada de ontem salva às 11:59 (SP) deve ser aceita como `late`; às 12:00 deve ser recusada; celular com fuso diferente de SP não pode mudar isso. → pgTAP em Task 5 (`journal_window`) + unit em Task 9.
2. **Aluna consultando a API direto:** `select` em `simulation_scenarios` de simulado surpresa não revelado deve retornar 0 linhas, mesmo sem passar pela UI. → pgTAP em Task 5.
3. **Banco de cenários esvaziado pelo mentor:** todos os objetivos desativados, ou menos complicações ativas que o necessário, não pode quebrar a roleta; deve retornar erro legível ou usar o que houver. → unit em Task 8.
4. **Ficha enviada duas vezes (toque duplo) ou nota fora de 1–5:** o banco deve recusar (unique + check) e a nota oficial nunca deve ser calculada com uma ficha só. → pgTAP em Task 5 + unit em Task 7.
5. **Override do mentor no meio da trilha:** mentor libera a semana 7 com a 6 incompleta; quando a 7 for concluída, a 8 deve ser liberada; bloquear manualmente uma semana concluída a mostra como bloqueada. → unit em Task 6.

---

# Parte 1 — Roteiro mestre

| Etapa | Nome | Entrega | RFs | Plano detalhado |
|---|---|---|---|---|
| **E1** | Fundação | Projeto, tooling, schema + RLS, auth, deploy de preview | RF-01–03, RNF-03/07, §7 | **Parte 2 deste arquivo (Tasks 1–5, 12)** |
| **E2** | Design system (**início do estilo**) | Direção visual aprovada, tokens, componentes base, página `/ui` | RNF-01/06 | **Parte 2 (Tasks 10–11)** |
| **E3** | Domínio | Regras puras testadas: desbloqueio, notas, roleta, cartas, caderno, streak, itens automáticos | RF-12–16, 40, 50, 71–72, 76c–d, 81, 99 | **Parte 2 (Tasks 6–9)** |
| E4 | Trilha | Mapa, tela da semana, tela Hoje, checklists auto/fase, override do mentor | RF-10–32, 40–42 | Escrever ao concluir E1–E3 |
| E5 | Simulados | Roleta animada, modo surpresa, treino solo (cartas texto, gravação, fila offline), fichas, "Treinos para avaliar", banco editável | RF-70–85, 76a–j | Escrever ao concluir E4 |
| E6 | Caderno e Biblioteca | Caderno obrigatório, notas livres privadas, checklists manuais, upload de PDF, leitor | RF-50–54, 60–65 | Escrever ao concluir E5 |
| E7 | Painéis | Gráficos mentor/aluna, caderno em dia, heatmap, streak, uso de Storage | RF-90–99a, RNF-11 | Escrever ao concluir E6 |
| E8 | Produção | PWA, Wake Lock, acessibilidade, E2E, `pg_cron` de retenção, revisão de segurança, go-live | RNF-01/05/06/10, RF-76j | Escrever ao concluir E7 |

**Ordem de execução da Parte 2:** Tasks 1 → 5 (fundação), 6 → 9 (domínio, podem ser feitas em paralelo entre si), 10 → 11 (design system), 12 (deploy de preview). E2 depende só da Task 1; E3 depende só da Task 1.

**Critério de pronto de cada etapa:** todos os testes verdes (`npm test`, `npx supabase test db`), `npm run build` sem erro, deploy de preview funcionando, revisão de código feita.

### Resumo das etapas futuras (para orientar, não para executar ainda)

**E4 — Trilha:** `features/trail/TrailMap.tsx` (caminho vertical com `PathNode`), `features/trail/WeekScreen.tsx` (vídeos em `youtube-nocookie`, leitura, prática, escada do medo), `features/today/TodayScreen.tsx` (rotina + caderno fixado + streak), hooks `useProgress`/`useNodeStates` sobre `item_progress` e `node_overrides` usando `computeNodeStates` e `deriveAutoChecks`. E2E: concluir semana → próxima liberada.

**E5 — Simulados:** `features/simulations/SlotMachine.tsx` (4 rolos, Web Animations API, parada em sequência, reduced-motion), `SurpriseFlow` (mentor) e `SoloTraining` (aluna: cronômetro, `MediaRecorder` com detecção de mime, cartas via `scheduleCards`, fila `idb-keyval` com reenvio), `ScoreSheet` (6 critérios, bloqueio de envio duplo), `ReviewQueue` (player com marcadores), `ScenarioBankEditor`. E2E com duas sessões e microfone falso.

**E6 — Caderno e Biblioteca:** `JournalForm` com contador de 15 caracteres por campo e estados no prazo/atraso/fechado, notas Markdown com salvamento automático e busca `tsvector`, `ChecklistEditor`, `BookUpload` (só mentor, 50 MB), `PdfReader` com retomada de página.

**E7 — Painéis:** `Dashboard` por papel com Recharts (linha com metas 15/22, aluna × mentor, radar, barras de checklist), `ActivityHeatmap`, `JournalCompliance`, uso de Storage.

**E8 — Produção:** manifest + ícones, Wake Lock no treino, auditoria de acessibilidade, `pg_cron` (retenção de áudio), projeto Supabase de produção (`supabase db push`), convites das 2 contas, domínio Vercel, checklist de go-live.

---

# Parte 2 — Plano detalhado: E1 Fundação, E3 Domínio, E2 Design system

## Estrutura de arquivos (criada nesta parte)

```
.
├── PRD.md, PLAN.md
├── index.html
├── package.json, tsconfig*.json, vite.config.ts, vercel.json
├── .env.example                      # nomes das variáveis, sem valores
├── src/
│   ├── main.tsx                      # bootstrap: QueryClient, Router, AuthProvider
│   ├── App.tsx                       # rotas
│   ├── lib/
│   │   ├── supabase.ts               # cliente único
│   │   └── dates.ts                  # spDate, spHour, addDays (fuso SP)
│   ├── content/
│   │   ├── types.ts                  # tipos do conteúdo da trilha
│   │   └── trail.ts                  # fases, semanas, itens, portões (Apêndice A do PRD)
│   ├── domain/                       # regras puras, sem React/Supabase
│   │   ├── rng.ts                    # RNG com semente (testes determinísticos)
│   │   ├── unlock.ts (+ .test.ts)
│   │   ├── scoring.ts (+ .test.ts)
│   │   ├── phaseChecks.ts (+ .test.ts)
│   │   ├── roulette.ts (+ .test.ts)
│   │   ├── cards.ts (+ .test.ts)
│   │   ├── journal.ts (+ .test.ts)
│   │   └── streak.ts (+ .test.ts)
│   ├── features/auth/
│   │   ├── AuthProvider.tsx          # sessão + perfil (papel)
│   │   ├── RequireAuth.tsx           # guarda de rota
│   │   └── LoginScreen.tsx           # magic link
│   └── design/
│       ├── tokens.css                # tokens (Tailwind @theme) claro/escuro
│       ├── tokens.test.ts            # contraste AA dos pares de tokens
│       ├── ui/                       # componentes base
│       │   ├── Button.tsx, Card.tsx, Badge.tsx, ProgressBar.tsx
│       │   ├── Checkbox.tsx, TextArea.tsx, PathNode.tsx, BottomNav.tsx
│       │   └── ui.test.tsx
│       └── UiPreview.tsx             # rota /ui (só em dev)
└── supabase/
    ├── config.toml
    ├── migrations/20260929000001_schema.sql
    ├── migrations/20260929000002_rls.sql
    ├── migrations/20260929000003_journal.sql
    ├── seed.sql                      # livros + banco de cenários (Apêndice B)
    └── tests/
        ├── rls.test.sql
        └── journal.test.sql
```

---

### Task 1: Scaffold do projeto e tooling de testes

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`, `.env.example`, `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: scripts `npm run dev | build | test | test:watch | lint`; Vitest com jsdom e Testing Library; alias `@/` → `src/`.

- [ ] **Step 1: Inicializar git e criar o projeto Vite na raiz (mantendo PRD.md e PLAN.md)**

```bash
cd "/Users/allangiovanni/Documents/projeto teste"
git init
npm create vite@latest trilha-tmp -- --template react-ts
cp -R trilha-tmp/. . && rm -rf trilha-tmp
npm install
npm install react-router @tanstack/react-query @supabase/supabase-js
npm install -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event supabase
```

- [ ] **Step 2: Configurar Vite, Tailwind e Vitest**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

Em `tsconfig.app.json`, dentro de `compilerOptions`, adicionar:
```json
"baseUrl": ".",
"paths": { "@/*": ["src/*"] },
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

Em `package.json` → `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

`.gitignore` (acrescentar):
```
.env.local
.env.*.local
supabase/.temp
playwright-report
test-results
```

`.env.example`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 3: Escrever o teste de fumaça**

`src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from './App'

test('renderiza a tela de login para visitante', () => {
  render(<MemoryRouter initialEntries={['/login']}><AppRoutes /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument()
})
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `AppRoutes` não exportado.

- [ ] **Step 5: Implementação mínima**

`src/App.tsx`:
```tsx
import { Routes, Route, Navigate } from 'react-router'

function LoginPlaceholder() {
  return <h1>Entrar</h1>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPlaceholder />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from './App'
import './design/tokens.css'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter><AppRoutes /></BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
```

Criar `src/design/tokens.css` provisório com uma linha: `@import "tailwindcss";` (os tokens entram na Task 10). Apagar `src/App.css`, `src/index.css` e `src/assets/` do template. Em `index.html`: `<html lang="pt-BR">` e `<title>Trilha</title>`.

- [ ] **Step 6: Rodar testes e build**

Run: `npm test && npm run build`
Expected: 1 teste PASS; build sem erro.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite react-ts app with vitest and tailwind"
```

---

### Task 2: Utilitários de data no fuso de São Paulo

**Files:**
- Create: `src/lib/dates.ts`
- Test: `src/lib/dates.test.ts`

**Interfaces:**
- Produces:
  - `TZ = 'America/Sao_Paulo'`
  - `spDate(d: Date): string` → `'YYYY-MM-DD'` no fuso SP
  - `spHour(d: Date): number` → 0–23 no fuso SP
  - `addDays(iso: string, n: number): string`
  - `daysBetween(fromIso: string, toIso: string): string[]` → lista inclusiva de datas

- [ ] **Step 1: Teste**

`src/lib/dates.test.ts`:
```ts
import { spDate, spHour, addDays, daysBetween } from './dates'

test('spDate usa o fuso de SP, não o do aparelho', () => {
  // 2026-09-30T02:30Z = 29/09 23:30 em SP (UTC-3)
  expect(spDate(new Date('2026-09-30T02:30:00Z'))).toBe('2026-09-29')
  expect(spDate(new Date('2026-09-30T03:00:00Z'))).toBe('2026-09-30')
})

test('spHour', () => {
  expect(spHour(new Date('2026-09-30T14:59:00Z'))).toBe(11)
  expect(spHour(new Date('2026-09-30T15:00:00Z'))).toBe(12)
})

test('addDays atravessa mês e ano', () => {
  expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
  expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
})

test('daysBetween é inclusivo e vazio se invertido', () => {
  expect(daysBetween('2026-09-28', '2026-09-30')).toEqual(['2026-09-28', '2026-09-29', '2026-09-30'])
  expect(daysBetween('2026-09-30', '2026-09-28')).toEqual([])
})
```

- [ ] **Step 2: Ver falhar** — Run: `npx vitest run src/lib/dates.test.ts` · Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

`src/lib/dates.ts`:
```ts
export const TZ = 'America/Sao_Paulo'

const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const hourFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' })

export function spDate(d: Date): string {
  return dateFmt.format(d)
}

export function spHour(d: Date): number {
  return Number(hourFmt.format(d))
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(fromIso: string, toIso: string): string[] {
  const out: string[] = []
  for (let cur = fromIso; cur <= toIso; cur = addDays(cur, 1)) out.push(cur)
  return out
}
```

- [ ] **Step 4: Ver passar** — Run: `npx vitest run src/lib/dates.test.ts` · Expected: 4 PASS.

- [ ] **Step 5: Commit** — `git add src/lib && git commit -m "feat: add Sao Paulo timezone date helpers"`

---

### Task 3: Supabase local e schema do banco

**Files:**
- Create: `supabase/config.toml` (via CLI), `supabase/migrations/20260929000001_schema.sql`

**Interfaces:**
- Produces: todas as tabelas de PRD §7; função `public.my_role()`; tipos enum `app_role`, `sim_mode`, `sim_status`, `difficulty`, `card_kind`.

- [ ] **Step 1: Inicializar e subir o Supabase local** (requer Docker rodando)

```bash
npx supabase init
npx supabase start
```
Expected: saída com `API URL` e `anon key`. Copiar para `.env.local`:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key exibida>
```

Em `supabase/config.toml`, seção `[auth]`: `enable_signup = false`. Seção `[auth.email]`: `enable_signup = false`.

- [ ] **Step 2: Escrever a migration do schema**

`supabase/migrations/20260929000001_schema.sql`:
```sql
create extension if not exists pgtap with schema extensions;

create type public.app_role as enum ('aluna', 'mentor');
create type public.sim_mode as enum ('surpresa', 'treino');
create type public.sim_status as enum ('sorteado', 'em_andamento', 'aguardando_notas', 'concluido');
create type public.difficulty as enum ('facil', 'medio', 'dificil');
create type public.card_kind as enum ('complicacao', 'questionamento');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.app_role not null,
  name text not null
);
create unique index profiles_one_per_role on public.profiles (role);

create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create table public.item_progress (
  item_id text primary key,
  done_at timestamptz not null default now(),
  done_by uuid not null references public.profiles default auth.uid()
);

create table public.node_overrides (
  node_id text primary key,
  state text not null check (state in ('unlocked', 'locked')),
  by uuid not null references public.profiles default auth.uid(),
  at timestamptz not null default now()
);

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles default auth.uid(),
  title text not null check (char_length(title) between 1 and 120),
  week_id text,
  due_date date,
  created_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  done_at timestamptz,
  position int not null default 0
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles default auth.uid(),
  date date not null,
  learned text not null default '',
  practiced text not null default '',
  tomorrow text not null default '',
  complete boolean not null default false,
  late boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles default auth.uid(),
  title text not null default '',
  body text not null default '',
  private boolean not null default true,
  link_type text check (link_type in ('week', 'video', 'book', 'simulation')),
  link_id text,
  updated_at timestamptz not null default now(),
  search tsvector generated always as (to_tsvector('portuguese', title || ' ' || body)) stored
);
create index notes_search_idx on public.notes using gin (search);

create table public.books (
  id text primary key,
  "order" int not null,
  title text not null,
  author text,
  phase text not null,
  kind text not null check (kind in ('livro', 'curso')),
  file_path text,
  external_url text
);

create table public.book_progress (
  book_id text primary key references public.books on delete cascade,
  page int not null check (page >= 1),
  total_pages int check (total_pages >= 1),
  updated_at timestamptz not null default now()
);

create table public.reel_items (
  id text primary key,
  reel smallint not null check (reel between 1 and 4),
  label text not null,
  mentor_role text,
  student_goal text,
  client_line text,
  is_none boolean not null default false,
  original boolean not null default false,
  active boolean not null default true
);

create table public.challenge_cards (
  id text primary key,
  text text not null,
  active boolean not null default true
);

create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  mode public.sim_mode not null,
  difficulty public.difficulty not null,
  phase text not null,
  status public.sim_status not null default 'sorteado',
  is_boss boolean not null default false,
  created_by uuid not null references public.profiles default auth.uid(),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  revealed_at timestamptz
);

create table public.simulation_scenarios (
  simulation_id uuid primary key references public.simulations on delete cascade,
  objective_id text not null references public.reel_items,
  profile_id text not null references public.reel_items,
  product_id text not null references public.reel_items,
  complication_ids text[] not null default '{}'
);

create table public.simulation_scores (
  simulation_id uuid not null references public.simulations on delete cascade,
  rater_id uuid not null references public.profiles default auth.uid(),
  abertura smallint not null check (abertura between 1 and 5),
  tom smallint not null check (tom between 1 and 5),
  perguntas smallint not null check (perguntas between 1 and 5),
  escuta smallint not null check (escuta between 1 and 5),
  objecao smallint not null check (objecao between 1 and 5),
  fechamento smallint not null check (fechamento between 1 and 5),
  good text not null default '',
  improve text not null default '',
  submitted_at timestamptz not null default now(),
  primary key (simulation_id, rater_id)
);

create table public.simulation_cards (
  simulation_id uuid not null references public.simulations on delete cascade,
  position smallint not null,
  kind public.card_kind not null,
  ref_id text not null,
  shown_at_sec int check (shown_at_sec >= 0),
  primary key (simulation_id, position)
);

create table public.simulation_recordings (
  simulation_id uuid primary key references public.simulations on delete cascade,
  file_path text not null,
  mime text not null,
  duration_sec int not null check (duration_sec between 0 and 720),
  size_bytes bigint not null,
  keep boolean not null default false,
  delete_after timestamptz
);

create or replace function public.both_scored(sim uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select count(*) = 2 from public.simulation_scores where simulation_id = sim
$$;

create view public.v_simulation_official with (security_invoker = true) as
select
  simulation_id,
  round(avg(abertura)::numeric, 1)   as abertura,
  round(avg(tom)::numeric, 1)        as tom,
  round(avg(perguntas)::numeric, 1)  as perguntas,
  round(avg(escuta)::numeric, 1)     as escuta,
  round(avg(objecao)::numeric, 1)    as objecao,
  round(avg(fechamento)::numeric, 1) as fechamento,
  round(avg(abertura + tom + perguntas + escuta + objecao + fechamento)::numeric, 1) as total_official
from public.simulation_scores
group by simulation_id
having count(*) = 2;
```

- [ ] **Step 3: Aplicar** — Run: `npx supabase db reset` · Expected: "Finished supabase db reset" sem erro.

- [ ] **Step 4: Commit** — `git add supabase && git commit -m "feat(db): add core schema"`

---

### Task 4: Seed (livros e banco de cenários)

**Files:**
- Create: `supabase/seed.sql`

**Interfaces:**
- Produces: 14 linhas em `books` (12 do PRD + 2 extras da Fase 4), rolos 1–4 e `challenge_cards` exatamente como o PRD Apêndice B. IDs: `obj-01`…`obj-30`, `prof-01`…`prof-15`, `prod-01`…`prod-20`, `comp-00` (Nenhuma, `is_none = true`)…`comp-11`, `card-01`…`card-15`. Objetivos 1–15 com `original = true`.

- [ ] **Step 1: Escrever o seed** (trecho mostra o formato; incluir **todas** as linhas do Apêndice B, sem omitir)

```sql
insert into public.books (id, "order", title, author, phase, kind, external_url) values
  ('carnegie',   1, 'Como Fazer Amigos e Influenciar Pessoas', 'Dale Carnegie', '1', 'livro', null),
  ('sebrae',     2, 'Cursos online Sebrae', null, '2-3', 'curso', 'https://loja.sebrae.com.br/cursos/cursos-online'),
  ('bradesco',   3, 'Escola Virtual Fundação Bradesco', null, '1-3', 'curso', 'https://www.ev.org.br/'),
  ('gitomer',    4, 'A Bíblia de Vendas', 'Jeffrey Gitomer', '2', 'livro', null),
  ('rackham',    5, 'Alcançando Excelência em Vendas: SPIN Selling', 'Neil Rackham', '2', 'livro', null),
  ('cialdini',   6, 'As Armas da Persuasão', 'Robert Cialdini', '2', 'livro', null),
  ('ross',       7, 'Receita Previsível', 'Aaron Ross', '2', 'livro', null),
  ('ries',       8, 'A Startup Enxuta', 'Eric Ries', '3', 'livro', null),
  ('osterwalder',9, 'Business Model Generation', 'Osterwalder e Pigneur', '3', 'livro', null),
  ('kiyosaki',  10, 'Pai Rico, Pai Pobre', 'Robert Kiyosaki', '3-4', 'livro', null),
  ('voss',      11, 'Negocie Como Se Sua Vida Dependesse Disso', 'Chris Voss', '4', 'livro', null),
  ('rosenberg', 12, 'Comunicação Não-Violenta', 'Marshall Rosenberg', '4', 'livro', null),
  ('gallo',     13, 'TED: Falar, Convencer, Emocionar', 'Carmine Gallo', '4', 'livro', null),
  ('clason',    14, 'O Homem Mais Rico da Babilônia', 'George Clason', '4', 'livro', null);

insert into public.reel_items (id, reel, label, mentor_role, student_goal, original) values
  ('obj-01', 1, 'Captura de lead', 'Dono de padaria, ocupado', 'Conseguir nome, WhatsApp e melhor horário para retorno', true),
  ('obj-02', 1, 'Captura de lead', 'Recepcionista que barra a ligação', 'Passar pela recepcionista e chegar ao decisor', true),
  -- ... obj-03 a obj-15 (original = true) e obj-16 a obj-30 (original = false), conforme PRD Apêndice B
  ('obj-30', 1, 'Recomendação online', 'Cliente que viu anúncio', 'Qualificar e levar à compra', false);

insert into public.reel_items (id, reel, label) values
  ('prof-01', 2, 'Apressado'),
  -- ... prof-02 a prof-15 na ordem do Apêndice B
  ('prod-01', 3, 'Plano de internet'),
  -- ... prod-02 a prod-20 (7 do PDF, depois os 13 novos)
  ('prod-20', 3, 'Cosméticos por revenda');

insert into public.reel_items (id, reel, label, client_line, is_none) values
  ('comp-00', 4, 'Nenhuma', null, true),
  ('comp-01', 4, 'Tá caro', 'Olha, achei caro. Tá fora do meu orçamento.', false),
  -- ... comp-02 a comp-11 com as falas do Apêndice B
  ('comp-11', 4, 'Garantia por escrito', 'Você me garante isso por escrito?', false);

insert into public.challenge_cards (id, text) values
  ('card-01', 'Isso funciona mesmo? Tem alguém que já usou e posso conversar?'),
  -- ... card-02 a card-15
  ('card-15', 'Por que o preço é esse? Do que ele é composto?');
```

> Os comentários `-- ...` acima indicam onde o executor transcreve as linhas do PRD Apêndice B. O arquivo final **não pode** conter esses comentários; o Step 2 verifica isso.

- [ ] **Step 2: Aplicar e conferir contagens**

Run:
```bash
grep -c -- '-- \.\.\.' supabase/seed.sql   # Expected: 0
npx supabase db reset
npx supabase db query "select reel, count(*) from reel_items group by reel order by reel; select count(*) from challenge_cards; select count(*) from books; select count(*) from reel_items where original;"
```
Expected: rolo 1 = 30, 2 = 15, 3 = 20, 4 = 12; cartas = 15; livros = 14; originais = 15.
(Se `db query` não existir na versão do CLI, usar `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "..."`.)

- [ ] **Step 3: Commit** — `git add supabase/seed.sql && git commit -m "feat(db): seed books and scenario bank"`

---

### Task 5: RLS, trigger do caderno e testes pgTAP

**Files:**
- Create: `supabase/migrations/20260929000002_rls.sql`, `supabase/migrations/20260929000003_journal.sql`, `supabase/tests/rls.test.sql`, `supabase/tests/journal.test.sql`

**Interfaces:**
- Consumes: schema da Task 3.
- Produces: `public.journal_window(entry date, at timestamptz) returns text` (`'on_time' | 'late' | 'closed'`); trigger `journal_guard`; políticas de PRD §7.1; buckets `books` e `recordings` com políticas.

- [ ] **Step 1: Escrever os testes pgTAP primeiro**

`supabase/tests/journal.test.sql`:
```sql
begin;
select plan(7);

-- 29/09 às 23:59 SP = 30/09 02:59Z
select is(public.journal_window('2026-09-29', '2026-09-30T02:59:00Z'), 'on_time', 'mesmo dia em SP');
-- 30/09 11:59 SP = 14:59Z
select is(public.journal_window('2026-09-29', '2026-09-30T14:59:00Z'), 'late', 'ontem antes do meio-dia');
select is(public.journal_window('2026-09-29', '2026-09-30T15:00:00Z'), 'closed', 'ontem ao meio-dia fecha');
select is(public.journal_window('2026-09-27', '2026-09-30T10:00:00Z'), 'closed', 'anteontem fechado');
select is(public.journal_window('2026-10-01', '2026-09-30T10:00:00Z'), 'closed', 'futuro fechado');

-- trigger: completude calculada no banco
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'aluna@test');
insert into public.profiles values ('00000000-0000-0000-0000-00000000000a', 'aluna', 'Aluna');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

insert into public.journal_entries (date, learned, practiced, tomorrow, complete)
values (timezone('America/Sao_Paulo', now())::date, 'aprendi algo útil hoje', 'curto', 'amanhã vou treinar mais', true);
select is((select complete from public.journal_entries limit 1), false, 'cliente não força complete; campo curto');

select throws_ok(
  $$ insert into public.journal_entries (date, learned, practiced, tomorrow)
     values (timezone('America/Sao_Paulo', now())::date - 5, 'x', 'y', 'z') $$,
  'P0001', 'journal_closed', 'recusa dia fechado');

select * from finish();
rollback;
```

`supabase/tests/rls.test.sql`:
```sql
begin;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'aluna@test'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor@test');
insert into public.profiles values
  ('00000000-0000-0000-0000-00000000000a', 'aluna', 'Aluna'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor', 'Mentor');

insert into public.simulations (id, mode, difficulty, phase, created_by)
values ('11111111-1111-1111-1111-111111111111', 'surpresa', 'medio', 'f2', '00000000-0000-0000-0000-00000000000b');
insert into public.simulation_scenarios values ('11111111-1111-1111-1111-111111111111', 'obj-06', 'prof-01', 'prod-01', '{comp-01}');
insert into public.notes (author, title, private) values
  ('00000000-0000-0000-0000-00000000000a', 'segredo', true),
  ('00000000-0000-0000-0000-00000000000a', 'pública', false);

-- como aluna
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.simulation_scenarios), 0, 'aluna não vê cenário surpresa não revelado');
select throws_ok($$ insert into public.reel_items (id, reel, label) values ('x', 1, 'x') $$, '42501', null, 'aluna não edita banco de cenários');
insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
values ('11111111-1111-1111-1111-111111111111', 3, 3, 3, 3, 3, 3);
select throws_ok($$ insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
  values ('11111111-1111-1111-1111-111111111111', 3, 3, 3, 3, 3, 3) $$, '23505', null, 'ficha duplicada recusada');
select throws_ok($$ update public.simulation_scores set abertura = 6 $$, '23514', null, 'nota fora de 1-5 recusada');

-- como mentor
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from public.notes), 1, 'mentor vê só a nota não privada');
select is((select count(*)::int from public.simulation_scores), 0, 'mentor não vê ficha da aluna antes de enviar a dele');
insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
values ('11111111-1111-1111-1111-111111111111', 5, 5, 5, 5, 5, 5);
update public.simulations set revealed_at = now(), status = 'concluido' where id = '11111111-1111-1111-1111-111111111111';
select is((select total_official from public.v_simulation_official), 24.0::numeric, 'oficial = média (18 e 30)');

-- aluna depois da revelação
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.simulation_scenarios), 1, 'aluna vê cenário após revelação');

select * from finish();
rollback;
```

- [ ] **Step 2: Ver falhar** — Run: `npx supabase test db` · Expected: FAIL (`journal_window` inexistente; políticas ausentes permitem leitura).

- [ ] **Step 3: Implementar o caderno**

`supabase/migrations/20260929000003_journal.sql`:
```sql
create or replace function public.journal_window(entry date, at timestamptz) returns text
language sql immutable set search_path = '' as $$
  select case
    when entry = (at at time zone 'America/Sao_Paulo')::date then 'on_time'
    when entry = (at at time zone 'America/Sao_Paulo')::date - 1
         and extract(hour from at at time zone 'America/Sao_Paulo') < 12 then 'late'
    else 'closed'
  end
$$;

create or replace function public.journal_guard() returns trigger
language plpgsql set search_path = '' as $$
declare w text := public.journal_window(new.date, now());
begin
  if w = 'closed' then
    raise exception 'journal_closed' using errcode = 'P0001';
  end if;
  new.complete := char_length(btrim(new.learned)) >= 15
              and char_length(btrim(new.practiced)) >= 15
              and char_length(btrim(new.tomorrow)) >= 15;
  if tg_op = 'UPDATE' and old.complete and not old.late then
    new.late := false;              -- já foi concluído no prazo; editar depois não vira atraso
  else
    new.late := new.complete and w = 'late';
  end if;
  new.updated_at := now();
  new.created_at := case when tg_op = 'INSERT' then now() else old.created_at end;
  new.user_id := case when tg_op = 'INSERT' then auth.uid() else old.user_id end;
  return new;
end $$;

create trigger journal_guard before insert or update on public.journal_entries
for each row execute function public.journal_guard();
```

- [ ] **Step 4: Implementar RLS e Storage**

`supabase/migrations/20260929000002_rls.sql`:
```sql
alter table public.profiles              enable row level security;
alter table public.item_progress         enable row level security;
alter table public.node_overrides        enable row level security;
alter table public.checklists            enable row level security;
alter table public.checklist_items       enable row level security;
alter table public.journal_entries       enable row level security;
alter table public.notes                 enable row level security;
alter table public.books                 enable row level security;
alter table public.book_progress         enable row level security;
alter table public.reel_items            enable row level security;
alter table public.challenge_cards       enable row level security;
alter table public.simulations           enable row level security;
alter table public.simulation_scenarios  enable row level security;
alter table public.simulation_scores     enable row level security;
alter table public.simulation_cards      enable row level security;
alter table public.simulation_recordings enable row level security;

-- leitura comum às duas contas
create policy read_all on public.profiles        for select to authenticated using (true);
create policy read_all on public.item_progress   for select to authenticated using (true);
create policy read_all on public.node_overrides  for select to authenticated using (true);
create policy read_all on public.checklists      for select to authenticated using (true);
create policy read_all on public.checklist_items for select to authenticated using (true);
create policy read_all on public.books           for select to authenticated using (true);
create policy read_all on public.book_progress   for select to authenticated using (true);
create policy read_all on public.reel_items      for select to authenticated using (true);
create policy read_all on public.challenge_cards for select to authenticated using (true);
create policy read_all on public.simulations     for select to authenticated using (true);
create policy read_all on public.simulation_cards      for select to authenticated using (true);
create policy read_all on public.simulation_recordings for select to authenticated using (true);
create policy read_all on public.journal_entries for select to authenticated using (true);

-- progresso: as duas contas marcam; só mentor desmarca itens que não marcou (RF-41)
create policy write_own on public.item_progress for insert to authenticated with check (done_by = auth.uid());
create policy delete_item on public.item_progress for delete to authenticated
  using (done_by = auth.uid() or public.my_role() = 'mentor');

-- escrita só do mentor
create policy mentor_write on public.node_overrides  for all to authenticated using (public.my_role() = 'mentor') with check (public.my_role() = 'mentor');
create policy mentor_write on public.books           for all to authenticated using (public.my_role() = 'mentor') with check (public.my_role() = 'mentor');
create policy mentor_write on public.reel_items      for all to authenticated using (public.my_role() = 'mentor') with check (public.my_role() = 'mentor');
create policy mentor_write on public.challenge_cards for all to authenticated using (public.my_role() = 'mentor') with check (public.my_role() = 'mentor');

-- checklists manuais: dono edita
create policy owner_write on public.checklists for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy owner_write on public.checklist_items for all to authenticated
  using (exists (select 1 from public.checklists c where c.id = checklist_id and c.owner = auth.uid()))
  with check (exists (select 1 from public.checklists c where c.id = checklist_id and c.owner = auth.uid()));

-- progresso de leitura: aluna escreve
create policy aluna_write on public.book_progress for all to authenticated using (public.my_role() = 'aluna') with check (public.my_role() = 'aluna');

-- caderno: aluna insere e atualiza; ninguém apaga (RF-50/52)
create policy aluna_insert on public.journal_entries for insert to authenticated with check (public.my_role() = 'aluna');
create policy aluna_update on public.journal_entries for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notas livres: autora faz tudo; mentor lê não privadas (RF-52)
create policy author_all on public.notes for all to authenticated using (author = auth.uid()) with check (author = auth.uid());
create policy mentor_read_public on public.notes for select to authenticated using (public.my_role() = 'mentor' and not private);

-- simulações
create policy create_sim on public.simulations for insert to authenticated with check (
  created_by = auth.uid() and (
    (mode = 'surpresa' and public.my_role() = 'mentor') or
    (mode = 'treino'   and public.my_role() = 'aluna')));
create policy update_sim on public.simulations for update to authenticated
  using (created_by = auth.uid() or public.my_role() = 'mentor');

-- cenário: escondido da aluna no modo surpresa até a revelação (RF-75)
create policy scen_mentor on public.simulation_scenarios for select to authenticated using (public.my_role() = 'mentor');
create policy scen_aluna on public.simulation_scenarios for select to authenticated using (
  public.my_role() = 'aluna' and exists (
    select 1 from public.simulations s
    where s.id = simulation_id and (s.mode = 'treino' or s.revealed_at is not null)));
create policy scen_insert on public.simulation_scenarios for insert to authenticated with check (
  exists (select 1 from public.simulations s where s.id = simulation_id and s.created_by = auth.uid()));

create policy cards_insert on public.simulation_cards for insert to authenticated with check (
  exists (select 1 from public.simulations s where s.id = simulation_id and s.created_by = auth.uid()));
create policy cards_update on public.simulation_cards for update to authenticated using (
  exists (select 1 from public.simulations s where s.id = simulation_id and s.created_by = auth.uid()));

create policy rec_insert on public.simulation_recordings for insert to authenticated with check (
  public.my_role() = 'aluna' and exists (select 1 from public.simulations s where s.id = simulation_id and s.created_by = auth.uid()));
create policy rec_mentor on public.simulation_recordings for update to authenticated using (public.my_role() = 'mentor');
create policy rec_delete on public.simulation_recordings for delete to authenticated using (public.my_role() = 'mentor');

-- fichas: cada um a sua; a do outro só depois das duas (RF-80)
create policy score_insert on public.simulation_scores for insert to authenticated with check (rater_id = auth.uid());
create policy score_update on public.simulation_scores for update to authenticated
  using (rater_id = auth.uid() and not public.both_scored(simulation_id));
create policy score_read on public.simulation_scores for select to authenticated
  using (rater_id = auth.uid() or public.both_scored(simulation_id));

-- storage
insert into storage.buckets (id, name, public, file_size_limit)
values ('books', 'books', false, 52428800), ('recordings', 'recordings', false, 26214400);

create policy books_read   on storage.objects for select to authenticated using (bucket_id = 'books');
create policy books_write  on storage.objects for insert to authenticated with check (bucket_id = 'books' and public.my_role() = 'mentor');
create policy books_delete on storage.objects for delete to authenticated using (bucket_id = 'books' and public.my_role() = 'mentor');
create policy rec_read     on storage.objects for select to authenticated using (bucket_id = 'recordings');
create policy rec_write    on storage.objects for insert to authenticated with check (bucket_id = 'recordings' and public.my_role() = 'aluna');
create policy rec_remove   on storage.objects for delete to authenticated using (bucket_id = 'recordings' and public.my_role() = 'mentor');
```

- [ ] **Step 5: Ver passar** — Run: `npx supabase db reset && npx supabase test db` · Expected: `journal.test.sql .. ok`, `rls.test.sql .. ok`.

- [ ] **Step 6: Commit** — `git add supabase && git commit -m "feat(db): add RLS policies, journal guard and pgTAP tests"`

---

### Task 6: Conteúdo da trilha e regra de desbloqueio

**Files:**
- Create: `src/content/types.ts`, `src/content/trail.ts`, `src/domain/unlock.ts`
- Test: `src/domain/unlock.test.ts`, `src/content/trail.test.ts`

**Interfaces:**
- Produces:
  - Tipos `PhaseId`, `ItemKind`, `TrailItem`, `TrailNode`, `GateItem`, `AutoCheck`, `Phase`
  - `PHASES: Phase[]`, `NODES: TrailNode[]`, `nodeById(id): TrailNode`
  - `type NodeState = 'locked' | 'available' | 'done'`
  - `isNodeComplete(node: TrailNode, done: ReadonlySet<string>): boolean`
  - `isGatePassed(phase: Phase, gateDone: ReadonlySet<string>): boolean`
  - `computeNodeStates(input: UnlockInput): Map<string, NodeState>`

- [ ] **Step 1: Tipos**

`src/content/types.ts`:
```ts
export type PhaseId = 'f1' | 'f2' | 'f3' | 'f4'
export type ItemKind = 'video' | 'reading' | 'practice' | 'fear' | 'delivery'
export type AutoCheck = 'f1_all_videos' | 'f2_all_original_objectives' | 'f2_avg_15' | 'f4_hard_avg_22'

export interface TrailItem {
  id: string            // estável, ex.: 'w05.video.1'
  kind: ItemKind
  title: string
  url?: string
  minutes?: number
  bookId?: string       // referencia books.id
  required: boolean
}

export interface TrailNode {
  id: string            // 'w01'…'w16' ou 'f4-negociacao'
  phase: PhaseId
  week?: number
  title: string
  items: TrailItem[]
}

export interface GateItem {
  id: string            // 'f1.gate.1'
  text: string
  auto?: AutoCheck
}

export interface Phase {
  id: PhaseId
  title: string
  nodeIds: string[]     // ordem do caminho
  gate: GateItem[]
}
```

- [ ] **Step 2: Conteúdo** — transcrever o PRD Apêndice A em `src/content/trail.ts`. Formato obrigatório (semana 1 e 5 mostradas; as demais seguem o mesmo padrão, todas presentes):

```ts
import type { Phase, TrailNode } from './types'

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`

export const NODES: TrailNode[] = [
  {
    id: 'w01', phase: 'f1', week: 1, title: 'Perder o medo de falar',
    items: [
      { id: 'w01.video.1', kind: 'video', title: 'Vença o medo de falar em público — Reinaldo Polito', url: yt('ywJw8hjzTig'), minutes: 3, required: true },
      { id: 'w01.video.2', kind: 'video', title: 'Pedro Calabrez sobre timidez — Cortes do Flow', url: yt('V0Eb9Kk4Ecc'), minutes: 12, required: true },
      { id: 'w01.reading', kind: 'reading', title: 'Como Fazer Amigos e Influenciar Pessoas — 1 capítulo por dia', bookId: 'carnegie', required: true },
      { id: 'w01.fear', kind: 'fear', title: 'Bom dia + 1 pergunta a 3 desconhecidos', required: true },
      { id: 'w01.pitch', kind: 'practice', title: 'Pitch pessoal de 30 s', required: true },
    ],
  },
  // w02 … w04 (Fase 1), com vídeos, leitura, degrau da escada do medo e pitch semanal
  {
    id: 'w05', phase: 'f2', week: 5, title: 'Mentalidade de vendas',
    items: [
      { id: 'w05.video.1', kind: 'video', title: 'Como ter a mentalidade de um vendedor acima da média — Thiago Concer', url: yt('PuoUyNbeYtM'), minutes: 9, required: true },
      { id: 'w05.reading', kind: 'reading', title: 'A Bíblia de Vendas', bookId: 'gitomer', required: true },
      { id: 'w05.practice', kind: 'practice', title: 'Escrever "por que as pessoas compram?" em 10 respostas', required: true },
    ],
  },
  // w06 … w16 e nós da Fase 4: 'f4-negociacao', 'f4-comunicacao', 'f4-publico', 'f4-marca', 'f4-lideranca', 'f4-financas'
]

export const PHASES: Phase[] = [
  {
    id: 'f1', title: 'Comunicação', nodeIds: ['w01', 'w02', 'w03', 'w04'],
    gate: [
      { id: 'f1.gate.1', text: 'Assistiu aos 6 vídeos da fase', auto: 'f1_all_videos' },
      { id: 'f1.gate.2', text: 'Completou os 4 degraus da escada do medo' },
      { id: 'f1.gate.3', text: 'Recebeu pelo menos 10 "nãos" no desafio do não' },
      { id: 'f1.gate.4', text: 'Pitch de 30 s gravado sem travar' },
      { id: 'f1.gate.5', text: 'Falou 3 min em pé para um grupo' },
    ],
  },
  // f2 (5 itens; 'f2.gate.2' auto 'f2_all_original_objectives', 'f2.gate.4' auto 'f2_avg_15'),
  // f3 (5 itens), f4 (3 itens; 'f4.gate.3' auto 'f4_hard_avg_22')
]

const byId = new Map(NODES.map((n) => [n.id, n]))
export function nodeById(id: string): TrailNode {
  const n = byId.get(id)
  if (!n) throw new Error(`Nó desconhecido: ${id}`)
  return n
}
```

> Como no seed, os comentários `// w02 …` marcam o que transcrever do PRD e **não podem** ficar no arquivo final; o teste abaixo garante a completude.

- [ ] **Step 3: Testes de integridade do conteúdo e de desbloqueio**

`src/content/trail.test.ts`:
```ts
import { NODES, PHASES } from './trail'

test('16 semanas + 6 temas da Fase 4', () => {
  expect(NODES.filter((n) => n.week).map((n) => n.week)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1))
  expect(NODES.filter((n) => n.phase === 'f4')).toHaveLength(6)
})

test('IDs de itens e portões são únicos', () => {
  const ids = [...NODES.flatMap((n) => n.items.map((i) => i.id)), ...PHASES.flatMap((p) => p.gate.map((g) => g.id))]
  expect(new Set(ids).size).toBe(ids.length)
})

test('21 vídeos com URL do YouTube (PRD Apêndice A)', () => {
  const videos = NODES.flatMap((n) => n.items).filter((i) => i.kind === 'video')
  expect(videos).toHaveLength(21)
  videos.forEach((v) => expect(v.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/))
})

test('Fase 1 tem 6 vídeos', () => {
  const f1 = NODES.filter((n) => n.phase === 'f1').flatMap((n) => n.items).filter((i) => i.kind === 'video')
  expect(f1).toHaveLength(6)
})

test('todo nó pertence a exatamente uma fase, na ordem', () => {
  expect(PHASES.flatMap((p) => p.nodeIds)).toEqual(NODES.map((n) => n.id))
})
```

> Contagem de vídeos (21): F1 = 6 · F2 = 6 · F3 = 8 (w11, w12, w13 ×2, w14, w15 e os 2 de inspiração, que entram como itens `video` **não obrigatórios** de `w16`) · F4 = 1 (Chris Voss, em `f4-negociacao`).

`src/domain/unlock.test.ts`:
```ts
import { computeNodeStates, type UnlockInput } from './unlock'
import type { Phase, TrailNode } from '@/content/types'

const node = (id: string, phase: Phase['id'], req = 1): TrailNode => ({
  id, phase, title: id,
  items: Array.from({ length: req }, (_, i) => ({ id: `${id}.${i}`, kind: 'practice', title: 'x', required: true })),
})
const nodes = [node('a1', 'f1'), node('a2', 'f1'), node('b1', 'f2'), node('b2', 'f2')]
const phases: Phase[] = [
  { id: 'f1', title: 'F1', nodeIds: ['a1', 'a2'], gate: [{ id: 'g1', text: 'g' }] },
  { id: 'f2', title: 'F2', nodeIds: ['b1', 'b2'], gate: [] },
]
const base = (over: Partial<UnlockInput> = {}): UnlockInput =>
  ({ phases, nodes, doneItems: new Set(), gateDone: new Set(), overrides: new Map(), ...over })

test('só o primeiro nó começa disponível', () => {
  const s = computeNodeStates(base())
  expect([...s.values()]).toEqual(['available', 'locked', 'locked', 'locked'])
})

test('concluir a1 libera a2', () => {
  const s = computeNodeStates(base({ doneItems: new Set(['a1.0']) }))
  expect(s.get('a1')).toBe('done')
  expect(s.get('a2')).toBe('available')
})

test('portão de fase segura a próxima fase', () => {
  const s = computeNodeStates(base({ doneItems: new Set(['a1.0', 'a2.0']) }))
  expect(s.get('b1')).toBe('locked')
  const s2 = computeNodeStates(base({ doneItems: new Set(['a1.0', 'a2.0']), gateDone: new Set(['g1']) }))
  expect(s2.get('b1')).toBe('available')
})

test('itens não obrigatórios não travam', () => {
  const n: TrailNode = { id: 'a1', phase: 'f1', title: 'a1', items: [
    { id: 'r', kind: 'video', title: 'r', required: true },
    { id: 'o', kind: 'video', title: 'o', required: false }] }
  const s = computeNodeStates(base({ nodes: [n, ...nodes.slice(1)], doneItems: new Set(['r']) }))
  expect(s.get('a1')).toBe('done')
})

test('override: liberar b1 com trilha incompleta; concluir b1 libera b2 (Review Focus 5)', () => {
  const s = computeNodeStates(base({ overrides: new Map([['b1', 'unlocked']]), doneItems: new Set(['b1.0']) }))
  expect(s.get('b1')).toBe('done')
  expect(s.get('b2')).toBe('available')
})

test('override: bloquear nó concluído o mostra bloqueado', () => {
  const s = computeNodeStates(base({ doneItems: new Set(['a1.0']), overrides: new Map([['a1', 'locked']]) }))
  expect(s.get('a1')).toBe('locked')
})
```

- [ ] **Step 4: Ver falhar** — Run: `npx vitest run src/domain/unlock.test.ts src/content/trail.test.ts` · Expected: FAIL.

- [ ] **Step 5: Implementar**

`src/domain/unlock.ts`:
```ts
import type { Phase, TrailNode } from '@/content/types'

export type NodeState = 'locked' | 'available' | 'done'

export interface UnlockInput {
  phases: Phase[]
  nodes: TrailNode[]
  doneItems: ReadonlySet<string>
  gateDone: ReadonlySet<string>      // itens de portão manuais + automáticos (deriveAutoChecks)
  overrides: ReadonlyMap<string, 'unlocked' | 'locked'>
}

export function isNodeComplete(node: TrailNode, done: ReadonlySet<string>): boolean {
  return node.items.filter((i) => i.required).every((i) => done.has(i.id))
}

export function isGatePassed(phase: Phase, gateDone: ReadonlySet<string>): boolean {
  return phase.gate.every((g) => gateDone.has(g.id))
}

export function computeNodeStates({ phases, nodes, doneItems, gateDone, overrides }: UnlockInput): Map<string, NodeState> {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const states = new Map<string, NodeState>()
  let prevPhaseOpen = true // liberado pela fase anterior (true para a primeira)

  for (const phase of phases) {
    let prevComplete = prevPhaseOpen
    const isF4 = phase.id === 'f4'
    for (const id of phase.nodeIds) {
      const node = byId.get(id)!
      const complete = isNodeComplete(node, doneItems)
      const unlockedByChain = isF4 ? prevPhaseOpen : prevComplete
      const override = overrides.get(id)
      let state: NodeState
      if (override === 'locked') state = 'locked'
      else if (complete && (unlockedByChain || override === 'unlocked')) state = 'done'
      else if (unlockedByChain || override === 'unlocked') state = 'available'
      else state = 'locked'
      states.set(id, state)
      if (!isF4) prevComplete = complete && state !== 'locked'
    }
    const lastId = phase.nodeIds[phase.nodeIds.length - 1]
    prevPhaseOpen = states.get(lastId) === 'done' && isGatePassed(phase, gateDone)
  }
  return states
}
```

- [ ] **Step 6: Ver passar** — Run: `npx vitest run src/domain/unlock.test.ts src/content/trail.test.ts` · Expected: todos PASS.

- [ ] **Step 7: Commit** — `git add src/content src/domain/unlock* && git commit -m "feat(domain): trail content and unlock rules"`

---

### Task 7: Nota oficial e itens automáticos de portão

**Files:**
- Create: `src/domain/scoring.ts`, `src/domain/phaseChecks.ts`
- Test: `src/domain/scoring.test.ts`, `src/domain/phaseChecks.test.ts`

**Interfaces:**
- Produces:
  - `CRITERIA` (tupla), `type Criterion`, `type Scores = Record<Criterion, number>`
  - `isValidScores(s: unknown): s is Scores`
  - `total(s: Scores): number`
  - `officialScore(student: Scores | null, mentor: Scores | null): { byCriterion: Scores; total: number } | null`
  - `average(values: number[]): number | null`
  - `deriveAutoChecks(input: AutoCheckInput): Set<AutoCheck>`

- [ ] **Step 1: Testes**

`src/domain/scoring.test.ts`:
```ts
import { officialScore, isValidScores, total, average, type Scores } from './scoring'

const all = (n: number): Scores => ({ abertura: n, tom: n, perguntas: n, escuta: n, objecao: n, fechamento: n })

test('total soma os 6 critérios', () => expect(total(all(3))).toBe(18))

test('oficial é a média das duas fichas, 1 casa', () => {
  const r = officialScore({ ...all(3), tom: 4 }, all(4))!
  expect(r.byCriterion.tom).toBe(4)
  expect(r.byCriterion.abertura).toBe(3.5)
  expect(r.total).toBe(21.5)
})

test('sem uma das fichas não há nota oficial (Review Focus 4)', () => {
  expect(officialScore(all(3), null)).toBeNull()
  expect(officialScore(null, all(3))).toBeNull()
})

test('valida faixa 1–5 e inteiros', () => {
  expect(isValidScores(all(5))).toBe(true)
  expect(isValidScores({ ...all(5), tom: 6 })).toBe(false)
  expect(isValidScores({ ...all(5), tom: 2.5 })).toBe(false)
  expect(isValidScores({ abertura: 1 })).toBe(false)
})

test('average', () => {
  expect(average([])).toBeNull()
  expect(average([15, 16])).toBe(15.5)
})
```

`src/domain/phaseChecks.test.ts`:
```ts
import { deriveAutoChecks, type AutoCheckInput } from './phaseChecks'

const base: AutoCheckInput = {
  watchedVideoIds: new Set(), f1VideoIds: ['v1', 'v2'],
  originalObjectiveIds: ['o1', 'o2'], evaluatedObjectiveIds: new Set(),
  f2Officials: [], hardOfficials: [],
}

test('nada marcado sem dados', () => expect(deriveAutoChecks(base).size).toBe(0))

test('vídeos da F1', () => {
  expect(deriveAutoChecks({ ...base, watchedVideoIds: new Set(['v1', 'v2']) }).has('f1_all_videos')).toBe(true)
})

test('15 cenários originais', () => {
  expect(deriveAutoChecks({ ...base, evaluatedObjectiveIds: new Set(['o1', 'o2', 'x']) }).has('f2_all_original_objectives')).toBe(true)
})

test('médias com limite inclusivo', () => {
  const r = deriveAutoChecks({ ...base, f2Officials: [14, 16], hardOfficials: [22] })
  expect(r.has('f2_avg_15')).toBe(true)
  expect(r.has('f4_hard_avg_22')).toBe(true)
  expect(deriveAutoChecks({ ...base, f2Officials: [14.9] }).has('f2_avg_15')).toBe(false)
})
```

- [ ] **Step 2: Ver falhar** — Run: `npx vitest run src/domain/scoring.test.ts src/domain/phaseChecks.test.ts` · Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/domain/scoring.ts`:
```ts
export const CRITERIA = ['abertura', 'tom', 'perguntas', 'escuta', 'objecao', 'fechamento'] as const
export type Criterion = (typeof CRITERIA)[number]
export type Scores = Record<Criterion, number>

export const CRITERIA_LABELS: Record<Criterion, { label: string; hint: string }> = {
  abertura:   { label: 'Abertura', hint: 'Disse quem é e o motivo em até 20 segundos?' },
  tom:        { label: 'Tom e energia', hint: 'Voz firme, sem pedir desculpas, sorriso na voz?' },
  perguntas:  { label: 'Perguntas', hint: 'Fez mais perguntas do que afirmações?' },
  escuta:     { label: 'Escuta', hint: 'Usou as palavras do cliente na proposta?' },
  objecao:    { label: 'Objeção', hint: 'Acolheu antes de rebater? Descobriu a objeção real?' },
  fechamento: { label: 'Fechamento', hint: 'Pediu a venda ou um próximo passo com data?' },
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function isValidScores(s: unknown): s is Scores {
  if (typeof s !== 'object' || s === null) return false
  return CRITERIA.every((c) => {
    const v = (s as Record<string, unknown>)[c]
    return Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5
  })
}

export function total(s: Scores): number {
  return CRITERIA.reduce((acc, c) => acc + s[c], 0)
}

export function officialScore(student: Scores | null, mentor: Scores | null) {
  if (!student || !mentor) return null
  const byCriterion = Object.fromEntries(CRITERIA.map((c) => [c, round1((student[c] + mentor[c]) / 2)])) as Scores
  return { byCriterion, total: round1((total(student) + total(mentor)) / 2) }
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null
  return round1(values.reduce((a, b) => a + b, 0) / values.length)
}
```

`src/domain/phaseChecks.ts`:
```ts
import type { AutoCheck } from '@/content/types'
import { average } from './scoring'

export interface AutoCheckInput {
  watchedVideoIds: ReadonlySet<string>
  f1VideoIds: string[]
  originalObjectiveIds: string[]
  evaluatedObjectiveIds: ReadonlySet<string>   // objetivos de simulados com nota oficial
  f2Officials: number[]                          // totais oficiais de simulados da Fase 2
  hardOfficials: number[]                        // totais oficiais de simulados difíceis
}

export function deriveAutoChecks(i: AutoCheckInput): Set<AutoCheck> {
  const out = new Set<AutoCheck>()
  if (i.f1VideoIds.length > 0 && i.f1VideoIds.every((v) => i.watchedVideoIds.has(v))) out.add('f1_all_videos')
  if (i.originalObjectiveIds.every((o) => i.evaluatedObjectiveIds.has(o))) out.add('f2_all_original_objectives')
  const f2 = average(i.f2Officials)
  if (f2 !== null && f2 >= 15) out.add('f2_avg_15')
  const hard = average(i.hardOfficials)
  if (hard !== null && hard >= 22) out.add('f4_hard_avg_22')
  return out
}
```

- [ ] **Step 4: Ver passar** — Run: `npx vitest run src/domain/scoring.test.ts src/domain/phaseChecks.test.ts` · Expected: PASS.

- [ ] **Step 5: Commit** — `git add src/domain && git commit -m "feat(domain): official score and automatic gate checks"`

---

### Task 8: Roleta e agenda das cartas surpresa

**Files:**
- Create: `src/domain/rng.ts`, `src/domain/roulette.ts`, `src/domain/cards.ts`
- Test: `src/domain/roulette.test.ts`, `src/domain/cards.test.ts`

**Interfaces:**
- Produces:
  - `type Rng = () => number`; `seeded(seed: number): Rng`
  - `type Difficulty = 'facil' | 'medio' | 'dificil'`
  - `interface ReelItem { id: string; reel: 1 | 2 | 3 | 4; label: string; active: boolean; isNone: boolean }`
  - `interface Draw { objectiveId: string; profileId: string; productId: string; complicationIds: string[] }`
  - `difficultyForPhase(phase: PhaseId): Difficulty`
  - `drawScenario(items: ReelItem[], d: Difficulty, recentObjectiveIds: string[], rng?: Rng): Draw` — lança `RouletteError` com mensagem pt-BR se faltar objetivo, perfil ou produto ativo
  - `challengeCount(d: Difficulty): number`
  - `interface PlannedCard { kind: 'complicacao' | 'questionamento'; refId: string; atSec: number }`
  - `planCards(draw: Draw, challengeIds: string[], d: Difficulty, durationSec: number, rng?: Rng, noneIds?: ReadonlySet<string>): PlannedCard[]` — `noneIds` são os IDs de complicação "Nenhuma", que nunca viram carta
  - `scheduleTimes(n: number, durationSec: number, rng: Rng): number[]`

- [ ] **Step 1: Testes**

`src/domain/roulette.test.ts`:
```ts
import { drawScenario, difficultyForPhase, RouletteError, type ReelItem } from './roulette'
import { seeded } from './rng'

const mk = (reel: ReelItem['reel'], n: number, prefix: string): ReelItem[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, reel, label: prefix, active: true, isNone: false }))
const none: ReelItem = { id: 'none', reel: 4, label: 'Nenhuma', active: true, isNone: true }
const bank = [...mk(1, 5, 'o'), ...mk(2, 3, 'p'), ...mk(3, 3, 'd'), none, ...mk(4, 4, 'c')]

test('dificuldade por fase', () => {
  expect(difficultyForPhase('f1')).toBe('facil')
  expect(difficultyForPhase('f2')).toBe('medio')
  expect(difficultyForPhase('f3')).toBe('dificil')
  expect(difficultyForPhase('f4')).toBe('dificil')
})

test('fácil: complicação é só "Nenhuma"', () => {
  expect(drawScenario(bank, 'facil', [], seeded(1)).complicationIds).toEqual(['none'])
})

test('médio: 1 complicação real; difícil: 2 ou 3 distintas, sem "Nenhuma"', () => {
  for (let s = 0; s < 50; s++) {
    const m = drawScenario(bank, 'medio', [], seeded(s)).complicationIds
    expect(m).toHaveLength(1)
    expect(m).not.toContain('none')
    const h = drawScenario(bank, 'dificil', [], seeded(s)).complicationIds
    expect([2, 3]).toContain(h.length)
    expect(new Set(h).size).toBe(h.length)
    expect(h).not.toContain('none')
  }
})

test('não repete os últimos 3 objetivos', () => {
  for (let s = 0; s < 50; s++) {
    expect(['o0', 'o1', 'o2']).not.toContain(drawScenario(bank, 'facil', ['o0', 'o1', 'o2'], seeded(s)).objectiveId)
  }
})

test('se só restam objetivos recentes, usa-os mesmo assim', () => {
  const small = [...mk(1, 2, 'o'), ...mk(2, 1, 'p'), ...mk(3, 1, 'd'), none]
  expect(['o0', 'o1']).toContain(drawScenario(small, 'facil', ['o0', 'o1'], seeded(3)).objectiveId)
})

test('itens inativos nunca saem', () => {
  const b = bank.map((i) => (i.id === 'o4' ? { ...i, active: false } : i))
  for (let s = 0; s < 50; s++) expect(drawScenario(b, 'facil', [], seeded(s)).objectiveId).not.toBe('o4')
})

test('banco vazio gera erro legível (Review Focus 3)', () => {
  const b = bank.map((i) => (i.reel === 1 ? { ...i, active: false } : i))
  expect(() => drawScenario(b, 'facil', [])).toThrow(RouletteError)
  expect(() => drawScenario(b, 'facil', [])).toThrow(/objetivo/i)
})

test('difícil com só 1 complicação ativa usa o que houver', () => {
  const b = [...mk(1, 1, 'o'), ...mk(2, 1, 'p'), ...mk(3, 1, 'd'), none, ...mk(4, 1, 'c')]
  expect(drawScenario(b, 'dificil', [], seeded(2)).complicationIds).toEqual(['c0'])
})
```

`src/domain/cards.test.ts`:
```ts
import { planCards, challengeCount } from './cards'
import { seeded } from './rng'

const draw = (comps: string[]) => ({ objectiveId: 'o', profileId: 'p', productId: 'd', complicationIds: comps })
const challenges = ['q1', 'q2', 'q3', 'q4']

test('quantidade de questionamentos por dificuldade', () => {
  expect(challengeCount('facil')).toBe(1)
  expect(challengeCount('medio')).toBe(1)
  expect(challengeCount('dificil')).toBe(2)
})

test('fácil: "Nenhuma" não vira carta; 1 questionamento', () => {
  const c = planCards(draw(['none']), challenges, 'facil', 300, seeded(1), new Set(['none']))
  expect(c.map((x) => x.kind)).toEqual(['questionamento'])
})

test('horários respeitam as regras do RF-76c', () => {
  for (let s = 0; s < 200; s++) {
    const c = planCards(draw(['c1', 'c2', 'c3']), challenges, 'dificil', 300, seeded(s), new Set())
    expect(c).toHaveLength(5)
    expect(c[0].atSec).toBeGreaterThanOrEqual(30)
    expect(c[0].atSec).toBeLessThanOrEqual(90)
    for (let i = 1; i < c.length; i++) expect(c[i].atSec - c[i - 1].atSec).toBeGreaterThanOrEqual(45)
    expect(c[c.length - 1].atSec).toBeLessThanOrEqual(270)
  }
})

test('simulado chefe de 10 min também cabe', () => {
  const c = planCards(draw(['c1', 'c2']), challenges, 'dificil', 600, seeded(9), new Set())
  expect(c.at(-1)!.atSec).toBeLessThanOrEqual(570)
})

test('questionamentos não repetem no mesmo treino', () => {
  const c = planCards(draw(['c1']), challenges, 'dificil', 300, seeded(4), new Set())
  const q = c.filter((x) => x.kind === 'questionamento').map((x) => x.refId)
  expect(new Set(q).size).toBe(q.length)
})
```

- [ ] **Step 2: Ver falhar** — Run: `npx vitest run src/domain/roulette.test.ts src/domain/cards.test.ts` · Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/domain/rng.ts`:
```ts
export type Rng = () => number

/** mulberry32: RNG determinístico para testes. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(list: T[], rng: Rng): T {
  return list[Math.floor(rng() * list.length)]
}

export function shuffle<T>(list: T[], rng: Rng): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
```

`src/domain/roulette.ts`:
```ts
import type { PhaseId } from '@/content/types'
import { pick, shuffle, type Rng } from './rng'

export type Difficulty = 'facil' | 'medio' | 'dificil'

export interface ReelItem { id: string; reel: 1 | 2 | 3 | 4; label: string; active: boolean; isNone: boolean }
export interface Draw { objectiveId: string; profileId: string; productId: string; complicationIds: string[] }

export class RouletteError extends Error {}

export function difficultyForPhase(phase: PhaseId): Difficulty {
  return phase === 'f1' ? 'facil' : phase === 'f2' ? 'medio' : 'dificil'
}

const REEL_NAMES = { 1: 'objetivo', 2: 'perfil de cliente', 3: 'produto' } as const

export function drawScenario(items: ReelItem[], d: Difficulty, recentObjectiveIds: string[], rng: Rng = Math.random): Draw {
  const active = (reel: ReelItem['reel']) => items.filter((i) => i.reel === reel && i.active)
  for (const reel of [1, 2, 3] as const) {
    if (active(reel).length === 0) throw new RouletteError(`Nenhum ${REEL_NAMES[reel]} ativo no banco de cenários.`)
  }
  const recent = new Set(recentObjectiveIds.slice(-3))
  const fresh = active(1).filter((i) => !recent.has(i.id))
  const objective = pick(fresh.length > 0 ? fresh : active(1), rng)

  let complicationIds: string[]
  if (d === 'facil') {
    const none = items.find((i) => i.reel === 4 && i.isNone)
    complicationIds = none ? [none.id] : []
  } else {
    const real = active(4).filter((i) => !i.isNone)
    const wanted = d === 'medio' ? 1 : 2 + Math.floor(rng() * 2)
    complicationIds = shuffle(real, rng).slice(0, wanted).map((i) => i.id)
  }

  return {
    objectiveId: objective.id,
    profileId: pick(active(2), rng).id,
    productId: pick(active(3), rng).id,
    complicationIds,
  }
}
```

`src/domain/cards.ts`:
```ts
import type { Difficulty, Draw } from './roulette'
import { shuffle, type Rng } from './rng'

export interface PlannedCard { kind: 'complicacao' | 'questionamento'; refId: string; atSec: number }

const FIRST_MIN = 30, FIRST_MAX = 90, GAP = 45, TAIL = 30

export function challengeCount(d: Difficulty): number {
  return d === 'dificil' ? 2 : 1
}

export function scheduleTimes(n: number, durationSec: number, rng: Rng): number[] {
  if (n === 0) return []
  const end = durationSec - TAIL
  if (FIRST_MIN + GAP * (n - 1) > end) throw new Error('Duração curta demais para as cartas')
  const times: number[] = []
  let min = FIRST_MIN
  for (let i = 0; i < n; i++) {
    const remaining = n - 1 - i
    const max = Math.min(i === 0 ? FIRST_MAX : end, end - GAP * remaining)
    const t = Math.floor(min + rng() * (max - min + 1))
    times.push(Math.min(t, max))
    min = times[i] + GAP
  }
  return times
}

export function planCards(
  draw: Draw, challengeIds: string[], d: Difficulty, durationSec: number,
  rng: Rng = Math.random, noneIds: ReadonlySet<string> = new Set(),
): PlannedCard[] {
  const comps = draw.complicationIds.filter((id) => !noneIds.has(id))
    .map((refId) => ({ kind: 'complicacao' as const, refId }))
  const qs = shuffle(challengeIds, rng).slice(0, challengeCount(d))
    .map((refId) => ({ kind: 'questionamento' as const, refId }))
  const ordered = shuffle([...comps, ...qs], rng)
  const times = scheduleTimes(ordered.length, durationSec, rng)
  return ordered.map((c, i) => ({ ...c, atSec: times[i] }))
}
```

- [ ] **Step 4: Ver passar** — Run: `npx vitest run src/domain/roulette.test.ts src/domain/cards.test.ts` · Expected: PASS.

- [ ] **Step 5: Commit** — `git add src/domain && git commit -m "feat(domain): scenario roulette and surprise card scheduling"`

---

### Task 9: Caderno (espelho do cliente) e streak

**Files:**
- Create: `src/domain/journal.ts`, `src/domain/streak.ts`
- Test: `src/domain/journal.test.ts`, `src/domain/streak.test.ts`

**Interfaces:**
- Consumes: `spDate`, `spHour`, `addDays`, `daysBetween` (Task 2)
- Produces:
  - `MIN_FIELD = 15`
  - `fieldOk(text: string): boolean`; `isJournalComplete(e: JournalFields): boolean`
  - `type WriteWindow = 'on_time' | 'late' | 'closed'`; `writeWindow(entryDate: string, now: Date): WriteWindow` (mesma regra de `public.journal_window`)
  - `currentStreak(completeDates: ReadonlySet<string>, today: string): number`
  - `journalCompliance(completeDates: ReadonlySet<string>, startDate: string, today: string): { rate: number; missing: string[] }`

- [ ] **Step 1: Testes**

`src/domain/journal.test.ts`:
```ts
import { writeWindow, isJournalComplete, fieldOk } from './journal'

test('janela igual à do banco (Review Focus 1)', () => {
  expect(writeWindow('2026-09-29', new Date('2026-09-30T02:59:00Z'))).toBe('on_time')
  expect(writeWindow('2026-09-29', new Date('2026-09-30T14:59:00Z'))).toBe('late')
  expect(writeWindow('2026-09-29', new Date('2026-09-30T15:00:00Z'))).toBe('closed')
  expect(writeWindow('2026-10-01', new Date('2026-09-30T10:00:00Z'))).toBe('closed')
})

test('mínimo de 15 caracteres ignorando espaços nas pontas', () => {
  expect(fieldOk('   curto   ')).toBe(false)
  expect(fieldOk('exatamente 15 c')).toBe(true)
  expect(isJournalComplete({ learned: 'aprendi a ouvir mais', practiced: 'pratiquei o pitch hoje', tomorrow: 'x' })).toBe(false)
})
```

`src/domain/streak.test.ts`:
```ts
import { currentStreak, journalCompliance } from './streak'

const set = (...d: string[]) => new Set(d)

test('hoje ainda aberto não quebra o streak', () => {
  expect(currentStreak(set('2026-09-27', '2026-09-28'), '2026-09-29')).toBe(2)
})

test('hoje feito conta', () => {
  expect(currentStreak(set('2026-09-28', '2026-09-29'), '2026-09-29')).toBe(2)
})

test('buraco ontem zera', () => {
  expect(currentStreak(set('2026-09-27'), '2026-09-29')).toBe(0)
})

test('compliance ignora hoje (ainda aberto) e lista dias em falta', () => {
  const r = journalCompliance(set('2026-09-26', '2026-09-28'), '2026-09-26', '2026-09-29')
  expect(r.missing).toEqual(['2026-09-27'])
  expect(r.rate).toBeCloseTo(2 / 3)
})

test('primeiro dia: taxa 1 sem dias passados', () => {
  expect(journalCompliance(set(), '2026-09-29', '2026-09-29')).toEqual({ rate: 1, missing: [] })
})
```

- [ ] **Step 2: Ver falhar** — Run: `npx vitest run src/domain/journal.test.ts src/domain/streak.test.ts` · Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/domain/journal.ts`:
```ts
import { addDays, spDate, spHour } from '@/lib/dates'

export const MIN_FIELD = 15

export interface JournalFields { learned: string; practiced: string; tomorrow: string }
export type WriteWindow = 'on_time' | 'late' | 'closed'

export function fieldOk(text: string): boolean {
  return text.trim().length >= MIN_FIELD
}

export function isJournalComplete(e: JournalFields): boolean {
  return fieldOk(e.learned) && fieldOk(e.practiced) && fieldOk(e.tomorrow)
}

/** Espelho de public.journal_window — o banco é a autoridade. */
export function writeWindow(entryDate: string, now: Date): WriteWindow {
  const today = spDate(now)
  if (entryDate === today) return 'on_time'
  if (entryDate === addDays(today, -1) && spHour(now) < 12) return 'late'
  return 'closed'
}
```

`src/domain/streak.ts`:
```ts
import { addDays, daysBetween } from '@/lib/dates'

export function currentStreak(completeDates: ReadonlySet<string>, today: string): number {
  let day = completeDates.has(today) ? today : addDays(today, -1)
  let n = 0
  while (completeDates.has(day)) {
    n++
    day = addDays(day, -1)
  }
  return n
}

export function journalCompliance(completeDates: ReadonlySet<string>, startDate: string, today: string) {
  const past = daysBetween(startDate, addDays(today, -1))
  if (past.length === 0) return { rate: 1, missing: [] as string[] }
  const missing = past.filter((d) => !completeDates.has(d))
  return { rate: (past.length - missing.length) / past.length, missing }
}
```

- [ ] **Step 4: Ver passar** — Run: `npm test` · Expected: todos os testes do projeto PASS.

- [ ] **Step 5: Commit** — `git add src/domain && git commit -m "feat(domain): journal window mirror and streak"`

---

### Task 10: Direção visual e tokens (**aqui começa o estilo**)

**Files:**
- Modify: `src/design/tokens.css`
- Create: `src/design/tokens.test.ts`
- Modify: `package.json` (dependência de fonte)

**Interfaces:**
- Produces: utilitários Tailwind `bg-bg`, `bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-brand`, `bg-brand-strong`, `bg-success`, `bg-streak`, `bg-danger`, `bg-locked`, `bg-f1`…`bg-f4`, `rounded-card`, `rounded-pill`, `shadow-press`, `font-sans`, duração `--duration-fast|base|slow`, easing `--ease-bounce`.

**Direção visual proposta** (confirmar com o usuário no Step 1):
- **Personalidade:** calorosa, encorajadora e com cara de jogo, sem ser infantil. Botões "fofos" com sombra sólida embaixo (efeito de pressionar), cantos bem arredondados, cores de fase para dar sensação de progresso.
- **Tipografia:** Nunito (variável), arredondada e legível; números tabulares nos painéis.
- **Cores:** coral-terracota como marca, verde para sucesso, dourado para streak, e uma cor por fase (coral, violeta, verde-azulado, dourado). Fundo creme no claro e berinjela escura no escuro.

- [ ] **Step 1: Validar a direção com o usuário.** Gerar uma prévia visual estática (paleta, tipografia, botão, nó da trilha nos 3 estados, card de carta surpresa) e pedir aprovação. Ajustar os hex abaixo conforme o retorno **antes** de seguir. O teste do Step 2 garante que qualquer ajuste mantém contraste AA.

- [ ] **Step 2: Teste de contraste**

`npm install @fontsource-variable/nunito`

`src/design/tokens.test.ts`:
```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8')

const darkStart = css.indexOf('@media (prefers-color-scheme: dark)')
const darkEnd = css.indexOf('@theme inline')
const darkCss = css.slice(darkStart, darkEnd)
const lightCss = css.slice(0, darkStart) + css.slice(darkEnd)

function token(name: string, scope: 'light' | 'dark' = 'light'): string {
  const block = scope === 'light' ? lightCss : darkCss
  const m = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`token ${name} (${scope}) não encontrado`)
  return m[1]
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const WHITE = '#ffffff'

test.each([
  ['texto no fundo (claro)', token('ink'), token('bg')],
  ['texto secundário no fundo (claro)', token('muted'), token('bg')],
  ['texto no card (claro)', token('ink'), token('surface')],
  ['texto no fundo (escuro)', token('ink', 'dark'), token('bg', 'dark')],
  ['texto secundário no fundo (escuro)', token('muted', 'dark'), token('bg', 'dark')],
  ['botão marca', WHITE, token('color-brand-strong')],
  ['botão sucesso', WHITE, token('color-success')],
  ['nó fase 2', WHITE, token('color-f2')],
  ['nó fase 3', WHITE, token('color-f3')],
  ['texto sobre dourado', token('ink'), token('color-streak')],
])('%s tem contraste ≥ 4.5', (_, fg, bg) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
})
```

- [ ] **Step 3: Ver falhar** — Run: `npx vitest run src/design/tokens.test.ts` · Expected: FAIL (tokens ausentes).

- [ ] **Step 4: Escrever os tokens**

`src/design/tokens.css`:
```css
@import "tailwindcss";
@import "@fontsource-variable/nunito";

:root {
  --bg: #fff8f1;
  --surface: #ffffff;
  --ink: #1f1a2e;
  --muted: #625b70;
  --line: #efe4d8;
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #16131f;
    --surface: #221c30;
    --ink: #f6f1ea;
    --muted: #b3abc0;
    --line: #342d47;
    color-scheme: dark;
  }
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-line: var(--line);
}

@theme {
  --font-sans: "Nunito Variable", ui-sans-serif, system-ui, sans-serif;

  --color-brand: #e4572e;          /* preenchimentos decorativos, ícones */
  --color-brand-strong: #b83d17;   /* botões com texto branco */
  --color-success: #1f7a50;
  --color-streak: #f2b632;
  --color-danger: #c0392b;
  --color-locked: #cfc6bc;
  --color-f1: #b83d17;
  --color-f2: #6645d8;
  --color-f3: #0f7466;
  --color-f4: #f2b632;

  --radius-card: 1.25rem;
  --radius-pill: 999px;
  --shadow-press: 0 4px 0 0 rgb(0 0 0 / 0.18);

  --duration-fast: 120ms;
  --duration-base: 220ms;
  --duration-slow: 600ms;
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

@layer base {
  body {
    @apply bg-bg text-ink font-sans antialiased;
    font-feature-settings: "tnum" 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
```

- [ ] **Step 5: Ver passar** — Run: `npx vitest run src/design/tokens.test.ts` · Expected: 10 PASS. Se algum par falhar, escurecer/clarear só aquele token e repetir.

- [ ] **Step 6: Commit** — `git add src/design package.json package-lock.json && git commit -m "feat(design): visual direction and design tokens"`

---

### Task 11: Componentes base e página `/ui`

**Files:**
- Create: `src/design/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, `ProgressBar.tsx`, `Checkbox.tsx`, `TextArea.tsx`, `PathNode.tsx`, `BottomNav.tsx`, `src/design/ui/index.ts`, `src/design/UiPreview.tsx`
- Modify: `src/App.tsx` (rota `/ui` só em dev)
- Test: `src/design/ui/ui.test.tsx`

**Interfaces:**
- Consumes: tokens da Task 10; `NodeState` (Task 6); `MIN_FIELD` (Task 9)
- Produces (exportados em `@/design/ui`):
  - `Button({ variant?: 'primary'|'secondary'|'ghost'|'danger', size?: 'sm'|'md'|'lg', loading?: boolean, ...ButtonHTMLAttributes })`
  - `Card({ children, className? })`
  - `Badge({ tone: 'brand'|'success'|'streak'|'muted', children })`
  - `ProgressBar({ value: number /*0–1*/, label: string, tone?: 'brand'|'success'|PhaseId })`
  - `Checkbox({ checked, onChange(checked: boolean), label, disabled? })`
  - `TextArea({ label, value, onChange(v: string), minChars?: number, disabled? })` com contador "x/15"
  - `PathNode({ state: NodeState, phase: PhaseId, label: string, onClick? })`
  - `BottomNav({ items: { to: string; label: string; icon: ReactNode }[] })`

- [ ] **Step 1: Testes de comportamento e acessibilidade**

`src/design/ui/ui.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Button, Checkbox, TextArea, PathNode, ProgressBar, BottomNav } from '.'

test('Button loading fica desabilitado e anuncia carregamento', () => {
  render(<Button loading>Salvar</Button>)
  const b = screen.getByRole('button', { name: /salvar/i })
  expect(b).toBeDisabled()
  expect(b).toHaveAttribute('aria-busy', 'true')
})

test('Button bloqueia clique duplo enquanto loading', async () => {
  const fn = vi.fn()
  render(<Button loading onClick={fn}>Enviar</Button>)
  await userEvent.click(screen.getByRole('button'))
  expect(fn).not.toHaveBeenCalled()
})

test('Checkbox alterna e é acessível por teclado', async () => {
  const fn = vi.fn()
  render(<Checkbox checked={false} onChange={fn} label="Assistiu ao vídeo" />)
  const cb = screen.getByRole('checkbox', { name: 'Assistiu ao vídeo' })
  cb.focus()
  await userEvent.keyboard(' ')
  expect(fn).toHaveBeenCalledWith(true)
})

test('TextArea mostra contador e estado insuficiente', async () => {
  const Wrapper = () => {
    const [v, setV] = React.useState('')
    return <TextArea label="1 coisa que aprendi" value={v} onChange={setV} minChars={15} />
  }
  render(<Wrapper />)
  await userEvent.type(screen.getByLabelText('1 coisa que aprendi'), 'curto')
  expect(screen.getByText('5/15')).toBeInTheDocument()
  expect(screen.getByLabelText('1 coisa que aprendi')).toHaveAttribute('aria-invalid', 'true')
})

test('PathNode bloqueado não é clicável e anuncia o estado', async () => {
  const fn = vi.fn()
  render(<PathNode state="locked" phase="f1" label="Semana 2" onClick={fn} />)
  const b = screen.getByRole('button', { name: /semana 2.*bloqueada/i })
  expect(b).toBeDisabled()
  await userEvent.click(b)
  expect(fn).not.toHaveBeenCalled()
})

test('PathNode disponível e concluído', () => {
  render(<><PathNode state="available" phase="f2" label="Semana 5" /><PathNode state="done" phase="f2" label="Semana 4" /></>)
  expect(screen.getByRole('button', { name: /semana 5.*disponível/i })).toBeEnabled()
  expect(screen.getByRole('button', { name: /semana 4.*concluída/i })).toBeEnabled()
})

test('ProgressBar expõe valor', () => {
  render(<ProgressBar value={0.4} label="Fase 1" />)
  expect(screen.getByRole('progressbar', { name: 'Fase 1' })).toHaveAttribute('aria-valuenow', '40')
})

test('BottomNav marca a aba atual', () => {
  render(
    <MemoryRouter initialEntries={['/trilha']}>
      <BottomNav items={[{ to: '/', label: 'Hoje', icon: null }, { to: '/trilha', label: 'Trilha', icon: null }]} />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link', { name: 'Trilha' })).toHaveAttribute('aria-current', 'page')
})
```
(Adicionar `import React from 'react'` no topo do arquivo.)

- [ ] **Step 2: Ver falhar** — Run: `npx vitest run src/design/ui` · Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/design/ui/Button.tsx`:
```tsx
import type { ButtonHTMLAttributes } from 'react'

const variants = {
  primary: 'bg-brand-strong text-white shadow-press active:translate-y-1 active:shadow-none',
  secondary: 'bg-surface text-ink border-2 border-line shadow-press active:translate-y-1 active:shadow-none',
  ghost: 'bg-transparent text-ink hover:bg-line/50',
  danger: 'bg-danger text-white shadow-press active:translate-y-1 active:shadow-none',
}
const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-12 px-5 text-base', lg: 'h-14 px-6 text-lg' }

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-pill font-extrabold uppercase tracking-wide
        transition-transform duration-[var(--duration-fast)] focus-visible:outline-3 focus-visible:outline-offset-2
        focus-visible:outline-brand disabled:opacity-60 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  )
}
```

`src/design/ui/Card.tsx`:
```tsx
import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border-2 border-line bg-surface p-4 ${className}`}>{children}</div>
}
```

`src/design/ui/Badge.tsx`:
```tsx
import type { ReactNode } from 'react'

const tones = {
  brand: 'bg-brand-strong text-white',
  success: 'bg-success text-white',
  streak: 'bg-streak text-ink',
  muted: 'bg-line text-ink',
}

export function Badge({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>
}
```

`src/design/ui/ProgressBar.tsx`:
```tsx
import type { PhaseId } from '@/content/types'

const fills: Record<string, string> = {
  brand: 'bg-brand', success: 'bg-success', f1: 'bg-f1', f2: 'bg-f2', f3: 'bg-f3', f4: 'bg-f4',
}

export function ProgressBar({ value, label, tone = 'brand' }: { value: number; label: string; tone?: 'brand' | 'success' | PhaseId }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
      className="h-4 w-full overflow-hidden rounded-pill bg-line">
      <div className={`h-full rounded-pill ${fills[tone]} transition-[width] duration-[var(--duration-slow)]`} style={{ width: `${pct}%` }} />
    </div>
  )
}
```

`src/design/ui/Checkbox.tsx`:
```tsx
import { useId } from 'react'

type Props = { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }

export function Checkbox({ checked, onChange, label, disabled }: Props) {
  const id = useId()
  return (
    <label htmlFor={id} className="relative flex min-h-12 cursor-pointer items-center gap-3 rounded-card px-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <input id={id} type="checkbox" checked={checked} disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer size-7 shrink-0 appearance-none rounded-lg border-2 border-line bg-surface
          checked:border-success checked:bg-success focus-visible:outline-3 focus-visible:outline-brand" />
      <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute ml-[5px] hidden size-[18px] text-white peer-checked:block">
        <path d="M5 12l5 5 9-10" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="peer-checked:text-muted peer-checked:line-through">{label}</span>
    </label>
  )
}
```

`src/design/ui/TextArea.tsx`:
```tsx
import { useId } from 'react'

type Props = { label: string; value: string; onChange: (v: string) => void; minChars?: number; disabled?: boolean }

export function TextArea({ label, value, onChange, minChars, disabled }: Props) {
  const id = useId()
  const count = value.trim().length
  const invalid = minChars !== undefined && count < minChars
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-bold">{label}</label>
      <textarea id={id} value={value} disabled={disabled} rows={3}
        aria-invalid={invalid} aria-describedby={minChars ? `${id}-count` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-card border-2 border-line bg-surface p-3 focus:border-brand focus:outline-none disabled:opacity-60" />
      {minChars !== undefined && (
        <span id={`${id}-count`} className={`self-end text-sm ${invalid ? 'text-muted' : 'text-success font-bold'}`}>
          {Math.min(count, minChars)}/{minChars}
        </span>
      )}
    </div>
  )
}
```

`src/design/ui/PathNode.tsx`:
```tsx
import type { PhaseId } from '@/content/types'
import type { NodeState } from '@/domain/unlock'

const phaseBg: Record<PhaseId, string> = { f1: 'bg-f1', f2: 'bg-f2', f3: 'bg-f3', f4: 'bg-f4' }
const stateLabel: Record<NodeState, string> = { locked: 'bloqueada', available: 'disponível', done: 'concluída' }

type Props = { state: NodeState; phase: PhaseId; label: string; onClick?: () => void }

export function PathNode({ state, phase, label, onClick }: Props) {
  const color = state === 'locked' ? 'bg-locked' : phaseBg[phase]
  return (
    <button type="button" onClick={onClick} disabled={state === 'locked'}
      aria-label={`${label}, ${stateLabel[state]}`}
      className={`relative grid size-20 place-items-center rounded-full ${color} text-white shadow-press
        transition-transform duration-[var(--duration-base)] ease-[var(--ease-bounce)]
        active:translate-y-1 active:shadow-none disabled:cursor-not-allowed
        focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand
        ${state === 'available' ? 'ring-4 ring-offset-4 ring-offset-bg ring-current animate-pulse motion-reduce:animate-none' : ''}`}>
      <span aria-hidden className="text-3xl">{state === 'locked' ? '🔒' : state === 'done' ? '✓' : '★'}</span>
    </button>
  )
}
```

`src/design/ui/BottomNav.tsx`:
```tsx
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

export function BottomNav({ items }: { items: { to: string; label: string; icon: ReactNode }[] }) {
  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map((i) => (
          <li key={i.to}>
            <NavLink to={i.to} end={i.to === '/'}
              className={({ isActive }) => `flex min-h-14 min-w-14 flex-col items-center justify-center gap-0.5 px-2 text-xs font-bold
                ${isActive ? 'text-brand-strong' : 'text-muted'}`}>
              {i.icon}
              <span>{i.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

`src/design/ui/index.ts`:
```ts
export { Button } from './Button'
export { Card } from './Card'
export { Badge } from './Badge'
export { ProgressBar } from './ProgressBar'
export { Checkbox } from './Checkbox'
export { TextArea } from './TextArea'
export { PathNode } from './PathNode'
export { BottomNav } from './BottomNav'
```

`src/design/UiPreview.tsx`:
```tsx
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
```

Em `src/App.tsx`, adicionar a rota de preview apenas em desenvolvimento:
```tsx
import { lazy, Suspense } from 'react'
const UiPreview = lazy(() => import('./design/UiPreview'))
// dentro de <Routes>, antes do "*":
{import.meta.env.DEV && <Route path="/ui" element={<Suspense><UiPreview /></Suspense>} />}
```

- [ ] **Step 4: Ver passar** — Run: `npm test` · Expected: todos PASS.

- [ ] **Step 5: Verificação visual** — Run: `npm run dev`, abrir `http://localhost:5173/ui` a 375 px e a 1280 px, nos modos claro e escuro; conferir foco por teclado (Tab) e `prefers-reduced-motion`. Tirar screenshots e mostrar ao usuário.

- [ ] **Step 6: Commit** — `git add src && git commit -m "feat(design): base components and /ui preview"`

---

### Task 12: Autenticação e deploy de preview

**Files:**
- Create: `src/lib/supabase.ts`, `src/features/auth/AuthProvider.tsx`, `src/features/auth/RequireAuth.tsx`, `src/features/auth/LoginScreen.tsx`, `vercel.json`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/features/auth/auth.test.tsx`

**Interfaces:**
- Consumes: `Button` (Task 11)
- Produces:
  - `supabase` (cliente único)
  - `useAuth(): { session: Session | null; profile: { id: string; role: 'aluna' | 'mentor'; name: string } | null; loading: boolean; signOut(): Promise<void> }`
  - `<RequireAuth role?="mentor">` — redireciona para `/login` sem sessão; para `/` se o papel não bate

- [ ] **Step 1: Testes** (Supabase mockado)

`src/features/auth/auth.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'

const signInWithOtp = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp,
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}))

import { AuthProvider } from './AuthProvider'
import { RequireAuth } from './RequireAuth'
import { LoginScreen } from './LoginScreen'

test('envia magic link sem criar usuário', async () => {
  render(<MemoryRouter><AuthProvider><LoginScreen /></AuthProvider></MemoryRouter>)
  await userEvent.type(screen.getByLabelText(/e-mail/i), 'ela@exemplo.com')
  await userEvent.click(screen.getByRole('button', { name: /enviar link/i }))
  expect(signInWithOtp).toHaveBeenCalledWith({
    email: 'ela@exemplo.com',
    options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
  })
  expect(await screen.findByText(/confira seu e-mail/i)).toBeInTheDocument()
})

test('rota protegida manda visitante para /login', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>tela de login</p>} />
          <Route path="/" element={<RequireAuth><p>privado</p></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
  expect(await screen.findByText('tela de login')).toBeInTheDocument()
})
```

- [ ] **Step 2: Ver falhar** — Run: `npx vitest run src/features/auth` · Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local')

export const supabase = createClient(url, key)
```

`src/features/auth/AuthProvider.tsx`:
```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type Profile = { id: string; role: 'aluna' | 'mentor'; name: string }
type AuthState = { session: Session | null; profile: Profile | null; loading: boolean; signOut: () => Promise<void> }

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setProfile(null); return }
    setLoading(true)
    supabase.from('profiles').select('id, role, name').eq('id', session.user.id).single()
      .then(({ data }) => { setProfile(data as Profile | null); setLoading(false) })
  }, [session])

  const signOut = async () => { await supabase.auth.signOut() }

  return <AuthContext.Provider value={{ session, profile, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
```

`src/features/auth/RequireAuth.tsx`:
```tsx
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './AuthProvider'

export function RequireAuth({ children, role }: { children: ReactNode; role?: 'aluna' | 'mentor' }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <p className="p-6 text-muted" role="status">Carregando…</p>
  if (!session) return <Navigate to="/login" replace />
  if (role && profile?.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}
```

`src/features/auth/LoginScreen.tsx`:
```tsx
import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/design/ui'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-4">
      <h1 className="text-3xl font-black">Entrar</h1>
      {status === 'sent' ? (
        <p role="status">Confira seu e-mail e toque no link para entrar.</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 font-bold">
            E-mail
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-card border-2 border-line bg-surface px-3 font-normal focus:border-brand focus:outline-none" />
          </label>
          <Button type="submit" loading={status === 'sending'}>Enviar link</Button>
          {status === 'error' && <p role="alert" className="text-danger">Não foi possível enviar. Esse e-mail tem acesso?</p>}
        </form>
      )}
    </main>
  )
}
```

`src/App.tsx` (substituir o placeholder):
```tsx
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { LoginScreen } from './features/auth/LoginScreen'
import { RequireAuth } from './features/auth/RequireAuth'

const UiPreview = lazy(() => import('./design/UiPreview'))

function HomePlaceholder() {
  return <h1 className="p-6 text-2xl font-black">Hoje</h1>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      {import.meta.env.DEV && <Route path="/ui" element={<Suspense><UiPreview /></Suspense>} />}
      <Route path="/" element={<RequireAuth><HomePlaceholder /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

Em `src/main.tsx`, envolver `<AppRoutes />` com `<AuthProvider>`. Em `src/App.test.tsx`, adicionar o mesmo `vi.mock('@/lib/supabase', …)` do teste de auth e envolver com `<AuthProvider>`; trocar a expectativa para `getByRole('heading', { name: 'Entrar' })`.

`vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

- [ ] **Step 4: Ver passar** — Run: `npm test && npm run build` · Expected: tudo PASS; build ok.

- [ ] **Step 5: Teste manual local** — criar as 2 contas no Supabase local (Studio em `http://127.0.0.1:54323` → Authentication → Add user), inserir `profiles` correspondentes pelo SQL Editor, pedir magic link em `/login` e abrir o e-mail no Inbucket (`http://127.0.0.1:54324`). Expected: entra e vê "Hoje".

- [ ] **Step 6: Deploy de preview (ação do usuário: contas)** — o usuário cria o projeto no Supabase (região São Paulo) e o projeto na Vercel. Então:
```bash
npx supabase link --project-ref <ref>
npx supabase db push
```
Na Vercel: importar o repositório, definir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do projeto de produção; em Supabase → Authentication → URL Configuration, adicionar a URL da Vercel em *Site URL* e *Redirect URLs*; desativar *Allow new users to sign up*; convidar os 2 e-mails e inserir os `profiles`.
Expected: login por magic link funcionando na URL da Vercel.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(auth): magic link login, route guard and vercel config"`

---

## Após a Parte 2

Com as Tasks 1–12 verdes: E1, E2 e E3 estão concluídas. O próximo passo é detalhar **E4 — Trilha** neste arquivo (nova "Parte 3") no mesmo formato, reutilizando `computeNodeStates`, `deriveAutoChecks`, `PathNode`, `Checkbox` e `ProgressBar`.
