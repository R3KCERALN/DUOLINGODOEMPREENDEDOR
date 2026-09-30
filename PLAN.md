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

---

# Parte 3 — Plano detalhado: E4 Trilha

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o mapa da trilha (estilo Duolingo, com baú de fase e override do mentor), a tela da semana, a tela Hoje e a camada de dados de progresso, fechando com um E2E "concluir semana → próxima liberada".

**Architecture:** Toda regra continua pura em `src/domain` (novos `trailState.ts` e `routine.ts`, que reaproveitam `computeNodeStates` e `deriveAutoChecks`). O acesso ao Supabase fica isolado em um único módulo de hooks TanStack Query (`src/features/progress/hooks.ts`); as telas só consomem esse módulo e os testes de tela o mockam. O contrato (tipos + nomes dos hooks) é publicado primeiro (Task 13), para W1 e W4 trabalharem em paralelo com o W3.

**Tech Stack:** o da Parte 1. Nova só a dev dependency `@playwright/test` (Task 19), já prevista no Tech Stack.

**Spec:** `PRD.md` §4.2 (RF-10–16), §4.3 (RF-20–23), §4.4 (RF-30–32), §4.5 (RF-40–42).

## Global Constraints (adicionais à Parte 1)

- Telas nunca importam `@/lib/supabase`; só `@/features/progress/hooks` (e `useAuth`). Testes de tela mockam `@/features/progress/hooks` usando `src/test/progressMocks.ts`.
- Rotina diária (RF-30/31) é guardada em `item_progress` com id `day.<YYYY-MM-DD>.<chave>` (ex.: `day.2026-09-29.voz`); sem migração nova. A data vem sempre de `spDate(new Date())` (fuso SP).
- Itens de portão manuais são guardados em `item_progress` com o id do `GateItem` (ex.: `f1.gate.2`). Itens com `auto` nunca são marcados à mão.
- Visual: só componentes e tokens de `src/design` (tema "cyber cassino" aprovado). Nada de cor hex nas telas. `font-display` (Doto) só em títulos ≥ 20 px.
- Links para rotas da E6 já usam o caminho final (`/biblioteca/:bookId`, `/caderno`, `/caderno/notas/nova?semana=<id>`); até a E6 existir, caem no redirecionamento para `/`.
- Até a E5, `buildTrailState` recebe `NO_SIMULATIONS`: os itens automáticos `f2.gate.2`, `f2.gate.4` e `f4.gate.3` ficam desmarcados e o baú da Fase 2 só abre com override do mentor. A E5 passa os dados reais de simulados.
- RF-42 (checklists manuais) fica na E6, com o `ChecklistEditor` já previsto no roteiro. RF-41 é coberto aqui: o RLS já permite que o mentor desmarque qualquer item, e a UI mostra erro legível quando a aluna tenta desmarcar o que não marcou.

## Review Focus

1. **Aluna desmarcando item marcado pelo mentor:** o RLS apaga 0 linhas sem erro; a UI não pode ficar desmarcada em silêncio. Deve voltar a marcação e mostrar "Só quem marcou este item ou o mentor pode desmarcá-lo." → unit em Task 14 + alerta em Task 16.
2. **Rotina perto da meia-noite / celular em outro fuso:** às 23:30 de SP (02:30 UTC do dia seguinte), marcar um item da rotina grava `day.<data de SP>`, não a data UTC. → unit em Task 17.
3. **URL direta para semana bloqueada ou inexistente:** `/trilha/w09` com a aluna na semana 1 mostra "Esta etapa ainda está bloqueada" sem checkboxes; `/trilha/w99` mostra "Semana não encontrada". → unit em Task 16.
4. **Toque duplo em "marcar":** o segundo insert não pode estourar a chave primária de `item_progress`. → unit em Task 14 (upsert com `ignoreDuplicates`).
5. **Item automático de portão marcado "à mão":** uma linha `f1.gate.1` em `item_progress` (inserida por API) não conta; o baú mostra o item automático desabilitado. → unit em Task 13 + Task 15.

## Ordem e paralelismo

| Passo | Task | Dono | Depende de | Roda em paralelo com |
|---|---|---|---|---|
| 1 | 13 — Domínio da trilha e contrato de dados | **W3** | Tasks 1–12 | — |
| 2 | 14 — Hooks de dados (Supabase + TanStack Query) | **W3** | 13 | 15, 16, 17 |
| 2 | 15 — TrailMap, baú de fase e override do mentor | **W4** | 13 | 14, 16, 17 |
| 2 | 16 — WeekScreen | **W1** | 13 | 14, 15 |
| 3 | 17 — TodayScreen | **W1** | 13 (depois da 16, mesmo dono) | 14, 15 |
| 4 | 18 — AppShell e rotas | **W4** | 15, 16, 17 | — |
| 5 | 19 — E2E: concluir semana → próxima liberada | **W4** | 14, 18 | — |

**Arquivos compartilhados (evitar conflito):** `src/App.tsx` só na Task 18; `package.json`, `.gitignore` e `supabase/config.toml` só na Task 19 (quando o W3 já terminou a 14); `src/design/ui/PixelIcon.tsx` só na Task 15. Em `src/features/trail/`, W4 cria `TrailMap`, `GateChest` e `OverridePanel`; W1 cria `WeekScreen` e `youtube.ts`.

## Estrutura de arquivos (criada nesta parte)

```
src/
├── domain/
│   ├── trailState.ts (+ .test.ts)     # T13: estado derivado da trilha (portão, fase atual, próximo item)
│   └── routine.ts (+ .test.ts)        # T13: rotina diária (RF-30/31) e ids por dia
├── features/
│   ├── progress/
│   │   ├── types.ts                   # T13: contrato de dados
│   │   ├── hooks.ts                   # T13 (esqueleto) → T14 (implementação)
│   │   ├── contract.test.ts           # T13: nomes exportados fixos
│   │   └── hooks.test.tsx             # T14
│   ├── trail/
│   │   ├── TrailMap.tsx (+ .test.tsx) # T15
│   │   ├── GateChest.tsx              # T15
│   │   ├── OverridePanel.tsx          # T15
│   │   ├── WeekScreen.tsx (+ .test.tsx) # T16
│   │   └── youtube.ts (+ .test.ts)    # T16
│   ├── today/TodayScreen.tsx (+ .test.tsx) # T17
│   └── shell/AppShell.tsx (+ .test.tsx)    # T18
├── test/progressMocks.ts              # T13: fábricas de mock para testes de tela
└── App.tsx                            # T18: rotas autenticadas
e2e/support.ts, e2e/trail.spec.ts, playwright.config.ts   # T19
```

---

### Task 13: Domínio da trilha e contrato de dados — **[W3]**

**Files:**
- Create: `src/domain/trailState.ts`, `src/domain/routine.ts`, `src/features/progress/types.ts`, `src/features/progress/hooks.ts`, `src/test/progressMocks.ts`
- Test: `src/domain/trailState.test.ts`, `src/domain/routine.test.ts`, `src/features/progress/contract.test.ts`

**Interfaces:**
- Consumes: `computeNodeStates`, `NodeState` (`@/domain/unlock`); `deriveAutoChecks` (`@/domain/phaseChecks`); `NODES`, `PHASES`, `nodeById` (`@/content/trail`); tipos de `@/content/types`.
- Produces (**contrato usado por W1, W3 e W4 — não renomear**):
  - `interface NodeOverride { nodeId: string; state: 'unlocked' | 'locked'; byName: string; at: string }`
  - `interface SimulationFacts { originalObjectiveIds: string[]; evaluatedObjectiveIds: ReadonlySet<string>; f2Officials: number[]; hardOfficials: number[] }`, `const NO_SIMULATIONS: SimulationFacts`
  - `interface NextPending { node: TrailNode; item: TrailItem }`
  - `interface TrailState { states: ReadonlyMap<string, NodeState>; gateDone: ReadonlySet<string>; autoGate: ReadonlySet<string>; overrides: ReadonlyMap<string, NodeOverride>; currentPhase: PhaseId; next: NextPending | null }`
  - `gateDoneSet(doneItems: ReadonlySet<string>, auto: ReadonlySet<AutoCheck>): Set<string>`
  - `buildTrailState(doneItems: ReadonlySet<string>, overrides: ReadonlyMap<string, NodeOverride>, sim?: SimulationFacts): TrailState`
  - `type RoutineKey = 'caderno' | 'voz' | 'voz_alta' | 'leitura' | 'desafio' | 'simulado' | 'video' | 'revisao' | 'chefe'`
  - `interface RoutineItem { key: RoutineKey; label: string; minutes?: number; hint?: string }`
  - `weekday(iso: string): number` (0 = domingo), `routineItemId(date: string, key: RoutineKey): string`, `dailyRoutine(date: string, phase: PhaseId, journalDone: boolean): RoutineItem[]`
  - `src/features/progress/types.ts`: `ProgressData { doneItems: ReadonlySet<string> }`, `ToggleItemVars { itemId: string; done: boolean }`, `SetOverrideVars { nodeId: string; state: 'unlocked' | 'locked' | null }`, `NodeStatesResult { data: TrailState | undefined; isLoading: boolean; error: Error | null }`
  - `src/features/progress/hooks.ts` exporta exatamente: `useProgress(): UseQueryResult<ProgressData>`, `useNodeStates(): NodeStatesResult`, `useToggleItem(): UseMutationResult<void, Error, ToggleItemVars>`, `useSetOverride(): UseMutationResult<void, Error, SetOverrideVars>`, `useJournalDays(): UseQueryResult<ReadonlySet<string>>`
  - `src/test/progressMocks.ts`: `nodeStatesOf(done?, overrides?)`, `progressOf(done?)`, `queryOf<T>(data)`, `mutationOf(mutate?, error?)`

- [ ] **Step 1: Testes do estado da trilha**

`src/domain/trailState.test.ts`:
```ts
import { NODES } from '@/content/trail'
import { buildTrailState, gateDoneSet, type NodeOverride } from './trailState'

const none = new Map<string, NodeOverride>()
const itemsOf = (phase: string) => NODES.filter((n) => n.phase === phase).flatMap((n) => n.items.map((i) => i.id))
const F1_MANUAL_GATE = ['f1.gate.2', 'f1.gate.3', 'f1.gate.4', 'f1.gate.5']

test('trilha nova: só a semana 1 disponível e o próximo item é o 1º obrigatório dela', () => {
  const s = buildTrailState(new Set(), none)
  expect(s.states.get('w01')).toBe('available')
  expect(s.states.get('w02')).toBe('locked')
  expect(s.currentPhase).toBe('f1')
  expect(s.next?.node.id).toBe('w01')
  expect(s.next?.item.id).toBe(NODES[0].items.find((i) => i.required)!.id)
})

test('itens automáticos do portão são identificados', () => {
  expect([...buildTrailState(new Set(), none).autoGate].sort()).toEqual(['f1.gate.1', 'f2.gate.2', 'f2.gate.4', 'f4.gate.3'])
})

test('assistir aos 6 vídeos da Fase 1 marca o item automático do portão', () => {
  const videos = NODES.filter((n) => n.phase === 'f1').flatMap((n) => n.items).filter((i) => i.kind === 'video').map((i) => i.id)
  expect(buildTrailState(new Set(videos), none).gateDone.has('f1.gate.1')).toBe(true)
})

test('item automático não conta quando marcado à mão', () => {
  const s = gateDoneSet(new Set(['f1.gate.1', 'f1.gate.2']), new Set())
  expect(s.has('f1.gate.1')).toBe(false)
  expect(s.has('f1.gate.2')).toBe(true)
})

test('Fase 1 completa com o baú fechado passa a fase atual para a 2', () => {
  const s = buildTrailState(new Set([...itemsOf('f1'), ...F1_MANUAL_GATE]), none)
  expect(s.states.get('w04')).toBe('done')
  expect(s.states.get('w05')).toBe('available')
  expect(s.currentPhase).toBe('f2')
  expect(s.next?.node.id).toBe('w05')
})

test('dados de simulados (E5) alimentam os itens automáticos da Fase 2', () => {
  const s = buildTrailState(new Set(), none, {
    originalObjectiveIds: ['o1'], evaluatedObjectiveIds: new Set(['o1']), f2Officials: [16], hardOfficials: [],
  })
  expect(s.gateDone.has('f2.gate.2')).toBe(true)
  expect(s.gateDone.has('f2.gate.4')).toBe(true)
  expect(buildTrailState(new Set(), none).gateDone.has('f2.gate.4')).toBe(false)
})

test('marcas da rotina diária não interferem na trilha', () => {
  expect(buildTrailState(new Set(['day.2026-09-29.voz']), none).states.get('w02')).toBe('locked')
})

test('override do mentor é repassado e bloqueio tira o próximo item', () => {
  const o: NodeOverride = { nodeId: 'w01', state: 'locked', byName: 'Allan', at: '2026-09-29T15:00:00Z' }
  const s = buildTrailState(new Set(), new Map([['w01', o]]))
  expect(s.states.get('w01')).toBe('locked')
  expect(s.overrides.get('w01')).toEqual(o)
  expect(s.next).toBeNull()
  expect(s.currentPhase).toBe('f1')
})
```

- [ ] **Step 2: Testes da rotina**

`src/domain/routine.test.ts`:
```ts
import { dailyRoutine, routineItemId, weekday } from './routine'

const keys = (date: string, phase: 'f1' | 'f2', journalDone: boolean) => dailyRoutine(date, phase, journalDone).map((i) => i.key)

test('weekday usa a data do calendário, sem fuso', () => {
  expect(weekday('2026-09-29')).toBe(2)
  expect(weekday('2026-10-04')).toBe(0)
  expect(() => weekday('2026-02-30')).toThrow('Data inválida')
  expect(() => weekday('29/09/2026')).toThrow('Data inválida')
})

test('caderno fica no topo até ser preenchido e depois vai para o fim', () => {
  expect(keys('2026-09-29', 'f1', false)).toEqual(['caderno', 'voz', 'voz_alta', 'leitura', 'desafio', 'simulado', 'video'])
  expect(keys('2026-09-29', 'f1', true)).toEqual(['voz', 'voz_alta', 'leitura', 'desafio', 'simulado', 'video', 'caderno'])
})

test('sábado tem simulado chefe e domingo tem revisão da semana', () => {
  expect(keys('2026-10-03', 'f1', true)).toContain('chefe')
  expect(keys('2026-10-03', 'f1', true)).not.toContain('revisao')
  expect(keys('2026-10-04', 'f1', true)).toContain('revisao')
  expect(keys('2026-10-04', 'f1', true)).not.toContain('chefe')
})

test('Fase 1 usa a escada do medo; depois vira abordagem real com a regra 70/30', () => {
  const f1 = dailyRoutine('2026-09-29', 'f1', true).find((i) => i.key === 'desafio')!
  const f2 = dailyRoutine('2026-09-29', 'f2', true).find((i) => i.key === 'desafio')!
  expect(f1.label).toBe('Desafio da escada do medo')
  expect(f1.hint).toBeUndefined()
  expect(f2.label).toBe('1 abordagem real')
  expect(f2.hint).toMatch(/70\/30/)
  expect(dailyRoutine('2026-09-29', 'f1', true).find((i) => i.key === 'simulado')!.hint).toMatch(/70\/30/)
})

test('leitura em voz alta faz parte da rotina', () => {
  expect(dailyRoutine('2026-09-29', 'f2', true).find((i) => i.key === 'voz_alta')).toEqual({ key: 'voz_alta', label: 'Leitura em voz alta', minutes: 5 })
})

test('id do item da rotina inclui o dia', () => {
  expect(routineItemId('2026-09-29', 'voz')).toBe('day.2026-09-29.voz')
})
```

- [ ] **Step 3: Teste do contrato dos hooks**

`src/features/progress/contract.test.ts`:
```ts
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

test('o módulo de hooks exporta exatamente o contrato combinado', async () => {
  const mod = await import('./hooks')
  expect(Object.keys(mod).sort()).toEqual(['useJournalDays', 'useNodeStates', 'useProgress', 'useSetOverride', 'useToggleItem'])
})
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npx vitest run src/domain/trailState.test.ts src/domain/routine.test.ts src/features/progress 2>&1 | tail -15`
Expected: FAIL — `Failed to resolve import "./trailState"` / `"./routine"` / `"./hooks"`.

- [ ] **Step 5: Implementar `trailState.ts`**

`src/domain/trailState.ts`:
```ts
import { NODES, PHASES, nodeById } from '@/content/trail'
import type { AutoCheck, PhaseId, TrailItem, TrailNode } from '@/content/types'
import { deriveAutoChecks } from './phaseChecks'
import { computeNodeStates, type NodeState } from './unlock'

export interface NodeOverride { nodeId: string; state: 'unlocked' | 'locked'; byName: string; at: string }

export interface SimulationFacts {
  originalObjectiveIds: string[]
  evaluatedObjectiveIds: ReadonlySet<string>
  f2Officials: number[]
  hardOfficials: number[]
}

/** Até a E5 não há simulados avaliados: os itens automáticos que dependem deles ficam desmarcados. */
export const NO_SIMULATIONS: SimulationFacts = { originalObjectiveIds: [], evaluatedObjectiveIds: new Set(), f2Officials: [], hardOfficials: [] }

export interface NextPending { node: TrailNode; item: TrailItem }

export interface TrailState {
  states: ReadonlyMap<string, NodeState>
  gateDone: ReadonlySet<string>
  autoGate: ReadonlySet<string>
  overrides: ReadonlyMap<string, NodeOverride>
  currentPhase: PhaseId
  next: NextPending | null
}

const PATH = PHASES.flatMap((p) => p.nodeIds)
const F1_VIDEO_IDS = NODES.filter((n) => n.phase === 'f1').flatMap((n) => n.items).filter((i) => i.kind === 'video').map((i) => i.id)
const AUTO_GATE = new Map<string, AutoCheck>(PHASES.flatMap((p) => p.gate).flatMap((g) => (g.auto ? [[g.id, g.auto] as const] : [])))

export function gateDoneSet(doneItems: ReadonlySet<string>, auto: ReadonlySet<AutoCheck>): Set<string> {
  const out = new Set<string>()
  for (const g of PHASES.flatMap((p) => p.gate)) {
    const check = AUTO_GATE.get(g.id)
    if (check ? auto.has(check) : doneItems.has(g.id)) out.add(g.id)
  }
  return out
}

export function buildTrailState(
  doneItems: ReadonlySet<string>,
  overrides: ReadonlyMap<string, NodeOverride>,
  sim: SimulationFacts = NO_SIMULATIONS,
): TrailState {
  const auto = deriveAutoChecks({ watchedVideoIds: doneItems, f1VideoIds: F1_VIDEO_IDS, ...sim })
  const gateDone = gateDoneSet(doneItems, auto)
  const states = computeNodeStates({
    phases: PHASES,
    nodes: NODES,
    doneItems,
    gateDone,
    overrides: new Map([...overrides].map(([id, o]) => [id, o.state])),
  })

  let next: NextPending | null = null
  for (const id of PATH) {
    if (states.get(id) !== 'available') continue
    const node = nodeById(id)
    const item = node.items.find((i) => i.required && !doneItems.has(i.id))
    if (item) { next = { node, item }; break }
  }

  const currentId = PATH.find((id) => states.get(id) === 'available') ?? [...PATH].reverse().find((id) => states.get(id) === 'done')
  const currentPhase = currentId ? nodeById(currentId).phase : 'f1'

  return { states, gateDone, autoGate: new Set(AUTO_GATE.keys()), overrides, currentPhase, next }
}
```

- [ ] **Step 6: Implementar `routine.ts`**

`src/domain/routine.ts`:
```ts
import type { PhaseId } from '@/content/types'

export type RoutineKey = 'caderno' | 'voz' | 'voz_alta' | 'leitura' | 'desafio' | 'simulado' | 'video' | 'revisao' | 'chefe'
export interface RoutineItem { key: RoutineKey; label: string; minutes?: number; hint?: string }

const RULE_70_30 = 'Regra 70/30: o cliente fala 70% do tempo e você, 30%.'

/** Dia da semana de uma data de calendário (0 = domingo), sem depender do fuso do aparelho. */
export function weekday(iso: string): number {
  const d = new Date(`${iso}T12:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) {
    throw new Error(`Data inválida: ${iso}`)
  }
  return d.getUTCDay()
}

export function routineItemId(date: string, key: RoutineKey): string {
  return `day.${date}.${key}`
}

/** RF-30/31: rotina do dia. O caderno fica no topo até ser preenchido (RF-50). */
export function dailyRoutine(date: string, phase: PhaseId, journalDone: boolean): RoutineItem[] {
  const caderno: RoutineItem = { key: 'caderno', label: 'Caderno: 3 linhas', minutes: 3 }
  const items: RoutineItem[] = [
    { key: 'voz', label: 'Aquecimento de voz + pitch de 30 s', minutes: 5 },
    { key: 'voz_alta', label: 'Leitura em voz alta', minutes: 5 },
    { key: 'leitura', label: 'Leitura ou audiolivro', minutes: 20 },
    phase === 'f1'
      ? { key: 'desafio', label: 'Desafio da escada do medo', minutes: 10 }
      : { key: 'desafio', label: '1 abordagem real', minutes: 10, hint: RULE_70_30 },
    { key: 'simulado', label: 'Simulado (1 a 3 por dia)', hint: RULE_70_30 },
    { key: 'video', label: 'Vídeo da semana ou curso', minutes: 15 },
  ]
  const day = weekday(date)
  if (day === 6) items.push({ key: 'chefe', label: 'Simulado chefe', minutes: 10 })
  if (day === 0) items.push({ key: 'revisao', label: 'Revisão da semana', minutes: 30 })
  return journalDone ? [...items, caderno] : [caderno, ...items]
}
```

- [ ] **Step 7: Contrato de dados, esqueleto dos hooks e mocks de teste**

`src/features/progress/types.ts`:
```ts
import type { TrailState } from '@/domain/trailState'

export interface ProgressData { doneItems: ReadonlySet<string> }
export interface ToggleItemVars { itemId: string; done: boolean }
/** `state: null` remove o override (volta à regra automática). */
export interface SetOverrideVars { nodeId: string; state: 'unlocked' | 'locked' | null }
export interface NodeStatesResult { data: TrailState | undefined; isLoading: boolean; error: Error | null }
```

`src/features/progress/hooks.ts` (esqueleto; a Task 14 troca os corpos, sem mudar nomes nem tipos):
```ts
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { NodeStatesResult, ProgressData, SetOverrideVars, ToggleItemVars } from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 14`)
}

export function useProgress(): UseQueryResult<ProgressData> { return notYet('useProgress') }
export function useNodeStates(): NodeStatesResult { return notYet('useNodeStates') }
export function useToggleItem(): UseMutationResult<void, Error, ToggleItemVars> { return notYet('useToggleItem') }
export function useSetOverride(): UseMutationResult<void, Error, SetOverrideVars> { return notYet('useSetOverride') }
export function useJournalDays(): UseQueryResult<ReadonlySet<string>> { return notYet('useJournalDays') }
```

`src/test/progressMocks.ts`:
```ts
import type { UseQueryResult } from '@tanstack/react-query'
import { buildTrailState, type NodeOverride } from '@/domain/trailState'
import type { NodeStatesResult, ProgressData } from '@/features/progress/types'

/** Estado real da trilha (via domínio) para mockar `useNodeStates`. */
export function nodeStatesOf(done: string[] = [], overrides: NodeOverride[] = []): NodeStatesResult {
  return { data: buildTrailState(new Set(done), new Map(overrides.map((o) => [o.nodeId, o]))), isLoading: false, error: null }
}

export function queryOf<T>(data: T): UseQueryResult<T> {
  return { data, isLoading: false, isPending: false, isError: false, error: null, status: 'success' } as unknown as UseQueryResult<T>
}

export function progressOf(done: string[] = []): UseQueryResult<ProgressData> {
  return queryOf<ProgressData>({ doneItems: new Set(done) })
}

/** Retorna `never` de propósito: serve para qualquer `vi.mocked(useXxx).mockReturnValue(...)` de mutation, seja qual for o contexto interno. */
export function mutationOf(mutate = vi.fn(), error: Error | null = null): never {
  return { mutate, mutateAsync: vi.fn(), isPending: false, error, reset: vi.fn() } as never
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run src/domain src/features/progress 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS em todos os arquivos; `tsc` sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/domain/trailState.ts src/domain/trailState.test.ts src/domain/routine.ts src/domain/routine.test.ts src/features/progress src/test/progressMocks.ts
git commit -m "feat(domain): trail state, daily routine and progress data contract"
```

---

### Task 14: Hooks de dados (Supabase + TanStack Query) — **[W3]**

**Files:**
- Modify: `src/features/progress/hooks.ts` (troca o esqueleto pela implementação)
- Test: `src/features/progress/hooks.test.tsx`

**Interfaces:**
- Consumes: `supabase` (`@/lib/supabase`); `buildTrailState`, `NodeOverride` (Task 13); tipos de `./types` (Task 13). Tabelas `item_progress(item_id, done_at, done_by)`, `node_overrides(node_id, state, by, at)` com FK `by → profiles`, `journal_entries(date, complete)`.
- Produces: os 5 hooks do contrato da Task 13, com os mesmos nomes e tipos. Query keys internas (não exportadas): `['item_progress']`, `['node_overrides']`, `['journal_days']`.

- [ ] **Step 1: Testes com um Supabase falso**

`src/features/progress/hooks.test.tsx`:
```tsx
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NODES } from '@/content/trail'
import type { ProgressData } from './types'

type Result = { data: unknown; error: unknown; count?: number | null }

const { from, getSession, results, calls } = vi.hoisted(() => {
  const results: Record<string, Result[]> = {}
  const calls: { table: string; method: string; args: unknown[] }[] = []
  const from = vi.fn((table: string) => {
    const b: Record<string, unknown> = {}
    for (const m of ['select', 'upsert', 'delete', 'eq']) {
      b[m] = (...args: unknown[]) => { calls.push({ table, method: m, args }); return b }
    }
    b.then = (ok: (r: Result) => unknown, fail: (e: unknown) => unknown) =>
      Promise.resolve(results[table]?.shift() ?? { data: [], error: null }).then(ok, fail)
    return b
  })
  const getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'mentor-1' } } } })
  return { from, getSession, results, calls }
})
vi.mock('@/lib/supabase', () => ({ supabase: { from, auth: { getSession } } }))

import { useJournalDays, useNodeStates, useProgress, useSetOverride, useToggleItem } from './hooks'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => {
  calls.length = 0
  for (const k of Object.keys(results)) delete results[k]
})

test('useProgress transforma as linhas em um conjunto de ids', async () => {
  results.item_progress = [{ data: [{ item_id: 'w01.video.1' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useProgress(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data?.doneItems.has('w01.video.1')).toBe(true))
})

test('useNodeStates junta progresso e overrides do mentor', async () => {
  results.item_progress = [{ data: NODES[0].items.map((i) => ({ item_id: i.id })), error: null }]
  results.node_overrides = [{ data: [{ node_id: 'w03', state: 'unlocked', at: '2026-09-29T15:00:00Z', profiles: { name: 'Allan' } }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useNodeStates(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toBeDefined())
  expect(result.current.data!.states.get('w01')).toBe('done')
  expect(result.current.data!.states.get('w02')).toBe('available')
  expect(result.current.data!.states.get('w03')).toBe('available')
  expect(result.current.data!.overrides.get('w03')).toEqual({ nodeId: 'w03', state: 'unlocked', byName: 'Allan', at: '2026-09-29T15:00:00Z' })
})

test('marcar item é idempotente (toque duplo não estoura a chave)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useToggleItem(), { wrapper: Wrapper })
  await act(() => result.current.mutateAsync({ itemId: 'w01.pitch', done: true }))
  expect(calls).toContainEqual({ table: 'item_progress', method: 'upsert', args: [{ item_id: 'w01.pitch' }, { onConflict: 'item_id', ignoreDuplicates: true }] })
})

test('marcação otimista volta atrás quando o banco recusa', async () => {
  results.item_progress = [{ data: null, error: new Error('rede') }]
  const { qc, Wrapper } = setup()
  qc.setQueryData<ProgressData>(['item_progress'], { doneItems: new Set() })
  const { result } = renderHook(() => useToggleItem(), { wrapper: Wrapper })
  await act(async () => { await result.current.mutateAsync({ itemId: 'w01.pitch', done: true }).catch(() => undefined) })
  expect(qc.getQueryData<ProgressData>(['item_progress'])!.doneItems.has('w01.pitch')).toBe(false)
  await waitFor(() => expect(result.current.error?.message).toBe('rede'))
})

test('aluna não desmarca item marcado pelo mentor: erro legível', async () => {
  results.item_progress = [{ data: [], error: null }, { data: null, error: null, count: 1 }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useToggleItem(), { wrapper: Wrapper })
  await act(async () => {
    await expect(result.current.mutateAsync({ itemId: 'f1.gate.2', done: false }))
      .rejects.toThrow('Só quem marcou este item ou o mentor pode desmarcá-lo.')
  })
})

test('desmarcar item que já não existe não é erro', async () => {
  results.item_progress = [{ data: [], error: null }, { data: null, error: null, count: 0 }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useToggleItem(), { wrapper: Wrapper })
  await act(() => result.current.mutateAsync({ itemId: 'w01.pitch', done: false }))
  expect(calls).toContainEqual({ table: 'item_progress', method: 'eq', args: ['item_id', 'w01.pitch'] })
})

test('override grava quem fez; null volta à regra automática', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSetOverride(), { wrapper: Wrapper })
  await act(() => result.current.mutateAsync({ nodeId: 'w07', state: 'unlocked' }))
  const up = calls.find((c) => c.table === 'node_overrides' && c.method === 'upsert')!
  expect(up.args[0]).toMatchObject({ node_id: 'w07', state: 'unlocked', by: 'mentor-1' })
  expect(up.args[1]).toEqual({ onConflict: 'node_id' })
  await act(() => result.current.mutateAsync({ nodeId: 'w07', state: null }))
  expect(calls.some((c) => c.table === 'node_overrides' && c.method === 'delete')).toBe(true)
  expect(calls).toContainEqual({ table: 'node_overrides', method: 'eq', args: ['node_id', 'w07'] })
})

test('useJournalDays lista só os dias com caderno completo', async () => {
  results.journal_entries = [{ data: [{ date: '2026-09-28' }, { date: '2026-09-29' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useJournalDays(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data?.has('2026-09-29')).toBe(true))
  expect(calls).toContainEqual({ table: 'journal_entries', method: 'eq', args: ['complete', true] })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/progress/hooks.test.tsx 2>&1 | tail -15`
Expected: FAIL — `useProgress: implementado na Task 14` (esqueleto da Task 13).

- [ ] **Step 3: Implementar os hooks**

`src/features/progress/hooks.ts` (substitui o arquivo inteiro):
```ts
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { buildTrailState, type NodeOverride } from '@/domain/trailState'
import type { NodeStatesResult, ProgressData, SetOverrideVars, ToggleItemVars } from './types'

const PROGRESS = ['item_progress'] as const
const OVERRIDES = ['node_overrides'] as const
const JOURNAL_DAYS = ['journal_days'] as const

async function fetchProgress(): Promise<ProgressData> {
  const { data, error } = await supabase.from('item_progress').select('item_id')
  if (error) throw error
  return { doneItems: new Set(data.map((r: { item_id: string }) => r.item_id)) }
}

type OverrideRow = { node_id: string; state: 'unlocked' | 'locked'; at: string; profiles: { name: string } | null }

async function fetchOverrides(): Promise<Map<string, NodeOverride>> {
  const { data, error } = await supabase.from('node_overrides').select('node_id, state, at, profiles(name)')
  if (error) throw error
  return new Map((data as OverrideRow[]).map((r) => [
    r.node_id,
    { nodeId: r.node_id, state: r.state, at: r.at, byName: r.profiles?.name ?? 'mentor' },
  ]))
}

export function useProgress() {
  return useQuery({ queryKey: PROGRESS, queryFn: fetchProgress })
}

export function useNodeStates(): NodeStatesResult {
  const progress = useProgress()
  const overrides = useQuery({ queryKey: OVERRIDES, queryFn: fetchOverrides })
  const data = useMemo(
    () => (progress.data && overrides.data ? buildTrailState(progress.data.doneItems, overrides.data) : undefined),
    [progress.data, overrides.data],
  )
  return { data, isLoading: progress.isLoading || overrides.isLoading, error: progress.error ?? overrides.error ?? null }
}

export function useToggleItem() {
  const qc = useQueryClient()
  return useMutation<void, Error, ToggleItemVars, { prev?: ProgressData }>({
    mutationFn: async ({ itemId, done }) => {
      if (done) {
        const { error } = await supabase.from('item_progress').upsert({ item_id: itemId }, { onConflict: 'item_id', ignoreDuplicates: true })
        if (error) throw error
        return
      }
      const { data, error } = await supabase.from('item_progress').delete().eq('item_id', itemId).select('item_id')
      if (error) throw error
      if (data.length > 0) return
      // RLS apaga 0 linhas sem erro quando a aluna tenta desmarcar o que o mentor marcou (RF-41).
      const { count, error: countError } = await supabase.from('item_progress').select('item_id', { count: 'exact', head: true }).eq('item_id', itemId)
      if (countError) throw countError
      if (count) throw new Error('Só quem marcou este item ou o mentor pode desmarcá-lo.')
    },
    onMutate: async ({ itemId, done }) => {
      await qc.cancelQueries({ queryKey: PROGRESS })
      const prev = qc.getQueryData<ProgressData>(PROGRESS)
      if (prev) {
        const doneItems = new Set(prev.doneItems)
        if (done) doneItems.add(itemId)
        else doneItems.delete(itemId)
        qc.setQueryData<ProgressData>(PROGRESS, { doneItems })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(PROGRESS, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: PROGRESS }),
  })
}

export function useSetOverride() {
  const qc = useQueryClient()
  return useMutation<void, Error, SetOverrideVars>({
    mutationFn: async ({ nodeId, state }) => {
      if (state === null) {
        const { error } = await supabase.from('node_overrides').delete().eq('node_id', nodeId)
        if (error) throw error
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada. Entre de novo.')
      const { error } = await supabase.from('node_overrides').upsert(
        { node_id: nodeId, state, by: session.user.id, at: new Date().toISOString() },
        { onConflict: 'node_id' },
      )
      if (error) throw error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: OVERRIDES }),
  })
}

/** Datas (SP) com caderno completo. Só a aluna escreve no caderno (RLS aluna_insert). */
export function useJournalDays() {
  return useQuery({
    queryKey: JOURNAL_DAYS,
    queryFn: async (): Promise<ReadonlySet<string>> => {
      const { data, error } = await supabase.from('journal_entries').select('date').eq('complete', true)
      if (error) throw error
      return new Set(data.map((r: { date: string }) => r.date))
    },
  })
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/progress 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS (hooks + contrato); `tsc` sem erros.

- [ ] **Step 5: Conferir contra o banco local**

Run: `npx supabase test db 2>&1 | tail -5`
Expected: PASS (nenhuma migração nova; confirma que RLS de `item_progress`/`node_overrides` segue verde).

- [ ] **Step 6: Commit**

```bash
git add src/features/progress/hooks.ts src/features/progress/hooks.test.tsx
git commit -m "feat(progress): supabase hooks for progress, node states and overrides"
```

---

### Task 15: TrailMap, baú de fase e override do mentor — **[W4]**

**Files:**
- Create: `src/features/trail/TrailMap.tsx`, `src/features/trail/GateChest.tsx`, `src/features/trail/OverridePanel.tsx`
- Modify: `src/design/ui/PixelIcon.tsx` (glifo `chest`)
- Test: `src/features/trail/TrailMap.test.tsx`

**Interfaces:**
- Consumes: `useNodeStates`, `useToggleItem`, `useSetOverride` (contrato da Task 13); `TrailState`, `NodeOverride`; `PHASES`, `nodeById`; `useAuth` (`profile.role`); `PathNode`, `Button`, `Badge`, `Checkbox`, `PixelIcon` de `@/design/ui`; `TZ` de `@/lib/dates`.
- Produces: `export function TrailMap(): JSX.Element` (rota `/trilha`). Rótulos acessíveis usados pelo E2E: botões `"Semana N, disponível|bloqueada|concluída"` (Fase 4: `"<tema>, …"`), `"Baú da Fase N, X de Y itens"`, `"Ajustar Semana N"` (só mentor).

- [ ] **Step 1: Testes**

`src/features/trail/TrailMap.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { NODES } from '@/content/trail'
import { mutationOf, nodeStatesOf } from '@/test/progressMocks'

vi.mock('@/features/progress/hooks', () => ({ useNodeStates: vi.fn(), useToggleItem: vi.fn(), useSetOverride: vi.fn() }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))

import { useNodeStates, useSetOverride, useToggleItem } from '@/features/progress/hooks'
import { useAuth } from '@/features/auth/AuthProvider'
import { TrailMap } from './TrailMap'

const toggle = vi.fn()
const setOverride = vi.fn()
const W01 = NODES.find((n) => n.id === 'w01')!.items.map((i) => i.id)

function asRole(role: 'aluna' | 'mentor') {
  vi.mocked(useAuth).mockReturnValue({
    session: null, loading: false, signOut: vi.fn(),
    profile: { id: role, role, name: role === 'mentor' ? 'Allan' : 'Ana' },
  })
}

function renderMap() {
  return render(
    <MemoryRouter initialEntries={['/trilha']}>
      <Routes>
        <Route path="/trilha" element={<TrailMap />} />
        <Route path="/trilha/:nodeId" element={<p>Semana aberta</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  toggle.mockReset()
  setOverride.mockReset()
  vi.mocked(useToggleItem).mockReturnValue(mutationOf(toggle))
  vi.mocked(useSetOverride).mockReturnValue(mutationOf(setOverride))
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf())
  asRole('aluna')
})

test('trilha nova: fases agrupadas, semana 1 disponível e semana 2 bloqueada', () => {
  renderMap()
  expect(screen.getByRole('heading', { name: 'Fase 1: Comunicação' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Fase 4: Avançado' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Semana 1, disponível' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Semana 2, bloqueada' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Negociação, bloqueada' })).toBeDisabled()
})

test('semana concluída libera a próxima, que abre a tela da semana', async () => {
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf(W01))
  renderMap()
  expect(screen.getByRole('button', { name: 'Semana 1, concluída' })).toBeEnabled()
  await userEvent.click(screen.getByRole('button', { name: 'Semana 2, disponível' }))
  expect(screen.getByText('Semana aberta')).toBeInTheDocument()
})

test('baú da fase marca item manual e trava o automático', async () => {
  renderMap()
  await userEvent.click(screen.getByRole('button', { name: 'Baú da Fase 1, 0 de 5 itens' }))
  expect(screen.getByRole('checkbox', { name: 'Assistiu aos 6 vídeos da fase (automático)' })).toBeDisabled()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Completou os 4 degraus da escada do medo' }))
  expect(toggle).toHaveBeenCalledWith({ itemId: 'f1.gate.2', done: true })
})

test('item automático gravado à mão não aparece marcado no baú', async () => {
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf(['f1.gate.1']))
  renderMap()
  await userEvent.click(screen.getByRole('button', { name: 'Baú da Fase 1, 0 de 5 itens' }))
  expect(screen.getByRole('checkbox', { name: 'Assistiu aos 6 vídeos da fase (automático)' })).not.toBeChecked()
})

test('mentor vê quem liberou e pode bloquear', async () => {
  asRole('mentor')
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf([], [{ nodeId: 'w03', state: 'unlocked', byName: 'Allan', at: '2026-09-29T15:00:00Z' }]))
  renderMap()
  expect(screen.getByRole('button', { name: 'Semana 3, disponível' })).toBeEnabled()
  await userEvent.click(screen.getByRole('button', { name: 'Ajustar Semana 3' }))
  expect(screen.getByText('Liberada por Allan em 29/09, 12:00')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Bloquear' }))
  expect(setOverride).toHaveBeenCalledWith({ nodeId: 'w03', state: 'locked' })
  await userEvent.click(screen.getByRole('button', { name: 'Voltar ao automático' }))
  expect(setOverride).toHaveBeenCalledWith({ nodeId: 'w03', state: null })
})

test('aluna não vê os controles do mentor', () => {
  renderMap()
  expect(screen.queryByRole('button', { name: /^Ajustar/ })).not.toBeInTheDocument()
})

test('Fase 4 explica a escolha de 1 tema por mês', () => {
  renderMap()
  expect(screen.getByText(/Escolha 1 por mês/)).toBeInTheDocument()
})

test('mostra carregamento e erro legível', () => {
  vi.mocked(useNodeStates).mockReturnValue({ data: undefined, isLoading: true, error: null })
  const { unmount } = renderMap()
  expect(screen.getByRole('status')).toHaveTextContent('Carregando a trilha')
  unmount()
  vi.mocked(useNodeStates).mockReturnValue({ data: undefined, isLoading: false, error: new Error('rede') })
  renderMap()
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar a trilha')
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/trail/TrailMap.test.tsx 2>&1 | tail -15`
Expected: FAIL — `Failed to resolve import "./TrailMap"`.

- [ ] **Step 3: Glifo do baú**

Em `src/design/ui/PixelIcon.tsx`, acrescentar ao objeto `glyphs` (depois de `notes`):
```ts
  chest: ['.#####.', '#.....#', '#######', '#..#..#', '#.###.#', '#.....#', '#######'],
```

- [ ] **Step 4: Painel de override (RF-15)**

`src/features/trail/OverridePanel.tsx`:
```tsx
import { Button } from '@/design/ui'
import type { NodeOverride } from '@/domain/trailState'
import { useSetOverride } from '@/features/progress/hooks'
import { TZ } from '@/lib/dates'

const when = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export function OverridePanel({ nodeId, label, current }: { nodeId: string; label: string; current?: NodeOverride }) {
  const setOverride = useSetOverride()
  const busy = setOverride.isPending
  const choose = (state: 'unlocked' | 'locked' | null) => setOverride.mutate({ nodeId, state })
  return (
    <div role="group" aria-label={`Liberação de ${label}`} className="flex w-full flex-col gap-2 rounded-card border border-edge bg-surface p-3">
      <p className="text-sm text-muted">
        {current
          ? `${current.state === 'unlocked' ? 'Liberada' : 'Bloqueada'} por ${current.byName} em ${when.format(new Date(current.at))}`
          : 'Seguindo a regra automática.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={busy || current?.state === 'unlocked'} onClick={() => choose('unlocked')}>Liberar</Button>
        <Button size="sm" variant="secondary" disabled={busy || current?.state === 'locked'} onClick={() => choose('locked')}>Bloquear</Button>
        <Button size="sm" variant="ghost" disabled={busy || !current} onClick={() => choose(null)}>Voltar ao automático</Button>
      </div>
      {setOverride.error && <p role="alert" className="text-sm text-danger">Não foi possível salvar: {setOverride.error.message}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Baú da fase (RF-13, RF-40)**

`src/features/trail/GateChest.tsx`:
```tsx
import { useState } from 'react'
import type { Phase } from '@/content/types'
import { Badge, Checkbox, PixelIcon } from '@/design/ui'
import type { TrailState } from '@/domain/trailState'
import { useToggleItem } from '@/features/progress/hooks'

export function GateChest({ phase, phaseNumber, trail }: { phase: Phase; phaseNumber: number; trail: TrailState }) {
  const toggle = useToggleItem()
  const [open, setOpen] = useState(false)
  const total = phase.gate.length
  const done = phase.gate.filter((g) => trail.gateDone.has(g.id)).length
  const full = done === total
  const panelId = `bau-${phase.id}`
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button type="button" aria-expanded={open} aria-controls={panelId}
        aria-label={`Baú da Fase ${phaseNumber}, ${done} de ${total} itens`}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-3 rounded-card border-2 bg-surface px-4 py-3 font-bold
          focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink
          ${full ? 'border-brand text-brand glow' : 'border-line text-muted'}`}>
        <PixelIcon name="chest" className="size-8" />
        <span className="text-ink">Baú da Fase {phaseNumber}</span>
        <Badge tone={full ? 'brand' : 'muted'}>{done}/{total}</Badge>
      </button>
      {open && (
        <ul id={panelId} className="w-full rounded-card border border-edge bg-surface p-2">
          {phase.gate.map((g) => {
            const auto = trail.autoGate.has(g.id)
            return (
              <li key={g.id}>
                <Checkbox checked={trail.gateDone.has(g.id)} disabled={auto}
                  label={auto ? `${g.text} (automático)` : g.text}
                  onChange={(checked) => toggle.mutate({ itemId: g.id, done: checked })} />
              </li>
            )
          })}
        </ul>
      )}
      {toggle.error && <p role="alert" className="text-sm text-danger">{toggle.error.message}</p>}
    </div>
  )
}
```

- [ ] **Step 6: Mapa (RF-10, RF-11, RF-14)**

`src/features/trail/TrailMap.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { PHASES, nodeById } from '@/content/trail'
import type { TrailNode } from '@/content/types'
import { Button, PathNode } from '@/design/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNodeStates } from '@/features/progress/hooks'
import { GateChest } from './GateChest'
import { OverridePanel } from './OverridePanel'

// Zigue-zague do caminho, em múltiplos de 40px.
const OFFSETS = [0, 1, 2, 1, 0, -1, -2, -1]

function nodeLabel(node: TrailNode): string {
  return node.week !== undefined ? `Semana ${node.week}` : node.title
}

export function TrailMap() {
  const { data, isLoading, error } = useNodeStates()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const currentRef = useRef<HTMLDivElement>(null)
  const currentId = data?.next?.node.id

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    currentRef.current?.scrollIntoView?.({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
  }, [currentId])

  if (isLoading) return <p role="status" className="p-6 text-muted">Carregando a trilha…</p>
  if (error || !data) {
    return <p role="alert" className="p-6 text-danger">Não foi possível carregar a trilha. Verifique a conexão e recarregue a página.</p>
  }

  const isMentor = profile?.role === 'mentor'
  return (
    <main className="mx-auto flex max-w-md flex-col gap-12 px-4 pt-6 pb-8">
      <h1 className="font-display text-5xl leading-none font-black text-brand text-glow">Trilha</h1>
      {PHASES.map((phase, pi) => (
        <section key={phase.id} aria-labelledby={`fase-${phase.id}`} className="flex flex-col items-center gap-6">
          <header className="self-stretch">
            <h2 id={`fase-${phase.id}`} className="text-xl font-bold">Fase {pi + 1}: {phase.title}</h2>
            {phase.id === 'f4' && (
              <p className="text-sm text-muted">Depois do baú da Fase 3, todos os temas abrem juntos. Escolha 1 por mês.</p>
            )}
          </header>
          <ol className="flex w-full flex-col items-center gap-6">
            {phase.nodeIds.map((id, i) => {
              const node = nodeById(id)
              const label = nodeLabel(node)
              return (
                <li key={id} className="flex w-full flex-col items-center gap-2">
                  <div ref={id === currentId ? currentRef : undefined}
                    style={{ translate: `${OFFSETS[i % OFFSETS.length] * 40}px 0` }}
                    className="flex flex-col items-center gap-1.5">
                    <PathNode state={data.states.get(id) ?? 'locked'} phase={node.phase} label={label}
                      onClick={() => navigate(`/trilha/${id}`)} />
                    <span className="text-sm font-bold">{label}</span>
                    {node.week !== undefined && <span className="max-w-40 text-center text-xs text-muted">{node.title}</span>}
                    {isMentor && (
                      <Button variant="ghost" size="sm" aria-label={`Ajustar ${label}`} aria-expanded={adjusting === id}
                        onClick={() => setAdjusting(adjusting === id ? null : id)}>Ajustar</Button>
                    )}
                  </div>
                  {isMentor && adjusting === id && <OverridePanel nodeId={id} label={label} current={data.overrides.get(id)} />}
                </li>
              )
            })}
          </ol>
          <GateChest phase={phase} phaseNumber={pi + 1} trail={data} />
        </section>
      ))}
    </main>
  )
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/features/trail/TrailMap.test.tsx src/design 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/features/trail/TrailMap.tsx src/features/trail/TrailMap.test.tsx src/features/trail/GateChest.tsx src/features/trail/OverridePanel.tsx src/design/ui/PixelIcon.tsx
git commit -m "feat(trail): trail map with phase chests and mentor override"
```

---

### Task 16: WeekScreen — **[W1]**

**Files:**
- Create: `src/features/trail/WeekScreen.tsx`, `src/features/trail/youtube.ts`
- Test: `src/features/trail/WeekScreen.test.tsx`, `src/features/trail/youtube.test.ts`

**Interfaces:**
- Consumes: `useProgress`, `useNodeStates`, `useToggleItem` (contrato da Task 13); `NODES`, `PHASES`; `isNodeComplete` (`@/domain/unlock`); `useAuth`; `Badge`, `Card`, `Checkbox`, `ProgressBar` de `@/design/ui`. Mocks: `progressOf`, `nodeStatesOf`, `mutationOf` de `@/test/progressMocks`.
- Produces: `export function WeekScreen(): JSX.Element` (rota `/trilha/:nodeId`); `youtubeEmbedUrl(url: string): string | null`. Textos usados pelo E2E: checkboxes com o título do item (vídeos: `"Assisti: <título>"`), status `"Semana concluída…"` e link `"Ver a trilha"`.

- [ ] **Step 1: Testes do link do YouTube**

`src/features/trail/youtube.test.ts`:
```ts
import { youtubeEmbedUrl } from './youtube'

test('converte links do YouTube para o player sem cookies', () => {
  expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=ywJw8hjzTig')).toBe('https://www.youtube-nocookie.com/embed/ywJw8hjzTig')
  expect(youtubeEmbedUrl('https://youtu.be/ywJw8hjzTig')).toBe('https://www.youtube-nocookie.com/embed/ywJw8hjzTig')
})

test('recusa links inválidos ou de outros sites', () => {
  expect(youtubeEmbedUrl('não é url')).toBeNull()
  expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=curto')).toBeNull()
  expect(youtubeEmbedUrl('https://evil.example/watch?v=ywJw8hjzTig')).toBeNull()
  expect(youtubeEmbedUrl('javascript:alert(1)')).toBeNull()
})
```

- [ ] **Step 2: Testes da tela**

`src/features/trail/WeekScreen.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { NODES } from '@/content/trail'
import { mutationOf, nodeStatesOf, progressOf } from '@/test/progressMocks'

vi.mock('@/features/progress/hooks', () => ({ useProgress: vi.fn(), useNodeStates: vi.fn(), useToggleItem: vi.fn() }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))

import { useNodeStates, useProgress, useToggleItem } from '@/features/progress/hooks'
import { useAuth } from '@/features/auth/AuthProvider'
import { WeekScreen } from './WeekScreen'

const toggle = vi.fn()
const W01 = NODES.find((n) => n.id === 'w01')!.items.map((i) => i.id)

function asRole(role: 'aluna' | 'mentor') {
  vi.mocked(useAuth).mockReturnValue({ session: null, loading: false, signOut: vi.fn(), profile: { id: role, role, name: role } })
}
function withDone(done: string[]) {
  vi.mocked(useProgress).mockReturnValue(progressOf(done))
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf(done))
}
function renderWeek(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/trilha/${id}`]}>
      <Routes><Route path="/trilha/:nodeId" element={<WeekScreen />} /></Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  toggle.mockReset()
  vi.mocked(useToggleItem).mockReturnValue(mutationOf(toggle))
  withDone([])
  asRole('aluna')
})

test('mostra tema, vídeos embutidos sem cookies e o degrau do medo (RF-20, RF-21)', () => {
  renderWeek('w01')
  expect(screen.getByRole('heading', { level: 1, name: 'Semana 1' })).toBeInTheDocument()
  expect(screen.getByText('Perder o medo de falar')).toBeInTheDocument()
  const player = screen.getByTitle('Vença o medo de falar em público — Reinaldo Polito')
  expect(player).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/ywJw8hjzTig')
  expect(screen.getByRole('heading', { name: 'Degrau da escada do medo' })).toBeInTheDocument()
})

test('marcar vídeo como assistido grava o item', async () => {
  renderWeek('w01')
  await userEvent.click(screen.getByRole('checkbox', { name: 'Assisti: Vença o medo de falar em público — Reinaldo Polito' }))
  expect(toggle).toHaveBeenCalledWith({ itemId: 'w01.video.1', done: true })
})

test('leitura aponta para o livro na Biblioteca e há atalho de nota (RF-22, RF-23)', () => {
  renderWeek('w01')
  expect(screen.getByRole('link', { name: 'Abrir na Biblioteca' })).toHaveAttribute('href', '/biblioteca/carnegie')
  expect(screen.getByRole('link', { name: 'Criar nota sobre esta semana' })).toHaveAttribute('href', '/caderno/notas/nova?semana=w01')
})

test('mostra o progresso dos obrigatórios e a conclusão da semana', () => {
  withDone(W01)
  renderWeek('w01')
  expect(screen.getByRole('progressbar', { name: 'Itens obrigatórios da semana' })).toHaveAttribute('aria-valuenow', '100')
  expect(screen.getByRole('status')).toHaveTextContent('Semana concluída. A semana seguinte já está liberada.')
  expect(screen.getByRole('link', { name: 'Ver a trilha' })).toHaveAttribute('href', '/trilha')
})

test('última semana da fase lembra do baú', () => {
  const f1 = NODES.filter((n) => n.phase === 'f1').flatMap((n) => n.items.map((i) => i.id))
  withDone(f1)
  renderWeek('w04')
  expect(screen.getByRole('status')).toHaveTextContent('Complete o baú da fase')
})

test('semana bloqueada aberta por URL não mostra itens para a aluna', () => {
  renderWeek('w09')
  expect(screen.getByRole('status')).toHaveTextContent('Esta etapa ainda está bloqueada')
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
})

test('mentor vê semana bloqueada com aviso', () => {
  asRole('mentor')
  renderWeek('w09')
  expect(screen.getByText('Bloqueada para a aluna')).toBeInTheDocument()
  expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0)
})

test('id desconhecido mostra mensagem e caminho de volta', () => {
  renderWeek('w99')
  expect(screen.getByRole('alert')).toHaveTextContent('Semana não encontrada.')
  expect(screen.getByRole('link', { name: 'Voltar para a trilha' })).toBeInTheDocument()
})

test('erro ao desmarcar aparece para a aluna', () => {
  vi.mocked(useToggleItem).mockReturnValue(mutationOf(toggle, new Error('Só quem marcou este item ou o mentor pode desmarcá-lo.')))
  renderWeek('w01')
  expect(screen.getByRole('alert')).toHaveTextContent('Só quem marcou este item ou o mentor pode desmarcá-lo.')
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/features/trail/WeekScreen.test.tsx src/features/trail/youtube.test.ts 2>&1 | tail -15`
Expected: FAIL — `Failed to resolve import "./WeekScreen"` / `"./youtube"`.

- [ ] **Step 4: Implementar `youtube.ts`**

`src/features/trail/youtube.ts`:
```ts
const HOSTS = new Set(['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'])

/** RF-21: player sem cookies. Retorna null para qualquer link que não seja um vídeo do YouTube. */
export function youtubeEmbedUrl(url: string): string | null {
  let u: URL
  try { u = new URL(url) } catch { return null }
  if (u.protocol !== 'https:' || !HOSTS.has(u.hostname)) return null
  const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v')
  return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
}
```

- [ ] **Step 5: Implementar a tela**

`src/features/trail/WeekScreen.tsx`:
```tsx
import { Link, useParams } from 'react-router'
import { NODES, PHASES } from '@/content/trail'
import type { ItemKind, TrailItem } from '@/content/types'
import { Badge, Card, Checkbox, ProgressBar } from '@/design/ui'
import { isNodeComplete } from '@/domain/unlock'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNodeStates, useProgress, useToggleItem } from '@/features/progress/hooks'
import { youtubeEmbedUrl } from './youtube'

const SECTIONS: { kind: ItemKind; title: string }[] = [
  { kind: 'video', title: 'Vídeos' },
  { kind: 'reading', title: 'Leitura' },
  { kind: 'fear', title: 'Degrau da escada do medo' },
  { kind: 'practice', title: 'Prática' },
  { kind: 'delivery', title: 'Entrega' },
]

const linkClass = 'font-bold text-brand underline underline-offset-4'

function ItemRow({ item, checked, onChange }: { item: TrailItem; checked: boolean; onChange: (v: boolean) => void }) {
  const embed = item.kind === 'video' && item.url ? youtubeEmbedUrl(item.url) : null
  return (
    <li className="flex flex-col gap-2">
      {embed && (
        <iframe src={embed} title={item.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; picture-in-picture; fullscreen"
          className="aspect-video w-full rounded-card border border-edge bg-bg" />
      )}
      <Checkbox checked={checked} onChange={onChange} label={item.kind === 'video' ? `Assisti: ${item.title}` : item.title} />
      <div className="flex flex-wrap items-center gap-3 pl-12 text-sm text-muted">
        {item.minutes !== undefined && <span>{item.minutes} min</span>}
        {!item.required && <Badge tone="muted">Opcional</Badge>}
        {item.kind === 'reading' && item.bookId && <Link to={`/biblioteca/${item.bookId}`} className={linkClass}>Abrir na Biblioteca</Link>}
      </div>
    </li>
  )
}

export function WeekScreen() {
  const { nodeId } = useParams()
  const node = NODES.find((n) => n.id === nodeId)
  const { profile } = useAuth()
  const progress = useProgress()
  const trail = useNodeStates()
  const toggle = useToggleItem()

  if (!node) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-3 p-6">
        <p role="alert">Semana não encontrada.</p>
        <Link to="/trilha" className={linkClass}>Voltar para a trilha</Link>
      </main>
    )
  }
  if (progress.isLoading || trail.isLoading) return <p role="status" className="p-6 text-muted">Carregando a semana…</p>
  if (!progress.data || !trail.data) {
    return <p role="alert" className="p-6 text-danger">Não foi possível carregar a semana. Verifique a conexão e recarregue a página.</p>
  }

  const state = trail.data.states.get(node.id) ?? 'locked'
  if (state === 'locked' && profile?.role !== 'mentor') {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-3 p-6">
        <p role="status">Esta etapa ainda está bloqueada. Conclua a anterior para liberar.</p>
        <Link to="/trilha" className={linkClass}>Voltar para a trilha</Link>
      </main>
    )
  }

  const done = progress.data.doneItems
  const required = node.items.filter((i) => i.required)
  const doneCount = required.filter((i) => done.has(i.id)).length
  const phaseIndex = PHASES.findIndex((p) => p.id === node.phase)
  const phase = PHASES[phaseIndex]
  const doneMsg = node.phase === 'f4'
    ? 'Tema concluído.'
    : phase.nodeIds.at(-1) === node.id
      ? 'Semana concluída. Complete o baú da fase no mapa para abrir a próxima fase.'
      : 'Semana concluída. A semana seguinte já está liberada.'

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-6 pb-8">
      <Link to="/trilha" className="text-sm font-bold text-muted underline underline-offset-4">Voltar para a trilha</Link>
      <header className="flex flex-col gap-1">
        <p className="font-bold text-muted">Fase {phaseIndex + 1}: {phase.title}</p>
        <h1 className="font-display text-5xl leading-none font-black text-brand text-glow">
          {node.week !== undefined ? `Semana ${node.week}` : node.title}
        </h1>
        {node.week !== undefined && <p className="text-xl font-bold">{node.title}</p>}
        {state === 'locked' && <span className="self-start"><Badge tone="muted">Bloqueada para a aluna</Badge></span>}
      </header>
      <div className="flex flex-col gap-1">
        <ProgressBar value={required.length ? doneCount / required.length : 1} label="Itens obrigatórios da semana" tone={node.phase} />
        <p className="text-sm text-muted">{doneCount} de {required.length} obrigatórios</p>
      </div>
      {isNodeComplete(node, done) && (
        <Card className="flex flex-col gap-2 border-brand">
          <p role="status" className="font-bold">{doneMsg}</p>
          <Link to="/trilha" className={linkClass}>Ver a trilha</Link>
        </Card>
      )}
      {SECTIONS.map(({ kind, title }) => {
        const items = node.items.filter((i) => i.kind === kind)
        if (items.length === 0) return null
        return (
          <section key={kind} aria-labelledby={`sec-${kind}`} className="flex flex-col gap-3">
            <h2 id={`sec-${kind}`} className="text-lg font-bold">{title}</h2>
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} checked={done.has(item.id)}
                  onChange={(checked) => toggle.mutate({ itemId: item.id, done: checked })} />
              ))}
            </ul>
          </section>
        )
      })}
      {toggle.error && <p role="alert" className="text-danger">{toggle.error.message}</p>}
      <Link to={`/caderno/notas/nova?semana=${node.id}`} className={linkClass}>Criar nota sobre esta semana</Link>
    </main>
  )
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/features/trail/WeekScreen.test.tsx src/features/trail/youtube.test.ts 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/features/trail/WeekScreen.tsx src/features/trail/WeekScreen.test.tsx src/features/trail/youtube.ts src/features/trail/youtube.test.ts
git commit -m "feat(trail): week screen with embedded videos and item checklist"
```

---

### Task 17: TodayScreen — **[W1]**

**Files:**
- Create: `src/features/today/TodayScreen.tsx`
- Test: `src/features/today/TodayScreen.test.tsx`

**Interfaces:**
- Consumes: `useNodeStates`, `useProgress`, `useJournalDays`, `useToggleItem` (contrato da Task 13); `dailyRoutine`, `routineItemId`, `RoutineItem` (Task 13); `currentStreak` (`@/domain/streak`); `spDate`, `TZ` (`@/lib/dates`); `Badge`, `Card`, `Checkbox`, `ProgressBar`. Mocks de `@/test/progressMocks`.
- Produces: `export function TodayScreen(): JSX.Element` (rota `/`). O `h1` é `"Hoje"` (o E2E espera por ele depois do login).

- [ ] **Step 1: Testes**

`src/features/today/TodayScreen.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { NODES } from '@/content/trail'
import { mutationOf, nodeStatesOf, progressOf, queryOf } from '@/test/progressMocks'

vi.mock('@/features/progress/hooks', () => ({
  useNodeStates: vi.fn(), useProgress: vi.fn(), useJournalDays: vi.fn(), useToggleItem: vi.fn(),
}))

import { useJournalDays, useNodeStates, useProgress, useToggleItem } from '@/features/progress/hooks'
import { TodayScreen } from './TodayScreen'

const toggle = vi.fn()

function setup({ done = [] as string[], journal = [] as string[] } = {}) {
  vi.mocked(useNodeStates).mockReturnValue(nodeStatesOf(done))
  vi.mocked(useProgress).mockReturnValue(progressOf(done))
  vi.mocked(useJournalDays).mockReturnValue(queryOf<ReadonlySet<string>>(new Set(journal)))
  vi.mocked(useToggleItem).mockReturnValue(mutationOf(toggle))
  return render(<MemoryRouter><TodayScreen /></MemoryRouter>)
}
const routine = () => within(screen.getByRole('list')).getAllByRole('listitem')

beforeEach(() => {
  toggle.mockReset()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-29T15:00:00Z')) // terça, 12:00 em SP
})
afterEach(() => vi.useRealTimers())

test('rotina de terça com caderno fixado no topo (RF-30)', () => {
  setup()
  expect(screen.getByRole('heading', { level: 1, name: 'Hoje' })).toBeInTheDocument()
  expect(routine()).toHaveLength(7)
  expect(routine()[0]).toHaveTextContent('Caderno: 3 linhas (3 min)')
  expect(routine()[0]).toHaveTextContent('Obrigatório')
  expect(screen.getByRole('checkbox', { name: 'Leitura em voz alta (5 min)' })).toBeInTheDocument()
  expect(screen.queryByRole('checkbox', { name: /Simulado chefe/ })).not.toBeInTheDocument()
})

test('caderno preenchido vai para o fim e o streak aparece (RF-32)', () => {
  setup({ journal: ['2026-09-27', '2026-09-28', '2026-09-29'] })
  expect(routine().at(-1)).toHaveTextContent('Feito')
  expect(screen.getByText('3 dias seguidos')).toBeInTheDocument()
})

test('sem caderno recente o streak convida a começar', () => {
  setup()
  expect(screen.getByText('Sequência começa hoje')).toBeInTheDocument()
})

test('marcar item da rotina grava com o id do dia', async () => {
  setup()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Aquecimento de voz + pitch de 30 s (5 min)' }))
  expect(toggle).toHaveBeenCalledWith({ itemId: 'day.2026-09-29.voz', done: true })
})

test('23:30 em SP ainda é o mesmo dia, mesmo com o relógio em UTC', async () => {
  vi.setSystemTime(new Date('2026-09-30T02:30:00Z'))
  setup()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Aquecimento de voz + pitch de 30 s (5 min)' }))
  expect(toggle).toHaveBeenCalledWith({ itemId: 'day.2026-09-29.voz', done: true })
})

test('item já marcado hoje aparece marcado', () => {
  setup({ done: ['day.2026-09-29.leitura', 'day.2026-09-28.voz'] })
  expect(screen.getByRole('checkbox', { name: 'Leitura ou audiolivro (20 min)' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Aquecimento de voz + pitch de 30 s (5 min)' })).not.toBeChecked()
})

test('sábado tem simulado chefe e domingo tem revisão (RF-31)', () => {
  vi.setSystemTime(new Date('2026-10-03T15:00:00Z'))
  const { unmount } = setup()
  expect(screen.getByRole('checkbox', { name: 'Simulado chefe (10 min)' })).toBeInTheDocument()
  unmount()
  vi.setSystemTime(new Date('2026-10-04T15:00:00Z'))
  setup()
  expect(screen.getByRole('checkbox', { name: 'Revisão da semana (30 min)' })).toBeInTheDocument()
})

test('mostra o próximo item pendente da trilha (RF-32)', () => {
  setup()
  expect(screen.getByText(NODES[0].items[0].title)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Abrir Semana 1' })).toHaveAttribute('href', '/trilha/w01')
})

test('na Fase 2 o desafio vira abordagem real com a regra 70/30', () => {
  const f1 = NODES.filter((n) => n.phase === 'f1').flatMap((n) => n.items.map((i) => i.id))
  setup({ done: [...f1, 'f1.gate.2', 'f1.gate.3', 'f1.gate.4', 'f1.gate.5'] })
  expect(screen.getByRole('checkbox', { name: '1 abordagem real (10 min)' })).toBeInTheDocument()
  expect(screen.getAllByText(/Regra 70\/30/)).toHaveLength(2)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/today 2>&1 | tail -15`
Expected: FAIL — `Failed to resolve import "./TodayScreen"`.

- [ ] **Step 3: Implementar**

`src/features/today/TodayScreen.tsx`:
```tsx
import { Link } from 'react-router'
import { Badge, Card, Checkbox, ProgressBar } from '@/design/ui'
import { dailyRoutine, routineItemId, type RoutineItem } from '@/domain/routine'
import { currentStreak } from '@/domain/streak'
import { useJournalDays, useNodeStates, useProgress, useToggleItem } from '@/features/progress/hooks'
import { spDate, TZ } from '@/lib/dates'

const longDate = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' })
const withMinutes = (i: RoutineItem) => (i.minutes ? `${i.label} (${i.minutes} min)` : i.label)

export function TodayScreen() {
  const now = new Date()
  const today = spDate(now)
  const trail = useNodeStates()
  const progress = useProgress()
  const journal = useJournalDays()
  const toggle = useToggleItem()

  if (trail.isLoading || progress.isLoading || journal.isLoading) {
    return <p role="status" className="p-6 text-muted">Carregando o seu dia…</p>
  }
  if (!trail.data || !progress.data || !journal.data) {
    return <p role="alert" className="p-6 text-danger">Não foi possível carregar o seu dia. Verifique a conexão e recarregue a página.</p>
  }

  const doneItems = progress.data.doneItems
  const journalDays = journal.data
  const journalDone = journalDays.has(today)
  const items = dailyRoutine(today, trail.data.currentPhase, journalDone)
  const isDone = (i: RoutineItem) => (i.key === 'caderno' ? journalDone : doneItems.has(routineItemId(today, i.key)))
  const doneCount = items.filter(isDone).length
  const streak = currentStreak(journalDays, today)
  const next = trail.data.next

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-6 pb-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="font-bold text-muted first-letter:uppercase">{longDate.format(now)}</p>
          <h1 className="font-display text-6xl leading-none font-black text-brand text-glow">Hoje</h1>
        </div>
        <Badge tone={streak > 0 ? 'streak' : 'muted'}>
          {streak === 0 ? 'Sequência começa hoje' : `${streak} ${streak === 1 ? 'dia seguido' : 'dias seguidos'}`}
        </Badge>
      </header>

      <Card>
        {next ? (
          <>
            <p className="text-sm font-bold text-muted">Próximo da trilha</p>
            <p className="mt-1 text-lg font-bold">{next.item.title}</p>
            <Link to={`/trilha/${next.node.id}`} className="mt-2 inline-block font-bold text-brand underline underline-offset-4">
              Abrir {next.node.week !== undefined ? `Semana ${next.node.week}` : next.node.title}
            </Link>
          </>
        ) : (
          <p className="font-bold">Você está em dia com a trilha.</p>
        )}
      </Card>

      <section aria-labelledby="rotina" className="flex flex-col gap-3">
        <h2 id="rotina" className="text-lg font-bold">Rotina de hoje</h2>
        <ProgressBar value={doneCount / items.length} label="Rotina de hoje" />
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.key} className="flex flex-col">
              {item.key === 'caderno' ? (
                <Link to="/caderno"
                  className={`flex min-h-12 items-center justify-between gap-3 rounded-control border-2 px-3 font-bold
                    focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink
                    ${journalDone ? 'border-edge text-muted' : 'border-streak bg-surface'}`}>
                  <span>{withMinutes(item)}</span>
                  <Badge tone={journalDone ? 'success' : 'streak'}>{journalDone ? 'Feito' : 'Obrigatório'}</Badge>
                </Link>
              ) : (
                <Checkbox checked={isDone(item)} label={withMinutes(item)}
                  onChange={(checked) => toggle.mutate({ itemId: routineItemId(today, item.key), done: checked })} />
              )}
              {item.hint && <p className="pl-12 text-sm text-muted">{item.hint}</p>}
            </li>
          ))}
        </ul>
        {toggle.error && <p role="alert" className="text-danger">{toggle.error.message}</p>}
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/today 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/today
git commit -m "feat(today): daily routine, streak and next trail item"
```

---

### Task 18: AppShell e rotas autenticadas — **[W4]**

**Files:**
- Create: `src/features/shell/AppShell.tsx`
- Modify: `src/App.tsx` (troca o `HomePlaceholder` pelas rotas da E4), `src/App.test.tsx` (novo caso)
- Test: `src/features/shell/AppShell.test.tsx`

**Interfaces:**
- Consumes: `TrailMap` (Task 15), `WeekScreen` (Task 16), `TodayScreen` (Task 17), `RequireAuth` (Task 12), `BottomNav`, `PixelIcon`.
- Produces: rotas `/` (Hoje), `/trilha`, `/trilha/:nodeId` dentro do `AppShell` com a `BottomNav` (abas "Hoje" e "Trilha"; E5 e E6 acrescentam "Simulados" e "Caderno" no array `NAV`).

- [ ] **Step 1: Testes**

`src/features/shell/AppShell.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AppShell } from './AppShell'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<h1>Tela hoje</h1>} />
          <Route path="trilha" element={<h1>Tela trilha</h1>} />
          <Route path="trilha/:nodeId" element={<h1>Tela semana</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

test('mostra a tela atual e a navegação com a aba ativa', () => {
  renderAt('/')
  expect(screen.getByRole('heading', { name: 'Tela hoje' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page')
})

test('aba Trilha continua ativa dentro de uma semana', () => {
  renderAt('/trilha/w05')
  expect(screen.getByRole('heading', { name: 'Tela semana' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Trilha' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Hoje' })).not.toHaveAttribute('aria-current')
})
```

Em `src/App.test.tsx`, acrescentar no fim (o mock de `@/lib/supabase` do arquivo já devolve sessão vazia):
```tsx
test('rotas da trilha exigem login', async () => {
  render(<MemoryRouter initialEntries={['/trilha/w01']}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>)
  expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/shell src/App.test.tsx 2>&1 | tail -15`
Expected: FAIL — `Failed to resolve import "./AppShell"` (o teste novo do App pode passar já, pelo catch-all; ele protege a mudança do Step 4).

- [ ] **Step 3: Implementar o shell**

`src/features/shell/AppShell.tsx`:
```tsx
import { Outlet } from 'react-router'
import { BottomNav, PixelIcon } from '@/design/ui'

// E5 acrescenta "Simulados" e E6 acrescenta "Caderno".
const NAV = [
  { to: '/', label: 'Hoje', icon: <PixelIcon name="today" /> },
  { to: '/trilha', label: 'Trilha', icon: <PixelIcon name="trail" /> },
]

export function AppShell() {
  return (
    <div className="min-h-dvh pb-28">
      <Outlet />
      <BottomNav items={NAV} />
    </div>
  )
}
```

- [ ] **Step 4: Ligar as rotas**

`src/App.tsx` (substitui o arquivo inteiro):
```tsx
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { LoginScreen } from './features/auth/LoginScreen'
import { RequireAuth } from './features/auth/RequireAuth'
import { AppShell } from './features/shell/AppShell'
import { TodayScreen } from './features/today/TodayScreen'
import { TrailMap } from './features/trail/TrailMap'
import { WeekScreen } from './features/trail/WeekScreen'

const UiPreview = lazy(() => import('./design/UiPreview'))

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      {import.meta.env.DEV && <Route path="/ui" element={<Suspense><UiPreview /></Suspense>} />}
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<TodayScreen />} />
        <Route path="trilha" element={<TrailMap />} />
        <Route path="trilha/:nodeId" element={<WeekScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

- [ ] **Step 5: Rodar tudo**

Run: `npm test 2>&1 | tail -8 && npm run build 2>&1 | tail -5`
Expected: todos os testes PASS; build ok.

- [ ] **Step 6: Commit**

```bash
git add src/features/shell src/App.tsx src/App.test.tsx
git commit -m "feat(app): authenticated shell with bottom nav and trail routes"
```

---

### Task 19: E2E — concluir semana → próxima liberada — **[W4]**

**Files:**
- Create: `playwright.config.ts`, `e2e/support.ts`, `e2e/trail.spec.ts`
- Modify: `package.json` (dev dependency + script `e2e`), `.gitignore`, `supabase/config.toml` (`site_url` e redirects do dev server)

**Interfaces:**
- Consumes: app rodando em `http://localhost:5173` (dev server já existente ou subido pelo Playwright); Supabase local (API `http://127.0.0.1:55321`); rótulos das Tasks 15–17 (`"Semana N, <estado>"`, checkboxes da semana, `"Semana concluída"`, link `"Ver a trilha"`, `h1 "Hoje"`, aba `"Trilha"`).
- Produces: `npm run e2e`.

> **Atenção:** o E2E **apaga todo o progresso e os overrides do banco LOCAL** antes de rodar. `e2e/support.ts` se recusa a rodar contra qualquer URL que não seja `localhost`/`127.0.0.1`.

- [ ] **Step 1: Instalar o Playwright**

Run: `npm i -D @playwright/test@^1.63.0 && npx playwright install chromium 2>&1 | tail -2`
Expected: pacote em `devDependencies`; Chromium baixado.

Em `package.json` → `scripts`, acrescentar: `"e2e": "playwright test"`. Em `.gitignore`, acrescentar:
```
test-results/
playwright-report/
```

- [ ] **Step 2: Configuração e apoio**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
})
```

`e2e/support.ts`:
```ts
import { createClient } from '@supabase/supabase-js'
import type { Page } from '@playwright/test'

const url = process.env.API_URL ?? 'http://127.0.0.1:55321'
const serviceKey = process.env.SERVICE_ROLE_KEY
if (!serviceKey) throw new Error('Defina SERVICE_ROLE_KEY: set -a; eval "$(npx supabase status -o env)"; set +a')
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) throw new Error(`E2E só roda contra o Supabase local, não contra ${url}`)

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

/** E-mail da conta aluna local; cria uma conta de teste se ainda não existir. */
export async function studentEmail(): Promise<string> {
  const { data: existing, error } = await admin.from('profiles').select('id').eq('role', 'aluna').maybeSingle()
  if (error) throw error
  if (existing) {
    const { data, error: userError } = await admin.auth.admin.getUserById(existing.id)
    if (userError || !data.user.email) throw userError ?? new Error('Conta aluna sem e-mail')
    return data.user.email
  }
  const email = 'aluna.e2e@trilha.test'
  const { data, error: createError } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (createError) throw createError
  const { error: profileError } = await admin.from('profiles').insert({ id: data.user.id, role: 'aluna', name: 'Aluna E2E' })
  if (profileError) throw profileError
  return email
}

/** Zera progresso e overrides do banco local. */
export async function resetProgress(): Promise<void> {
  const a = await admin.from('item_progress').delete().neq('item_id', '')
  if (a.error) throw a.error
  const b = await admin.from('node_overrides').delete().neq('node_id', '')
  if (b.error) throw b.error
}

/** Login por magic link gerado pelo admin (sem abrir e-mail). */
export async function signIn(page: Page, email: string): Promise<void> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink', email, options: { redirectTo: 'http://localhost:5173/' },
  })
  if (error) throw error
  await page.goto(data.properties.action_link)
  await page.waitForURL(/^http:\/\/localhost:5173\//)
}
```

- [ ] **Step 3: O teste**

`e2e/trail.spec.ts`:
```ts
import { expect, test } from '@playwright/test'
import { resetProgress, signIn, studentEmail } from './support'

test.beforeEach(async ({ page }) => {
  await resetProgress()
  await page.route(/youtube-nocookie\.com/, (route) => route.abort())
  await signIn(page, await studentEmail())
})

test('concluir a semana 1 libera a semana 2', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Hoje' })).toBeVisible()
  await page.getByRole('link', { name: 'Trilha', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Semana 2, bloqueada' })).toBeDisabled()
  await page.getByRole('button', { name: 'Semana 1, disponível' }).click()
  await expect(page).toHaveURL(/\/trilha\/w01$/)

  const boxes = page.getByRole('checkbox')
  const count = await boxes.count()
  for (let i = 0; i < count; i++) await boxes.nth(i).check()
  await expect(page.getByText('Semana concluída')).toBeVisible()

  await page.getByRole('link', { name: 'Ver a trilha' }).click()
  await expect(page.getByRole('button', { name: 'Semana 1, concluída' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Semana 2, disponível' })).toBeEnabled()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Semana 2, disponível' })).toBeEnabled()
})
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `set -a; eval "$(npx supabase status -o env)"; set +a; npx playwright test 2>&1 | tail -15`
Expected: FAIL em `signIn` → `waitForURL` estoura o tempo, porque o `supabase/config.toml` ainda redireciona para `http://127.0.0.1:3000` (o `redirectTo` do dev server não está na lista permitida). Se as variáveis tiverem outros nomes na sua versão do CLI (`npx supabase status -o env`), exporte `API_URL` e `SERVICE_ROLE_KEY` à mão.

- [ ] **Step 5: Liberar o redirect do dev server**

Em `supabase/config.toml`, seção `[auth]`:
```toml
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://localhost:5173/**", "http://127.0.0.1:5173/**"]
```
Run: `npx supabase stop && npx supabase start 2>&1 | tail -3`
Expected: Supabase local de volta nas portas 553xx. (Isso também conserta o magic link do `LoginScreen` em dev, que usa `window.location.origin`.)

- [ ] **Step 6: Rodar e ver passar**

Run: `set -a; eval "$(npx supabase status -o env)"; set +a; npx playwright test 2>&1 | tail -8`
Expected: `1 passed`.

- [ ] **Step 7: Verificação final da etapa**

Run: `npm test 2>&1 | tail -6 && npx supabase test db 2>&1 | tail -4 && npm run build 2>&1 | tail -4 && npm run lint 2>&1 | tail -4`
Expected: tudo verde.

- [ ] **Step 8: Commit**

```bash
git add playwright.config.ts e2e package.json package-lock.json .gitignore supabase/config.toml
git commit -m "test(e2e): completing a week unlocks the next one"
```

---

## Cobertura dos RFs da E4

| RF | Onde |
|---|---|
| RF-10, RF-11 (mapa por fase, 3 estados) | Task 15 |
| RF-12, RF-16 (regra de semana, sem trava de tempo) | `computeNodeStates` (Task 6) via `buildTrailState` (Task 13); E2E (Task 19) |
| RF-13 (portão/baú) | Task 13 (`gateDoneSet`) + Task 15 (`GateChest`) |
| RF-14 (Fase 4 aberta, 1 tema por mês) | Task 6 (regra) + Task 15 (aviso) |
| RF-15 (override com quem/quando) | Task 14 (`useSetOverride`) + Task 15 (`OverridePanel`) |
| RF-20–23 (tela da semana) | Task 16 |
| RF-30–32 (Hoje, rotina, streak, próximo item) | Task 13 (`routine`, `next`) + Task 17 |
| RF-40 (itens de fase automáticos) | Task 13 (`gateDoneSet`; itens de simulado recebem dados na E5) |
| RF-41 (mentor desmarca) | RLS (Task 5) + erro legível (Task 14/16) |
| RF-42 (checklists manuais) | **E6** (`ChecklistEditor`), como no roteiro |

## Após a Parte 3

Com as Tasks 13–19 verdes, a E4 está concluída. Próximo passo: detalhar **E5 — Simulados** (nova "Parte 4"), incluindo passar os dados reais de simulados para `buildTrailState` (substituindo `NO_SIMULATIONS` em `useNodeStates`) e acrescentar a aba "Simulados" em `AppShell`.

---

# Parte 4 — Plano detalhado: E5 Simulados

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar os simulados de vendas: roleta animada de 4 rolos, modo surpresa (mentor gira, aluna só vê o cenário depois do encerramento, garantido no banco), treino solo com cartas surpresa em texto e gravação de áudio (com fila offline), fichas de avaliação com nota oficial, fila "Treinos para avaliar" com player e marcadores, banco de cenários editável, e a passagem dos dados reais de simulados para os itens automáticos do baú (RF-40).

**Architecture:** As regras continuam puras em `src/domain` (`simulationState`, `simulationFacts`, `scenarioBank`, mais `roulette`, `cards` e `scoring` da Parte 2). O ciclo de vida do simulado, a revelação do cenário, a ficha só depois do fim, a conclusão automática com as duas fichas e a retenção do áudio ficam no banco (uma migration com triggers, uma RPC de criação atômica e uma view), testados com pgTAP. O acesso ao Supabase fica isolado em `src/features/simulations/hooks.ts` (contrato publicado primeiro, na Task 20, para as telas serem feitas em paralelo com mocks); a fila de gravações usa `idb-keyval` atrás de uma interface `KV` trocável nos testes.

**Tech Stack:** o da Parte 1. Única dependência nova: `idb-keyval@^6` (já prevista no Tech Stack), instalada na Task 22.

**Spec:** `PRD.md` §4.6 (RF-70–77), treino solo (RF-76a–76j), ficha (RF-78–83), banco de cenários (RF-84–85), §7 e §7.1 (modelo de dados e RLS) e Apêndice B.

## Global Constraints (adicionais às Partes 1–3)

- Telas de simulados só importam `@/features/simulations/hooks` (nunca `@/lib/supabase`). Testes de tela começam com `vi.mock('@/lib/supabase', () => ({ supabase: {} }))` e `vi.mock('./hooks')` e usam as fábricas de `src/test/simulationMocks.ts` (e `src/test/progressMocks.ts`).
- Ciclo do simulado (RF-83): `sorteado` → `em_andamento` → `aguardando_notas` → `concluido`. Transições, `started_at`, `revealed_at` e a conclusão (duas fichas) são do banco (`simulation_guard`, `score_guard`, `score_after`); o cliente só pede o próximo estado e nunca grava `revealed_at`.
- O cenário do surpresa só chega à aluna depois que o mentor encerra (RF-75, RLS). No treino em andamento, a UI da aluna nunca mostra complicações nem cartas fora da própria carta (RF-76a).
- "Girar de novo" (RF-73) é 100% no cliente: o simulado só é criado (via RPC `create_simulation`) quando o mentor toca em "Iniciar" ou a aluna em "Começar treino". O horário das cartas (`TrainingPlan`) existe só no aparelho; no banco ficam `kind`, `ref_id` e `shown_at_sec`.
- Dificuldade padrão pela fase (RF-71) via `difficultyForPhase`; duração do treino 5 min (chefe: 10 min, RF-76b/77); áudio mono ~24 kbps, no máximo 12 min (720 s).
- Áudio em `recordings/<simulation_id>/audio.<ext>` (`webm`, `m4a` ou `ogg`); upload idempotente (arquivo já existente conta como enviado); `delete_after` é calculado no banco (30 dias depois da nota do mentor, exceto "guardar"). O job `pg_cron` que apaga os arquivos e o Wake Lock ficam na E8.
- Visual: só componentes e tokens de `src/design` (tema "cyber cassino"), utilitários `glow` e `dither-dots` já existentes; nenhum estilo novo, nenhuma cor hex nas telas; `font-display` só em títulos ≥ 20 px.
- `package.json` só na Task 22. `src/App.tsx`, `src/features/shell/AppShell.tsx` e `e2e/support.ts` só na Task 32. `supabase/migrations/20260929000006_simulations.sql` só na Task 21.
- Supabase local nas portas 553xx. `npx supabase db reset` apaga as contas locais de teste; o E2E recria a aluna e o mentor quando faltam.

## Review Focus

1. **Aluna consultando o cenário do surpresa direto na API:** `select` em `simulation_scenarios` de um simulado surpresa não encerrado retorna 0 linhas; depois do encerramento retorna 1. A UI da aluna também não mostra o cenário nem se ele vier no payload. → pgTAP na Task 21, unit na Task 31, E2E na Task 32.
2. **Banco de cenários esvaziado ou com tudo inativo:** a roleta mostra o erro legível "Nenhum objetivo ativo no banco de cenários." em vez de quebrar, e o editor avisa quando um rolo obrigatório fica sem itens ativos. → unit em `roulette` (Task 8), Task 27 e Task 25.
3. **Gravação com rede ruim:** o upload falha, a gravação vai para a fila no aparelho ("gravação pendente de envio"), é reenviada sozinha ao abrir o app e quando a rede volta, e reenviar algo que já subiu não dá erro nem duplica a linha. → Tasks 22 e 23 (hooks) e Task 27 (aviso).
4. **Ficha fora de hora ou repetida:** enviar antes do simulado terminar, duas vezes (toque duplo), com nota fora de 1–5, ou pular etapas do ciclo (sorteado direto para aguardando notas, alterar dificuldade depois de criado) é recusado no banco, com mensagem legível na tela. → pgTAP na Task 21 e hooks na Task 23.
5. **Aba em segundo plano ou página recarregada no meio do treino:** a carta aparece no segundo certo mesmo se o navegador congelou o timer; recarregar a página não reinicia o treino nem revela as complicações, e oferece "Encerrar treino". → Task 24 (relógio real), Task 31 (`SimulationPage`/`SimulationDetail`).

## Ordem e paralelismo

O W1 fica fora da E5 (limite de uso). As Tasks 29–32 do primeiro rascunho foram redistribuídas: o W3 fica com dados, banco e o editor de cenários; o W4 fica com todas as telas restantes e o E2E.

| Passo | Task | Dono | Depende de | Roda em paralelo com |
|---|---|---|---|---|
| 1 | 20 — Contrato de dados e domínio dos simulados | **W3** | Tasks 1–19 | — |
| 2 | 22 — Gravador e fila offline (instala `idb-keyval`) | **W3** | — | 26, 27 |
| 2 | 24 — `useTrainingSession` (cronômetro, cartas, gravação) | **W3** | 20, 22 (depois da 22, mesmo dono) | 26, 27 |
| 2 | 26 — SlotMachine | **W4** | Tasks 10–11 | 22, 24 |
| 2 | 27 — SimulationsHome (roleta, início, histórico) | **W4** | 20, 26 (depois da 26, mesmo dono) | 22, 24 |
| 3 | 21 — Migration: ciclo do simulado, RPC, retenção, Storage | **W3** | Tasks 3–5 | 25, 28, 29, 30 |
| 3 | 25 — ScenarioBankEditor | **W3** | 20 | 21, 28, 29, 30 |
| 3 | 28 — SoloTraining | **W4** | 20, 24 | 21, 25 |
| 3 | 29 — ScoreSheetForm | **W4** | 20 | 21, 25 |
| 3 | 30 — RecordingPlayer e ReviewQueue | **W4** | 20 | 21, 25 |
| 4 | 23 — Hooks de dados (Supabase + TanStack Query) | **W3** | 20, 21, 22 | 31 |
| 4 | 31 — SimulationDetail e SimulationPage | **W4** | 20, 28, 29, 30 | 23 |
| 5 | 32 — Rotas, aba "Simulados" e E2E | **W4** | 21, 23, 25, 26–31 | — |

**Arquivos compartilhados (evitar conflito):** `src/features/simulations/hooks.ts` é do W3 (esqueleto na Task 20, implementação na 23); `src/features/progress/hooks.ts` só na Task 23; as telas do W4 não editam nada do W3. Entre Tasks do W4 não há arquivo em comum.

**Contrato para mockar:** a partir da Task 20, W4 escreve os testes de tela contra `vi.mock('./hooks')` e `src/test/simulationMocks.ts`, sem esperar a Task 23.

## Estrutura de arquivos (criada nesta parte)

```
supabase/
├── migrations/20260929000006_simulations.sql      # T21: guardas, RPC create_simulation, retenção, Storage, view de resultados
└── tests/simulations.test.sql                     # T21 (+ ajuste em rls.test.sql)
src/
├── domain/
│   ├── simulationState.ts (+ .test.ts)            # T20: rótulos, ocultação do cenário, fila do mentor
│   ├── simulationFacts.ts (+ .test.ts)            # T20: fatos de simulados para o portão (RF-40)
│   └── scenarioBank.ts (+ .test.ts)               # T20: ids e validação do banco de cenários
├── features/simulations/
│   ├── types.ts, hooks.ts, contract.test.ts       # T20 (esqueleto) → T23 (hooks)
│   ├── format.ts (+ .test.ts)                     # T20
│   ├── recorder.ts, recordingQueue.ts, idbStore.ts (+ testes)   # T22
│   ├── facts.ts, recordingSync.ts, hooks.test.tsx # T23
│   ├── useTrainingSession.ts (+ .test.ts)         # T24
│   ├── ScenarioBankEditor.tsx (+ .test.tsx)       # T25
│   ├── SlotMachine.tsx (+ .test.tsx)              # T26
│   ├── SimulationsHome.tsx (+ .test.tsx)          # T27
│   ├── SoloTraining.tsx (+ .test.tsx)             # T28
│   ├── ScoreSheetForm.tsx (+ .test.tsx)           # T29
│   ├── RecordingPlayer.tsx, ReviewQueue.tsx (+ testes)          # T30
│   ├── SimulationDetail.tsx, SimulationPage.tsx (+ testes)      # T31
│   └── SimulationsPage.tsx                        # T32
├── test/simulationMocks.ts, fakeSupabase.ts       # T20 / T23
├── features/progress/hooks.ts                     # T23: useNodeStates passa a usar os simulados reais
├── features/shell/AppShell.tsx, App.tsx           # T32: aba e rotas
e2e/simulations.spec.ts, e2e/support.ts            # T32
```

---

### Task 20: Contrato de dados e domínio dos simulados — **[W3]**

**Files:**
- Create: `src/domain/simulationState.ts`, `src/domain/simulationFacts.ts`, `src/domain/scenarioBank.ts`, `src/features/simulations/types.ts`, `src/features/simulations/hooks.ts` (esqueleto), `src/features/simulations/format.ts`, `src/test/simulationMocks.ts`
- Test: `src/domain/simulationState.test.ts`, `src/domain/simulationFacts.test.ts`, `src/domain/scenarioBank.test.ts`, `src/features/simulations/contract.test.ts`, `src/features/simulations/format.test.ts`

**Interfaces:**
- Consumes: `Difficulty`, `Draw`, `ReelItem` (`@/domain/roulette`); `PlannedCard` (`@/domain/cards`); `Scores` (`@/domain/scoring`); `SimulationFacts` (`@/domain/trailState`); `PhaseId` (`@/content/types`); `queryOf`, `mutationOf` (`@/test/progressMocks`); `TZ` (`@/lib/dates`).
- Produces (**contrato usado por W3 e W4 — não renomear**):
  - `src/domain/simulationState.ts`: `SimMode`, `SimStatus`, `Role`, `STATUS_LABEL`, `canRespin(status)`, `isScenarioHidden(mode, status, role)`, `statusLabel(mode, status, role)`, `countsInOfficial(status)`, `needsMentorReview({ mode, status, myScoreDone }, role)`, `canSubmitScore({ mode, status, myScoreDone })`.
  - `src/domain/simulationFacts.ts`: `ResultRow`, `simulationFactsOf(rows, originalObjectiveIds): SimulationFacts`.
  - `src/domain/scenarioBank.ts`: `ReelNumber`, `REEL_TITLES`, `nextReelId(reel, existing)`, `nextChallengeId(existing)`, `ReelItemDraft`, `validateReelItem(draft): string | null`, `validateChallengeText(text): string | null`.
  - `src/features/simulations/types.ts`: `SimulationSummary`, `ReelDetail`, `Scenario`, `SimCard`, `RecordingInfo`, `SimulationDetail`, `ScoreSheet`, `BankItem`, `ChallengeCard`, `BankData`, `CreateSimulationVars`, `AdvanceSimulationVars`, `SubmitScoreVars`, `CardShownVars`, `UploadRecordingVars`, `UploadOutcome`, `KeepRecordingVars`, `SaveReelItemVars`, `SetActiveVars`, `SaveChallengeVars`, `PendingRecordings`, `TrainingPlan`.
  - `src/features/simulations/hooks.ts` exporta **exatamente** (nomes e tipos fixos): `useSimulations(): UseQueryResult<SimulationSummary[]>`, `useSimulation(id): UseQueryResult<SimulationDetail>`, `useScores(simulationId): UseQueryResult<ScoreSheet[]>`, `useScenarioBank(): UseQueryResult<BankData>`, `useRecentObjectives(): UseQueryResult<string[]>` (do mais antigo para o mais novo, como `drawScenario` espera), `useRecordingUrl(filePath: string | null): UseQueryResult<string>`, `usePendingRecordings(): PendingRecordings`, `useCreateSimulation(): UseMutationResult<string, Error, CreateSimulationVars>`, `useAdvanceSimulation()`, `useSubmitScore()`, `useRecordCardShown()`, `useUploadRecording(): UseMutationResult<UploadOutcome, Error, UploadRecordingVars>`, `useKeepRecording()`, `useSaveReelItem()`, `useSetReelItemActive()`, `useSaveChallengeCard()`, `useSetChallengeCardActive()`.
  - `src/features/simulations/format.ts`: `mmss(sec)`, `formatWhen(iso)`, `DIFFICULTY_LABEL`.
  - `src/test/simulationMocks.ts`: `summaryOf(over?)`, `scenarioOf(over?)`, `detailOf(over?)`, `bankOf()`, `bankQuery()`, `asyncMutationOf(mutateAsync?, error?, isPending?)`, e re-exporta `queryOf` e `mutationOf`.

- [ ] **Step 1: Testes do domínio**


`src/domain/simulationState.test.ts`:
```ts
import { canRespin, canSubmitScore, countsInOfficial, isScenarioHidden, needsMentorReview, statusLabel } from './simulationState'

test('só gira de novo antes de iniciar (RF-73)', () => {
  expect(canRespin('sorteado')).toBe(true)
  expect(canRespin('em_andamento')).toBe(false)
})

test('cenário surpresa fica oculto para a aluna até o encerramento (RF-75)', () => {
  expect(isScenarioHidden('surpresa', 'sorteado', 'aluna')).toBe(true)
  expect(isScenarioHidden('surpresa', 'em_andamento', 'aluna')).toBe(true)
  expect(isScenarioHidden('surpresa', 'aguardando_notas', 'aluna')).toBe(false)
  expect(isScenarioHidden('surpresa', 'em_andamento', 'mentor')).toBe(false)
  expect(isScenarioHidden('treino', 'em_andamento', 'aluna')).toBe(false)
})

test('rótulos: surpresa em andamento para a aluna, "Treino" sem nota do mentor', () => {
  expect(statusLabel('surpresa', 'em_andamento', 'aluna')).toBe('Simulado surpresa em andamento')
  expect(statusLabel('surpresa', 'em_andamento', 'mentor')).toBe('Em andamento')
  expect(statusLabel('treino', 'aguardando_notas', 'aluna')).toBe('Treino')
  expect(statusLabel('treino', 'concluido', 'aluna')).toBe('Concluído')
})

test('só simulado concluído conta na média oficial (RF-82)', () => {
  expect(countsInOfficial('concluido')).toBe(true)
  expect(countsInOfficial('aguardando_notas')).toBe(false)
})

test('treinos para avaliar: só o mentor, só treino terminado sem a ficha dele (RF-76h)', () => {
  const s = { mode: 'treino' as const, status: 'aguardando_notas' as const, myScoreDone: false }
  expect(needsMentorReview(s, 'mentor')).toBe(true)
  expect(needsMentorReview(s, 'aluna')).toBe(false)
  expect(needsMentorReview({ ...s, myScoreDone: true }, 'mentor')).toBe(false)
  expect(needsMentorReview({ ...s, mode: 'surpresa' }, 'mentor')).toBe(false)
})

test('ficha só depois de terminar e uma vez (RF-80)', () => {
  expect(canSubmitScore({ mode: 'treino', status: 'em_andamento', myScoreDone: false })).toBe(false)
  expect(canSubmitScore({ mode: 'treino', status: 'aguardando_notas', myScoreDone: false })).toBe(true)
  expect(canSubmitScore({ mode: 'treino', status: 'aguardando_notas', myScoreDone: true })).toBe(false)
})
```

`src/domain/simulationFacts.test.ts`:
```ts
import { simulationFactsOf, type ResultRow } from './simulationFacts'
import { buildTrailState } from './trailState'

const row = (over: Partial<ResultRow> = {}): ResultRow => ({ objectiveId: 'obj-01', phase: 'f2', difficulty: 'medio', totalOfficial: 16, ...over })

test('separa objetivos avaliados, notas da Fase 2 e notas dos simulados difíceis', () => {
  const f = simulationFactsOf(
    [row(), row({ objectiveId: 'obj-02', phase: 'f3', difficulty: 'dificil', totalOfficial: 23 }), row({ objectiveId: null, totalOfficial: 10 })],
    ['obj-01', 'obj-02'],
  )
  expect([...f.evaluatedObjectiveIds].sort()).toEqual(['obj-01', 'obj-02'])
  expect(f.f2Officials).toEqual([16, 10])
  expect(f.hardOfficials).toEqual([23])
  expect(f.originalObjectiveIds).toEqual(['obj-01', 'obj-02'])
})

test('sem simulados nada é marcado, mesmo com o banco carregado', () => {
  const s = buildTrailState(new Set(), new Map(), simulationFactsOf([], ['obj-01']))
  expect(s.gateDone.has('f2.gate.2')).toBe(false)
  expect(s.gateDone.has('f2.gate.4')).toBe(false)
})

test('banco de originais vazio não marca "fez os 15 cenários" (Review Focus 2)', () => {
  expect(buildTrailState(new Set(), new Map(), simulationFactsOf([], [])).gateDone.has('f2.gate.2')).toBe(false)
})

test('média da Fase 2 com limite inclusivo entra no portão', () => {
  const s = buildTrailState(new Set(), new Map(), simulationFactsOf([row({ totalOfficial: 15 })], ['obj-01']))
  expect(s.gateDone.has('f2.gate.4')).toBe(true)
  expect(s.gateDone.has('f2.gate.2')).toBe(true)
})
```

`src/domain/scenarioBank.test.ts`:
```ts
import { nextChallengeId, nextReelId, validateChallengeText, validateReelItem } from './scenarioBank'

test('próximo id continua a numeração do rolo', () => {
  expect(nextReelId(1, ['obj-01', 'obj-30', 'prof-01'])).toBe('obj-31')
  expect(nextReelId(2, ['prof-01', 'prof-15'])).toBe('prof-16')
  expect(nextReelId(4, ['comp-00', 'comp-11'])).toBe('comp-12')
  expect(nextReelId(3, [])).toBe('prod-01')
  expect(nextChallengeId(['card-01', 'card-15'])).toBe('card-16')
})

test('objetivo exige papel do mentor e meta (RF-85)', () => {
  expect(validateReelItem({ reel: 1, label: 'Follow-up' })).toMatch(/papel do mentor/)
  expect(validateReelItem({ reel: 1, label: 'Follow-up', mentorRole: 'Lead que sumiu', studentGoal: 'Retomar' })).toBeNull()
})

test('complicação exige a fala do cliente; perfil e produto só o nome', () => {
  expect(validateReelItem({ reel: 4, label: 'Tá caro' })).toMatch(/fala do cliente/)
  expect(validateReelItem({ reel: 4, label: 'Tá caro', clientLine: 'Achei caro.' })).toBeNull()
  expect(validateReelItem({ reel: 2, label: 'Apressado' })).toBeNull()
  expect(validateReelItem({ reel: 3, label: '  ' })).toMatch(/nome/)
})

test('limites de tamanho', () => {
  expect(validateReelItem({ reel: 2, label: 'x'.repeat(81) })).toMatch(/80/)
  expect(validateChallengeText('')).toMatch(/pergunta/)
  expect(validateChallengeText('x'.repeat(201))).toMatch(/200/)
  expect(validateChallengeText('Tem nota fiscal?')).toBeNull()
})
```


- [ ] **Step 2: Testes do contrato e do formato**


`src/features/simulations/contract.test.ts`:
```ts
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./idbStore', () => ({ idbStore: {} }))

test('o módulo de hooks exporta exatamente o contrato combinado', async () => {
  const mod = await import('./hooks')
  expect(Object.keys(mod).sort()).toEqual([
    'useAdvanceSimulation', 'useCreateSimulation', 'useKeepRecording', 'usePendingRecordings', 'useRecentObjectives',
    'useRecordCardShown', 'useRecordingUrl', 'useSaveChallengeCard', 'useSaveReelItem', 'useScenarioBank', 'useScores',
    'useSetChallengeCardActive', 'useSetReelItemActive', 'useSimulation', 'useSimulations', 'useSubmitScore', 'useUploadRecording',
  ])
})
```

`src/features/simulations/format.test.ts`:
```ts
import { formatWhen, mmss } from './format'

test('mm:ss', () => {
  expect(mmss(0)).toBe('0:00')
  expect(mmss(125)).toBe('2:05')
  expect(mmss(600)).toBe('10:00')
  expect(mmss(-3)).toBe('0:00')
})

test('data e hora no fuso de São Paulo, não no do aparelho', () => {
  expect(formatWhen('2026-09-30T02:30:00Z')).toBe('29/09, 23:30')
})
```


- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/domain/simulationState.test.ts src/domain/simulationFacts.test.ts src/domain/scenarioBank.test.ts src/features/simulations 2>&1 | tail -15`
Expected: FAIL — `Failed to resolve import "./simulationState"` / `"./simulationFacts"` / `"./scenarioBank"` / `"./hooks"` / `"./format"`.

- [ ] **Step 4: Implementar o domínio e o formato**


`src/domain/simulationState.ts`:
```ts
export type SimMode = 'surpresa' | 'treino'
export type SimStatus = 'sorteado' | 'em_andamento' | 'aguardando_notas' | 'concluido'
export type Role = 'aluna' | 'mentor'

export const STATUS_LABEL: Record<SimStatus, string> = {
  sorteado: 'Sorteado',
  em_andamento: 'Em andamento',
  aguardando_notas: 'Aguardando notas',
  concluido: 'Concluído',
}

/** RF-73: só dá para girar de novo antes de iniciar. */
export const canRespin = (status: SimStatus): boolean => status === 'sorteado'

/** RF-75: a aluna não vê o cenário do simulado surpresa até o mentor encerrar. */
export function isScenarioHidden(mode: SimMode, status: SimStatus, role: Role): boolean {
  return role === 'aluna' && mode === 'surpresa' && (status === 'sorteado' || status === 'em_andamento')
}

/** Rótulo mostrado nas listas. Treino sem a nota do mentor fica só "Treino" (RF-82). */
export function statusLabel(mode: SimMode, status: SimStatus, role: Role): string {
  if (isScenarioHidden(mode, status, role)) return 'Simulado surpresa em andamento'
  if (mode === 'treino' && status !== 'concluido') return 'Treino'
  return STATUS_LABEL[status]
}

/** RF-82: só o simulado concluído (duas fichas) entra na média oficial. */
export const countsInOfficial = (status: SimStatus): boolean => status === 'concluido'

interface SimFlags { mode: SimMode; status: SimStatus; myScoreDone: boolean }

/** RF-76h/i: treino terminado que ainda espera a nota do mentor. */
export function needsMentorReview(s: SimFlags, role: Role): boolean {
  return role === 'mentor' && s.mode === 'treino' && s.status === 'aguardando_notas' && !s.myScoreDone
}

/** RF-79/80: cada um envia a própria ficha uma vez, depois que o simulado terminou. */
export const canSubmitScore = (s: SimFlags): boolean => s.status === 'aguardando_notas' && !s.myScoreDone
```

`src/domain/simulationFacts.ts`:
```ts
import type { PhaseId } from '@/content/types'
import type { Difficulty } from './roulette'
import type { SimulationFacts } from './trailState'

/** Uma linha de `v_simulation_results`: simulado com as duas fichas enviadas. */
export interface ResultRow { objectiveId: string | null; phase: PhaseId; difficulty: Difficulty; totalOfficial: number }

/** Fatos de simulados que alimentam os itens automáticos de portão (RF-40). */
export function simulationFactsOf(rows: ResultRow[], originalObjectiveIds: string[]): SimulationFacts {
  return {
    originalObjectiveIds,
    evaluatedObjectiveIds: new Set(rows.flatMap((r) => (r.objectiveId ? [r.objectiveId] : []))),
    f2Officials: rows.filter((r) => r.phase === 'f2').map((r) => r.totalOfficial),
    hardOfficials: rows.filter((r) => r.difficulty === 'dificil').map((r) => r.totalOfficial),
  }
}
```

`src/domain/scenarioBank.ts`:
```ts
export type ReelNumber = 1 | 2 | 3 | 4

export const REEL_TITLES: Record<ReelNumber, string> = { 1: 'Objetivo', 2: 'Perfil do cliente', 3: 'Produto', 4: 'Complicação surpresa' }
const PREFIX: Record<ReelNumber, string> = { 1: 'obj', 2: 'prof', 3: 'prod', 4: 'comp' }

const nextId = (prefix: string, existing: readonly string[]): string => {
  const max = existing
    .filter((id) => id.startsWith(`${prefix}-`))
    .reduce((m, id) => Math.max(m, Number(id.slice(prefix.length + 1)) || 0), 0)
  return `${prefix}-${String(max + 1).padStart(2, '0')}`
}

/** Próximo id livre do rolo (`obj-31`, `prof-16`…). */
export const nextReelId = (reel: ReelNumber, existing: readonly string[]): string => nextId(PREFIX[reel], existing)
/** Próximo id livre do baralho de questionamentos (`card-16`…). */
export const nextChallengeId = (existing: readonly string[]): string => nextId('card', existing)

export interface ReelItemDraft { reel: ReelNumber; label: string; mentorRole?: string; studentGoal?: string; clientLine?: string }

const blank = (s: string | undefined) => !s || s.trim() === ''

/** RF-84/85: devolve a mensagem de erro em pt-BR ou `null` se o item pode ser salvo. */
export function validateReelItem(d: ReelItemDraft): string | null {
  if (blank(d.label)) return 'Escreva o nome do item.'
  if (d.label.trim().length > 80) return 'O nome pode ter no máximo 80 caracteres.'
  if (d.reel === 1 && (blank(d.mentorRole) || blank(d.studentGoal))) return 'Objetivo precisa do papel do mentor e da meta dela.'
  if (d.reel === 4 && blank(d.clientLine)) return 'A complicação precisa da fala do cliente, em primeira pessoa.'
  return null
}

export function validateChallengeText(text: string): string | null {
  if (text.trim() === '') return 'Escreva a pergunta do cliente.'
  if (text.trim().length > 200) return 'A pergunta pode ter no máximo 200 caracteres.'
  return null
}
```

`src/features/simulations/format.ts`:
```ts
import { TZ } from '@/lib/dates'

/** 125 → "2:05". */
export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const when = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
/** Data e hora no fuso de São Paulo, ex.: "29/09, 12:30". */
export const formatWhen = (iso: string): string => when.format(new Date(iso))

export const DIFFICULTY_LABEL = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' } as const
```


- [ ] **Step 5: Tipos, esqueleto dos hooks e mocks de teste**


`src/features/simulations/types.ts`:
```ts
import type { PhaseId } from '@/content/types'
import type { PlannedCard } from '@/domain/cards'
import type { Difficulty, Draw, ReelItem } from '@/domain/roulette'
import type { Scores } from '@/domain/scoring'
import type { Role, SimMode, SimStatus } from '@/domain/simulationState'

export type { Role, SimMode, SimStatus }
export type CardKind = 'complicacao' | 'questionamento'

export interface SimulationSummary {
  id: string
  mode: SimMode
  difficulty: Difficulty
  phase: PhaseId
  status: SimStatus
  isBoss: boolean
  createdAt: string
  startedAt: string | null
  revealedAt: string | null
  /** A ficha de quem está logado já foi enviada. */
  myScoreDone: boolean
  /** Total oficial (média das duas fichas); `null` até as duas existirem. */
  official: number | null
  hasRecording: boolean
}

export interface ReelDetail { id: string; label: string; mentorRole: string | null; studentGoal: string | null; clientLine: string | null }
export interface Scenario { objective: ReelDetail; profile: ReelDetail; product: ReelDetail; complications: ReelDetail[] }
/** `text` é a fala do cliente (complicação) ou a pergunta do baralho (questionamento). */
export interface SimCard { position: number; kind: CardKind; refId: string; text: string; shownAtSec: number | null }
export interface RecordingInfo { filePath: string; mime: string; durationSec: number; sizeBytes: number; keep: boolean; deleteAfter: string | null }

export interface SimulationDetail {
  summary: SimulationSummary
  /** `null` quando o RLS esconde o cenário (aluna, simulado surpresa ainda não encerrado). */
  scenario: Scenario | null
  cards: SimCard[]
  recording: RecordingInfo | null
}

export interface ScoreSheet { raterRole: Role; mine: boolean; scores: Scores; good: string; improve: string; submittedAt: string }

export interface BankItem extends ReelItem { mentorRole: string | null; studentGoal: string | null; clientLine: string | null; original: boolean }
export interface ChallengeCard { id: string; text: string; active: boolean }
export interface BankData { items: BankItem[]; challenges: ChallengeCard[] }

export interface CreateSimulationVars { mode: SimMode; difficulty: Difficulty; phase: PhaseId; isBoss: boolean; draw: Draw; cards: PlannedCard[] }
export interface AdvanceSimulationVars { id: string; to: 'em_andamento' | 'aguardando_notas' }
export interface SubmitScoreVars { simulationId: string; scores: Scores; good: string; improve: string }
export interface CardShownVars { simulationId: string; position: number; atSec: number }
export interface UploadRecordingVars { simulationId: string; blob: Blob; mime: string; durationSec: number }
export type UploadOutcome = 'uploaded' | 'queued'
export interface KeepRecordingVars { simulationId: string; keep: boolean }
export interface SaveReelItemVars { id?: string; reel: 1 | 2 | 3 | 4; label: string; mentorRole?: string; studentGoal?: string; clientLine?: string }
export interface SetActiveVars { id: string; active: boolean }
export interface SaveChallengeVars { id?: string; text: string }
export interface PendingRecordings { pending: number; flush(): Promise<void> }

/** Horários (segundos desde o início) das cartas do treino, por `position`. Só existe no aparelho, não vai para o banco. */
export interface TrainingPlan { durationSec: number; cardTimes: number[] }
```


`src/features/simulations/hooks.ts` (esqueleto; a Task 23 troca os corpos, sem mudar nomes nem tipos):
```ts
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type {
  AdvanceSimulationVars, BankData, CardShownVars, CreateSimulationVars, KeepRecordingVars, PendingRecordings,
  SaveChallengeVars, SaveReelItemVars, ScoreSheet, SetActiveVars, SimulationDetail, SimulationSummary,
  SubmitScoreVars, UploadOutcome, UploadRecordingVars,
} from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 23`)
}

export function useSimulations(): UseQueryResult<SimulationSummary[]> { return notYet('useSimulations') }
export function useSimulation(id: string): UseQueryResult<SimulationDetail> { return notYet(`useSimulation(${id})`) }
export function useScores(simulationId: string): UseQueryResult<ScoreSheet[]> { return notYet(`useScores(${simulationId})`) }
export function useScenarioBank(): UseQueryResult<BankData> { return notYet('useScenarioBank') }
export function useRecentObjectives(): UseQueryResult<string[]> { return notYet('useRecentObjectives') }
export function useRecordingUrl(filePath: string | null): UseQueryResult<string> { return notYet(`useRecordingUrl(${filePath})`) }
export function usePendingRecordings(): PendingRecordings { return notYet('usePendingRecordings') }

export function useCreateSimulation(): UseMutationResult<string, Error, CreateSimulationVars> { return notYet('useCreateSimulation') }
export function useAdvanceSimulation(): UseMutationResult<void, Error, AdvanceSimulationVars> { return notYet('useAdvanceSimulation') }
export function useSubmitScore(): UseMutationResult<void, Error, SubmitScoreVars> { return notYet('useSubmitScore') }
export function useRecordCardShown(): UseMutationResult<void, Error, CardShownVars> { return notYet('useRecordCardShown') }
export function useUploadRecording(): UseMutationResult<UploadOutcome, Error, UploadRecordingVars> { return notYet('useUploadRecording') }
export function useKeepRecording(): UseMutationResult<void, Error, KeepRecordingVars> { return notYet('useKeepRecording') }
export function useSaveReelItem(): UseMutationResult<void, Error, SaveReelItemVars> { return notYet('useSaveReelItem') }
export function useSetReelItemActive(): UseMutationResult<void, Error, SetActiveVars> { return notYet('useSetReelItemActive') }
export function useSaveChallengeCard(): UseMutationResult<void, Error, SaveChallengeVars> { return notYet('useSaveChallengeCard') }
export function useSetChallengeCardActive(): UseMutationResult<void, Error, SetActiveVars> { return notYet('useSetChallengeCardActive') }
```


`src/test/simulationMocks.ts`:
```ts
import type { UseQueryResult } from '@tanstack/react-query'
import { queryOf } from './progressMocks'
import type { BankData, ReelDetail, Scenario, SimulationDetail, SimulationSummary } from '@/features/simulations/types'

export { queryOf, mutationOf } from './progressMocks'

/** Mutation com `mutateAsync` controlável (para telas que fazem `await mutateAsync(...)`). */
export function asyncMutationOf(mutateAsync = vi.fn().mockResolvedValue(undefined), error: Error | null = null, isPending = false): never {
  return { mutate: vi.fn(), mutateAsync, isPending, error, reset: vi.fn() } as never
}

export function summaryOf(over: Partial<SimulationSummary> = {}): SimulationSummary {
  return {
    id: 'sim-1', mode: 'surpresa', difficulty: 'medio', phase: 'f2', status: 'sorteado', isBoss: false,
    createdAt: '2026-09-29T15:00:00Z', startedAt: null, revealedAt: null,
    myScoreDone: false, official: null, hasRecording: false, ...over,
  }
}

const reel = (id: string, label: string, extra: Partial<ReelDetail> = {}): ReelDetail =>
  ({ id, label, mentorRole: null, studentGoal: null, clientLine: null, ...extra })

export function scenarioOf(over: Partial<Scenario> = {}): Scenario {
  return {
    objective: reel('obj-06', 'Objeção de preço', { mentorRole: '"Tá caro"', studentGoal: 'Reancorar valor antes de falar em desconto' }),
    profile: reel('prof-01', 'Apressado'),
    product: reel('prod-01', 'Plano de internet'),
    complications: [reel('comp-01', 'Tá caro', { clientLine: 'Olha, achei caro. Tá fora do meu orçamento.' })],
    ...over,
  }
}

export function detailOf(over: Partial<SimulationDetail> = {}): SimulationDetail {
  return { summary: summaryOf(), scenario: scenarioOf(), cards: [], recording: null, ...over }
}

/** Banco pequeno mas suficiente para a roleta (inclui "Nenhuma" e inativos). */
export function bankOf(): BankData {
  const item = (id: string, reel: 1 | 2 | 3 | 4, label: string, extra: Partial<BankData['items'][number]> = {}) =>
    ({ id, reel, label, active: true, isNone: false, mentorRole: null, studentGoal: null, clientLine: null, original: false, ...extra })
  return {
    items: [
      item('obj-01', 1, 'Captura de lead', { mentorRole: 'Dono de padaria', studentGoal: 'Conseguir o WhatsApp', original: true }),
      item('obj-02', 1, 'Agendamento', { mentorRole: 'Gerente sem tempo', studentGoal: 'Marcar reunião', original: true }),
      item('obj-03', 1, 'Follow-up', { mentorRole: 'Lead que sumiu', studentGoal: 'Obter sim ou não', active: false }),
      item('prof-01', 2, 'Apressado'),
      item('prod-01', 3, 'Plano de internet'),
      item('comp-00', 4, 'Nenhuma', { isNone: true }),
      item('comp-01', 4, 'Tá caro', { clientLine: 'Olha, achei caro.' }),
      item('comp-02', 4, 'Vou pensar', { clientLine: 'Gostei, mas vou pensar.' }),
      item('comp-03', 4, 'Sócio/cônjuge', { clientLine: 'Preciso ver com meu sócio.' }),
    ],
    challenges: [
      { id: 'card-01', text: 'Isso funciona mesmo?', active: true },
      { id: 'card-02', text: 'Qual a garantia?', active: true },
    ],
  }
}

export const bankQuery = (): UseQueryResult<BankData> => queryOf(bankOf())
```


- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/domain src/features/simulations 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS em todos os arquivos; `tsc` sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/domain/simulationState.ts src/domain/simulationState.test.ts src/domain/simulationFacts.ts src/domain/simulationFacts.test.ts src/domain/scenarioBank.ts src/domain/scenarioBank.test.ts src/features/simulations/types.ts src/features/simulations/hooks.ts src/features/simulations/contract.test.ts src/features/simulations/format.ts src/features/simulations/format.test.ts src/test/simulationMocks.ts
git commit -m "feat(simulations): domain rules and data contract"
```

---
### Task 21: Migration — ciclo do simulado, RPC, retenção e Storage — **[W3]**

**Files:**
- Create: `supabase/migrations/20260929000006_simulations.sql`, `supabase/tests/simulations.test.sql`
- Modify: `supabase/tests/rls.test.sql` (1 linha da fixture)

**Interfaces:**
- Consumes: schema e RLS das Tasks 3 e 5 (`simulations`, `simulation_scenarios`, `simulation_scores`, `simulation_cards`, `simulation_recordings`, `both_scored`, `v_simulation_official`, `my_role`), buckets `recordings`.
- Produces:
  - Constraints: `simulations.phase in ('f1','f2','f3','f4')`; `simulation_recordings.file_path like <simulation_id>/%`.
  - Triggers: `simulation_guard` (campos fixos; transições `sorteado→em_andamento→aguardando_notas→concluido`; `started_at`; `revealed_at` ao encerrar; `concluido` só com as duas fichas), `score_guard` (ficha só com o simulado em `aguardando_notas`; erro `simulation_not_finished`), `score_after` (duas fichas ⇒ `concluido`; ficha do mentor ⇒ `delete_after` da gravação), `recording_guard` (campos fixos; `keep` e `delete_after` derivados no banco).
  - `public.create_simulation(p_mode, p_difficulty, p_phase, p_is_boss, p_objective, p_profile, p_product, p_complications text[], p_cards jsonb default '[]') returns uuid` (security **invoker**: o RLS continua valendo; cada carta é `{"position": n, "kind": "...", "ref_id": "..."}`).
  - Policy `rec_write` em `storage.objects`: só a aluna, só na pasta de um treino dela; bucket `recordings` aceita `audio/*`.
  - View `public.v_simulation_results(simulation_id, mode, difficulty, phase, is_boss, created_at, objective_id, total_official)` (security invoker; só simulados com as duas fichas).
- Códigos de erro que as telas mapeiam (Task 23): `simulation_immutable`, `invalid_status_transition`, `simulation_not_finished` (todos `P0001`), `23505` (ficha duplicada), `42501` (RLS).

- [ ] **Step 1: Testes pgTAP primeiro**

`supabase/tests/rls.test.sql` — na fixture do simulado surpresa, criar já em `aguardando_notas` (o `score_guard` só aceita ficha nesse estado; o resto do arquivo não muda). Trocar
```sql
insert into public.simulations (id, mode, difficulty, phase, created_by)
values ('11111111-1111-1111-1111-111111111111', 'surpresa', 'medio', 'f2', '00000000-0000-0000-0000-00000000000b');
```
por
```sql
insert into public.simulations (id, mode, difficulty, phase, status, created_by)
values ('11111111-1111-1111-1111-111111111111', 'surpresa', 'medio', 'f2', 'aguardando_notas', '00000000-0000-0000-0000-00000000000b');
```


`supabase/tests/simulations.test.sql`:
```sql
begin;
-- independente das contas locais: tudo é desfeito pelo rollback no fim
truncate public.profiles cascade;
delete from auth.users;
select plan(18);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'aluna@test'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor@test');
insert into public.profiles values
  ('00000000-0000-0000-0000-00000000000a', 'aluna', 'Aluna'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor', 'Mentor');

-- mentor sorteia um simulado surpresa
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select set_config('t.s', public.create_simulation('surpresa', 'medio', 'f2', false, 'obj-06', 'prof-01', 'prod-01', '{comp-01}')::text, true);
select is((select status::text from public.simulations where id = current_setting('t.s')::uuid), 'sorteado', 'RPC cria o simulado sorteado');
select throws_ok($$ update public.simulations set status = 'aguardando_notas' where id = current_setting('t.s')::uuid $$,
  'P0001', 'invalid_status_transition', 'não pula etapas do ciclo');
update public.simulations set status = 'em_andamento' where id = current_setting('t.s')::uuid;
select isnt((select started_at from public.simulations where id = current_setting('t.s')::uuid), null, 'início registra started_at');

-- aluna: sem cenário e sem ficha enquanto o simulado roda
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.simulation_scenarios), 0, 'aluna não vê o cenário em andamento');
select throws_ok($$ insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
  values (current_setting('t.s')::uuid, 3, 3, 3, 3, 3, 3) $$, 'P0001', 'simulation_not_finished', 'ficha só depois do fim');

-- mentor encerra: cenário revelado
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
update public.simulations set status = 'aguardando_notas' where id = current_setting('t.s')::uuid;
select isnt((select revealed_at from public.simulations where id = current_setting('t.s')::uuid), null, 'encerrar revela o cenário');
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is((select count(*)::int from public.simulation_scenarios), 1, 'aluna vê o cenário depois de encerrado');

-- duas fichas concluem sozinho
insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
values (current_setting('t.s')::uuid, 3, 3, 3, 3, 3, 3);
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
values (current_setting('t.s')::uuid, 5, 5, 5, 5, 5, 5);
select is((select status::text from public.simulations where id = current_setting('t.s')::uuid), 'concluido', 'duas fichas concluem o simulado');

-- treino da aluna: RPC com cartas
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select set_config('t.t', public.create_simulation('treino', 'medio', 'f2', false, 'obj-06', 'prof-01', 'prod-01', '{comp-01}',
  '[{"position":0,"kind":"complicacao","ref_id":"comp-01"},{"position":1,"kind":"questionamento","ref_id":"card-01"}]'::jsonb)::text, true);
select is((select count(*)::int from public.simulation_cards where simulation_id = current_setting('t.t')::uuid), 2, 'RPC grava as cartas do treino');
select throws_ok($$ update public.simulations set difficulty = 'dificil' where id = current_setting('t.t')::uuid $$,
  'P0001', 'simulation_immutable', 'dificuldade não muda depois de criado');
select throws_ok($$ select public.create_simulation('surpresa', 'facil', 'f1', false, 'obj-01', 'prof-01', 'prod-01', '{comp-00}') $$,
  '42501', null, 'aluna não cria simulado surpresa');

-- gravação e retenção
update public.simulations set status = 'em_andamento' where id = current_setting('t.t')::uuid;
update public.simulations set status = 'aguardando_notas' where id = current_setting('t.t')::uuid;
select throws_ok($$ insert into public.simulation_recordings (simulation_id, file_path, mime, duration_sec, size_bytes)
  values (current_setting('t.t')::uuid, 'outra-pasta/audio.webm', 'audio/webm', 300, 1000) $$,
  '23514', null, 'arquivo precisa estar na pasta do simulado');
insert into public.simulation_recordings (simulation_id, file_path, mime, duration_sec, size_bytes)
values (current_setting('t.t')::uuid, current_setting('t.t') || '/audio.webm', 'audio/webm;codecs=opus', 300, 1000);
select is((select delete_after from public.simulation_recordings where simulation_id = current_setting('t.t')::uuid), null, 'sem nota do mentor o áudio não expira');
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('recordings', current_setting('t.t') || '/audio.webm') $$, 'aluna sobe o áudio na pasta do treino');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('recordings', current_setting('t.s') || '/audio.webm') $$,
  '42501', null, 'aluna não sobe áudio na pasta de outro simulado');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
insert into public.simulation_scores (simulation_id, abertura, tom, perguntas, escuta, objecao, fechamento)
values (current_setting('t.t')::uuid, 4, 4, 4, 4, 4, 4);
select isnt((select delete_after from public.simulation_recordings where simulation_id = current_setting('t.t')::uuid), null, 'nota do mentor agenda a exclusão em 30 dias');
select throws_ok($$ update public.simulation_recordings set file_path = 'x/y.webm' where simulation_id = current_setting('t.t')::uuid $$,
  'P0001', 'recording_immutable', 'arquivo da gravação não muda');
update public.simulation_recordings set keep = true where simulation_id = current_setting('t.t')::uuid;
select is((select delete_after from public.simulation_recordings where simulation_id = current_setting('t.t')::uuid), null, 'guardar cancela a exclusão');

select * from finish();
rollback;
```


- [ ] **Step 2: Ver falhar**

Run: `npx --yes supabase@2 test db 2>&1 | tail -15`
Expected: `journal.test.sql` e `rls.test.sql` ok; `simulations.test.sql` FAIL (`function public.create_simulation(...) does not exist`).

- [ ] **Step 3: Implementar a migration**


`supabase/migrations/20260929000006_simulations.sql`:
```sql
alter table public.simulations
  add constraint simulations_phase_ck check (phase in ('f1', 'f2', 'f3', 'f4'));
alter table public.simulation_recordings
  add constraint recording_path_ck check (file_path like simulation_id::text || '/%');

-- Ciclo de vida do simulado (RF-83) e revelação do cenário (RF-75)
create or replace function public.simulation_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.mode is distinct from old.mode or new.difficulty is distinct from old.difficulty
     or new.phase is distinct from old.phase or new.is_boss is distinct from old.is_boss
     or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'simulation_immutable' using errcode = 'P0001';
  end if;
  if new.status is distinct from old.status then
    if not ((old.status = 'sorteado' and new.status = 'em_andamento')
         or (old.status = 'em_andamento' and new.status = 'aguardando_notas')
         or (old.status = 'aguardando_notas' and new.status = 'concluido' and public.both_scored(old.id))) then
      raise exception 'invalid_status_transition' using errcode = 'P0001';
    end if;
    if new.status = 'em_andamento' then new.started_at := now(); end if;
    if new.status = 'aguardando_notas' then new.revealed_at := coalesce(new.revealed_at, old.revealed_at, now()); end if;
  end if;
  return new;
end $$;

create trigger simulation_guard before update on public.simulations
for each row execute function public.simulation_guard();

-- Ficha só depois que o simulado terminou
create or replace function public.score_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare st public.sim_status;
begin
  select status into st from public.simulations where id = new.simulation_id;
  if st is distinct from 'aguardando_notas' then
    raise exception 'simulation_not_finished' using errcode = 'P0001';
  end if;
  new.submitted_at := now();
  return new;
end $$;

create trigger score_guard before insert on public.simulation_scores
for each row execute function public.score_guard();

-- Duas fichas => concluído; nota do mentor => começa a contar os 30 dias do áudio (RF-76j)
create or replace function public.score_after() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.both_scored(new.simulation_id) then
    update public.simulations set status = 'concluido' where id = new.simulation_id and status = 'aguardando_notas';
  end if;
  if exists (select 1 from public.profiles p where p.id = new.rater_id and p.role = 'mentor') then
    update public.simulation_recordings set delete_after = now() + interval '30 days'
    where simulation_id = new.simulation_id and not keep;
  end if;
  return new;
end $$;

create trigger score_after after insert on public.simulation_scores
for each row execute function public.score_after();

-- Gravação: campos fixos; retenção calculada no banco
create or replace function public.recording_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare mentor_scored boolean;
begin
  select exists (
    select 1 from public.simulation_scores s join public.profiles p on p.id = s.rater_id
    where s.simulation_id = new.simulation_id and p.role = 'mentor') into mentor_scored;
  if tg_op = 'UPDATE' then
    if new.simulation_id is distinct from old.simulation_id or new.file_path is distinct from old.file_path
       or new.mime is distinct from old.mime or new.duration_sec is distinct from old.duration_sec
       or new.size_bytes is distinct from old.size_bytes then
      raise exception 'recording_immutable' using errcode = 'P0001';
    end if;
    -- derivado do estado: guardada ou sem nota do mentor => nunca expira; senão 30 dias após a nota
    new.delete_after := case
      when new.keep or not mentor_scored then null
      else coalesce(old.delete_after, now() + interval '30 days') end;
  else
    new.keep := false;
    new.delete_after := case when mentor_scored then now() + interval '30 days' end;
  end if;
  return new;
end $$;

create trigger recording_guard before insert or update on public.simulation_recordings
for each row execute function public.recording_guard();

-- Criação atômica (security invoker: o RLS de simulations, scenarios e cards continua valendo)
create or replace function public.create_simulation(
  p_mode public.sim_mode, p_difficulty public.difficulty, p_phase text, p_is_boss boolean,
  p_objective text, p_profile text, p_product text, p_complications text[], p_cards jsonb default '[]'
) returns uuid
language plpgsql set search_path = '' as $$
declare sim uuid;
begin
  insert into public.simulations (mode, difficulty, phase, is_boss)
  values (p_mode, p_difficulty, p_phase, p_is_boss) returning id into sim;
  insert into public.simulation_scenarios (simulation_id, objective_id, profile_id, product_id, complication_ids)
  values (sim, p_objective, p_profile, p_product, coalesce(p_complications, '{}'));
  insert into public.simulation_cards (simulation_id, position, kind, ref_id)
  select sim, (c->>'position')::smallint, (c->>'kind')::public.card_kind, c->>'ref_id'
  from jsonb_array_elements(p_cards) c;
  return sim;
end $$;

-- Áudio só na pasta do próprio treino da aluna (RF-76g, PRD §7.1)
drop policy rec_write on storage.objects;
create policy rec_write on storage.objects for insert to authenticated with check (
  bucket_id = 'recordings' and public.my_role() = 'aluna' and exists (
    select 1 from public.simulations s
    where s.id::text = (storage.foldername(name))[1] and s.created_by = auth.uid() and s.mode = 'treino'));
update storage.buckets set allowed_mime_types = array['audio/*'] where id = 'recordings';

-- Resultado oficial por simulado, para os itens automáticos de portão (RF-40)
create view public.v_simulation_results with (security_invoker = true) as
select s.id as simulation_id, s.mode, s.difficulty, s.phase, s.is_boss, s.created_at,
       sc.objective_id, o.total_official
from public.simulations s
join public.v_simulation_official o on o.simulation_id = s.id
left join public.simulation_scenarios sc on sc.simulation_id = s.id;
```


- [ ] **Step 4: Aplicar e ver passar**

Run: `npx --yes supabase@2 db reset 2>&1 | tail -3 && npx --yes supabase@2 test db 2>&1 | tail -10`
Expected: "Finished supabase db reset"; `journal.test.sql .. ok`, `rls.test.sql .. ok`, `simulations.test.sql .. ok`; `Result: PASS`. (O reset apaga as contas locais de teste; o E2E da Task 32 recria a aluna e o mentor.)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260929000006_simulations.sql supabase/tests/simulations.test.sql supabase/tests/rls.test.sql
git commit -m "feat(db): simulation lifecycle guards, atomic create RPC, recording retention and storage folder policy"
```

---

### Task 22: Gravador e fila offline de gravações — **[W3]**

**Files:**
- Create: `src/features/simulations/recorder.ts`, `src/features/simulations/recordingQueue.ts`, `src/features/simulations/idbStore.ts`
- Modify: `package.json`, `package-lock.json` (só esta Task mexe neles)
- Test: `src/features/simulations/recorder.test.ts`, `src/features/simulations/recordingQueue.test.ts`

**Interfaces:**
- Consumes: APIs do navegador (`MediaRecorder`, `getUserMedia`), `idb-keyval`.
- Produces:
  - `recorder.ts`: `MAX_SECONDS = 720`, `AUDIO_BITS_PER_SECOND = 24_000`, `pickMime(isSupported): string | null`, `RecorderError`, `RecordingResult { blob; mime; durationSec }`, `Recorder { mime; stop(): Promise<RecordingResult> }`, `startRecording(deps?): Promise<Recorder>` (lança `RecorderError` com mensagem em pt-BR sem suporte ou sem microfone).
  - `recordingQueue.ts`: `KV`, `PendingRecording`, `Uploader`, `createMemoryStore()`, `createRecordingQueue(store, upload)` → `{ enqueue(r), count(), flush() }` (`flush` devolve `{ sent, failed }` e rodadas simultâneas compartilham o mesmo trabalho).
  - `idbStore.ts`: `idbStore: KV` (IndexedDB).

- [ ] **Step 1: Instalar a dependência**

Run: `npm i idb-keyval@^6 2>&1 | tail -2`
Expected: `idb-keyval` em `dependencies`.

- [ ] **Step 2: Testes**


`src/features/simulations/recorder.test.ts`:
```ts
import { AUDIO_BITS_PER_SECOND, MAX_SECONDS, pickMime, RecorderError, startRecording, type RecorderDeps } from './recorder'

class FakeRecorder {
  static supported = new Set<string>(['audio/webm;codecs=opus'])
  static last: FakeRecorder
  static isTypeSupported = (m: string) => FakeRecorder.supported.has(m)
  state: 'inactive' | 'recording' = 'inactive'
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  options: { mimeType: string; audioBitsPerSecond: number }
  constructor(_stream: MediaStream, options: { mimeType: string; audioBitsPerSecond: number }) {
    this.options = options
    FakeRecorder.last = this
  }
  start() { this.state = 'recording' }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['abc']) })
    this.onstop?.()
  }
}

const track = { stop: vi.fn() }
const stream = { getTracks: () => [track] } as unknown as MediaStream
let clock = 0
const deps = (over: Partial<RecorderDeps> = {}): RecorderDeps => ({
  getUserMedia: vi.fn().mockResolvedValue(stream),
  MediaRecorder: FakeRecorder as unknown as typeof MediaRecorder,
  now: () => clock,
  ...over,
})

beforeEach(() => {
  vi.useFakeTimers()
  clock = 0
  track.stop.mockClear()
  FakeRecorder.supported = new Set(['audio/webm;codecs=opus'])
})
afterEach(() => vi.useRealTimers())

test('escolhe o primeiro formato suportado (Safari cai em MP4)', () => {
  expect(pickMime((m) => m === 'audio/mp4')).toBe('audio/mp4')
  expect(pickMime(() => false)).toBeNull()
})

test('grava mono a ~24 kbps e devolve blob, formato e duração', async () => {
  const d = deps()
  const r = await startRecording(d)
  expect(d.getUserMedia).toHaveBeenCalledWith({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
  expect(FakeRecorder.last.options).toEqual({ mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: AUDIO_BITS_PER_SECOND })
  clock = 65_400
  const out = await r.stop()
  expect(out.mime).toBe('audio/webm;codecs=opus')
  expect(out.durationSec).toBe(65)
  expect(out.blob.size).toBe(3)
  expect(track.stop).toHaveBeenCalled()
})

test('microfone negado gera mensagem legível', async () => {
  await expect(startRecording(deps({ getUserMedia: vi.fn().mockRejectedValue(new Error('denied')) }))).rejects.toThrow(/microfone/)
})

test('navegador sem suporte a gravação gera erro legível', async () => {
  FakeRecorder.supported = new Set()
  await expect(startRecording(deps())).rejects.toBeInstanceOf(RecorderError)
})

test('para sozinho no limite de 12 min e a duração nunca passa disso', async () => {
  const r = await startRecording(deps())
  clock = (MAX_SECONDS + 30) * 1000
  vi.advanceTimersByTime(MAX_SECONDS * 1000)
  expect(FakeRecorder.last.state).toBe('inactive')
  expect((await r.stop()).durationSec).toBe(MAX_SECONDS)
})
```

`src/features/simulations/recordingQueue.test.ts`:
```ts
import { createMemoryStore, createRecordingQueue, type PendingRecording } from './recordingQueue'

const rec = (id: string) => ({ simulationId: id, blob: new Blob(['x']), mime: 'audio/webm', durationSec: 60 })

test('guarda a gravação e reenvia quando a rede volta', async () => {
  const upload = vi.fn<(r: PendingRecording) => Promise<void>>().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
  const q = createRecordingQueue(createMemoryStore(), upload)
  await q.enqueue(rec('sim-1'))
  expect(await q.count()).toBe(1)
  expect(await q.flush()).toEqual({ sent: 0, failed: 1 })
  expect(await q.count()).toBe(1)
  expect(await q.flush()).toEqual({ sent: 1, failed: 0 })
  expect(await q.count()).toBe(0)
})

test('duas rodadas ao mesmo tempo enviam uma vez só', async () => {
  const upload = vi.fn().mockResolvedValue(undefined)
  const q = createRecordingQueue(createMemoryStore(), upload)
  await q.enqueue(rec('sim-1'))
  const [a, b] = await Promise.all([q.flush(), q.flush()])
  expect(upload).toHaveBeenCalledTimes(1)
  expect(a).toEqual(b)
})

test('uma falha não trava as outras gravações', async () => {
  const upload = vi.fn(async (r: PendingRecording) => { if (r.simulationId === 'sim-1') throw new Error('x') })
  const q = createRecordingQueue(createMemoryStore(), upload)
  await q.enqueue(rec('sim-1'))
  await q.enqueue(rec('sim-2'))
  expect(await q.flush()).toEqual({ sent: 1, failed: 1 })
  expect(await q.count()).toBe(1)
})

test('enfileirar de novo o mesmo simulado substitui o item', async () => {
  const q = createRecordingQueue(createMemoryStore(), vi.fn())
  await q.enqueue(rec('sim-1'))
  await q.enqueue(rec('sim-1'))
  expect(await q.count()).toBe(1)
})
```


- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/features/simulations/recorder.test.ts src/features/simulations/recordingQueue.test.ts 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import "./recorder"` / `"./recordingQueue"`.

- [ ] **Step 4: Implementar**


`src/features/simulations/recorder.ts`:
```ts
export const MAX_SECONDS = 720
export const AUDIO_BITS_PER_SECOND = 24_000

// iOS/Safari só grava em MP4; Chrome e Firefox preferem WebM/Ogg com Opus.
const CANDIDATES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm']

export function pickMime(isSupported: (mime: string) => boolean): string | null {
  return CANDIDATES.find(isSupported) ?? null
}

export class RecorderError extends Error {}

export interface RecordingResult { blob: Blob; mime: string; durationSec: number }
export interface Recorder { mime: string; stop(): Promise<RecordingResult> }

export interface RecorderDeps {
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>
  MediaRecorder: typeof MediaRecorder
  now: () => number
}

export const browserDeps = (): RecorderDeps => ({
  getUserMedia: (c) => navigator.mediaDevices.getUserMedia(c),
  MediaRecorder,
  now: () => Date.now(),
})

/** RF-76b: áudio mono, ~24 kbps, no máximo 12 min. */
export async function startRecording(deps: RecorderDeps = browserDeps()): Promise<Recorder> {
  const mime = pickMime((m) => deps.MediaRecorder.isTypeSupported(m))
  if (!mime) throw new RecorderError('Este navegador não grava áudio. Use o Chrome ou o Safari atualizado.')

  let stream: MediaStream
  try {
    stream = await deps.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
  } catch {
    throw new RecorderError('Não foi possível usar o microfone. Libere a permissão e tente de novo.')
  }

  const rec = new deps.MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: AUDIO_BITS_PER_SECOND })
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
  const stopped = new Promise<void>((resolve) => { rec.onstop = () => resolve() })
  const startedAt = deps.now()
  rec.start(1000)
  const limit = setTimeout(() => { if (rec.state !== 'inactive') rec.stop() }, MAX_SECONDS * 1000)

  return {
    mime,
    async stop() {
      clearTimeout(limit)
      if (rec.state !== 'inactive') rec.stop()
      await stopped
      stream.getTracks().forEach((t) => t.stop())
      const durationSec = Math.min(MAX_SECONDS, Math.round((deps.now() - startedAt) / 1000))
      return { blob: new Blob(chunks, { type: mime }), mime, durationSec }
    },
  }
}
```

`src/features/simulations/recordingQueue.ts`:
```ts
/** Armazenamento chave-valor mínimo (IndexedDB em produção, memória nos testes). */
export interface KV {
  get<T>(key: string): Promise<T | undefined>
  set(key: string, value: unknown): Promise<void>
  del(key: string): Promise<void>
  keys(): Promise<string[]>
}

export interface PendingRecording { simulationId: string; blob: Blob; mime: string; durationSec: number; queuedAt: number }
export type Uploader = (r: PendingRecording) => Promise<void>

export function createMemoryStore(): KV {
  const m = new Map<string, unknown>()
  return {
    get: async <T,>(k: string) => m.get(k) as T | undefined,
    set: async (k, v) => { m.set(k, v) },
    del: async (k) => { m.delete(k) },
    keys: async () => [...m.keys()],
  }
}

const PREFIX = 'rec:'

/** RF-76g: áudio que não subiu fica no aparelho e é reenviado depois. Um item por simulado. */
export function createRecordingQueue(store: KV, upload: Uploader) {
  let running: Promise<{ sent: number; failed: number }> | null = null
  const pendingKeys = async () => (await store.keys()).filter((k) => k.startsWith(PREFIX))

  async function drain() {
    let sent = 0
    let failed = 0
    for (const key of await pendingKeys()) {
      const item = await store.get<PendingRecording>(key)
      if (!item) continue
      try {
        await upload(item)
        await store.del(key)
        sent++
      } catch {
        failed++
      }
    }
    return { sent, failed }
  }

  return {
    async enqueue(r: Omit<PendingRecording, 'queuedAt'>): Promise<void> {
      await store.set(PREFIX + r.simulationId, { ...r, queuedAt: Date.now() })
    },
    async count(): Promise<number> {
      return (await pendingKeys()).length
    },
    /** Chamadas simultâneas (evento `online` + abertura do app) compartilham a mesma rodada. */
    flush(): Promise<{ sent: number; failed: number }> {
      running ??= drain().finally(() => { running = null })
      return running
    },
  }
}
```

`src/features/simulations/idbStore.ts`:
```ts
import { createStore, del, get, keys, set } from 'idb-keyval'
import type { KV } from './recordingQueue'

const store = createStore('trilha', 'recordings')

export const idbStore: KV = {
  get: <T,>(k: string) => get<T>(k, store),
  set: (k, v) => set(k, v, store),
  del: (k) => del(k, store),
  keys: async () => (await keys(store)).map(String),
}
```


- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/features/simulations/recorder.test.ts src/features/simulations/recordingQueue.test.ts 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/features/simulations/recorder.ts src/features/simulations/recorder.test.ts src/features/simulations/recordingQueue.ts src/features/simulations/recordingQueue.test.ts src/features/simulations/idbStore.ts
git commit -m "feat(simulations): audio recorder and offline upload queue"
```

---

### Task 23: Hooks de dados (Supabase + TanStack Query) — **[W3]**

**Files:**
- Create: `src/test/fakeSupabase.ts`, `src/features/simulations/facts.ts`, `src/features/simulations/recordingSync.ts`
- Modify: `src/features/simulations/hooks.ts` (troca o esqueleto pela implementação), `src/features/progress/hooks.ts` (`useNodeStates` passa a usar os simulados reais), `src/features/progress/hooks.test.tsx` (1 teste novo)
- Test: `src/features/simulations/hooks.test.tsx`

**Interfaces:**
- Consumes: `supabase`; tudo da Task 20 (tipos, domínio, mocks); `create_simulation`, `v_simulation_results` (Task 21); `createRecordingQueue`, `idbStore` (Task 22); `simulationFactsOf`, `buildTrailState`, `NO_SIMULATIONS`.
- Produces: os 17 hooks do contrato da Task 20 com os mesmos nomes e tipos; `fetchSimulationFacts()` e `FACTS_KEY` (`facts.ts`); `uploadRecording(r)` e `recordingQueue` (`recordingSync.ts`); `createFakeSupabase()` (`src/test/fakeSupabase.ts`). Query keys internas: `['simulations']`, `['simulation', id]`, `['simulation_scores', id]`, `['scenario_bank']`, `['pending_recordings']`, `['sim_facts']`.
- Mensagens de erro em pt-BR entregues às telas: "Você já enviou a sua ficha.", "O simulado ainda não terminou.", "Este simulado já mudou de etapa. Atualize a tela.", "Você não pode alterar este simulado.", "Só o mentor edita o banco de cenários.".

- [ ] **Step 1: Supabase falso e testes**

`src/test/fakeSupabase.ts` (fila de resultados por tabela; registra cada chamada):

```ts
export type Result = { data: unknown; error: unknown; count?: number | null }
export interface Call { table: string; method: string; args: unknown[] }

const BUILDER_METHODS = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'is', 'order', 'limit', 'maybeSingle', 'single']

/**
 * Supabase falso para testes de hooks. Cada `await` de uma consulta consome o próximo item de
 * `results[<tabela>]` (ou `results['rpc:<função>']`, `results['storage:upload']`, `results['storage:signed']`);
 * sem item, devolve `{ data: [], error: null }`. Toda chamada encadeada fica registrada em `calls`.
 */
export function createFakeSupabase() {
  const results: Record<string, Result[]> = {}
  const calls: Call[] = []
  const next = (key: string, fallback: Result): Result => results[key]?.shift() ?? fallback

  const from = vi.fn((table: string) => {
    const b: Record<string, unknown> = {}
    for (const m of BUILDER_METHODS) {
      b[m] = (...args: unknown[]) => { calls.push({ table, method: m, args }); return b }
    }
    b.then = (ok: (r: Result) => unknown, fail: (e: unknown) => unknown) =>
      Promise.resolve(next(table, { data: [], error: null })).then(ok, fail)
    return b
  })
  const rpc = vi.fn(async (fn: string, args: unknown) => {
    calls.push({ table: `rpc:${fn}`, method: 'rpc', args: [args] })
    return next(`rpc:${fn}`, { data: null, error: null })
  })
  const upload = vi.fn(async (path: string, _blob: Blob, options: unknown) => {
    calls.push({ table: 'storage:recordings', method: 'upload', args: [path, options] })
    return next('storage:upload', { data: { path }, error: null })
  })
  const createSignedUrl = vi.fn(async (path: string) =>
    next('storage:signed', { data: { signedUrl: `https://signed.test/${path}` }, error: null }))
  const getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'me' } } } })
  const storage = { from: vi.fn(() => ({ upload, createSignedUrl })) }

  return {
    supabase: { from, rpc, storage, auth: { getSession } },
    results,
    calls,
    reset() {
      calls.length = 0
      for (const k of Object.keys(results)) delete results[k]
    },
  }
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>
```



`src/features/simulations/hooks.test.tsx`:
```tsx
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { FakeSupabase } from '@/test/fakeSupabase'

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('@/test/fakeSupabase')
  const fake = createFakeSupabase()
  return { supabase: fake.supabase, fake }
})
vi.mock('./idbStore', async () => {
  const { createMemoryStore } = await import('./recordingQueue')
  return { idbStore: createMemoryStore() }
})

const { fake } = (await import('@/lib/supabase')) as unknown as { fake: FakeSupabase }
const { results, calls } = fake

import {
  useAdvanceSimulation, useCreateSimulation, usePendingRecordings, useRecentObjectives, useSaveReelItem, useScenarioBank,
  useSimulation, useSimulations, useSubmitScore, useUploadRecording,
} from './hooks'

const good = { abertura: 4, tom: 4, perguntas: 4, escuta: 4, objecao: 4, fechamento: 4 }
const simRow = (over: Record<string, unknown> = {}) => ({
  id: 's1', mode: 'treino', difficulty: 'medio', phase: 'f2', status: 'aguardando_notas', is_boss: false,
  created_at: '2026-09-29T15:00:00Z', started_at: null, revealed_at: null,
  simulation_scores: [{ rater_id: 'me' }], simulation_recordings: { simulation_id: 's1' }, ...over,
})

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => fake.reset())

test('useSimulations marca minha ficha, a gravação e a nota oficial', async () => {
  results.simulations = [{ data: [simRow(), simRow({ id: 's2', simulation_scores: [], simulation_recordings: null })], error: null }]
  results.v_simulation_official = [{ data: [{ simulation_id: 's1', total_official: '21.5' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSimulations(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data![0]).toMatchObject({ id: 's1', myScoreDone: true, hasRecording: true, official: 21.5, isBoss: false })
  expect(result.current.data![1]).toMatchObject({ id: 's2', myScoreDone: false, hasRecording: false, official: null })
})

test('useSimulation devolve cenário nulo quando o RLS o esconde (RF-75)', async () => {
  results.simulations = [{ data: simRow({ mode: 'surpresa', status: 'em_andamento' }), error: null }]
  results.simulation_scenarios = [{ data: null, error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSimulation('s1'), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toBeDefined())
  expect(result.current.data!.scenario).toBeNull()
  expect(result.current.data!.summary.status).toBe('em_andamento')
})

test('useSimulation resolve rótulos do cenário e o texto das cartas', async () => {
  results.simulations = [{ data: simRow(), error: null }]
  results.simulation_scenarios = [{ data: { objective_id: 'obj-06', profile_id: 'prof-01', product_id: 'prod-01', complication_ids: ['comp-01'] }, error: null }]
  results.simulation_cards = [{ data: [
    { position: 0, kind: 'complicacao', ref_id: 'comp-01', shown_at_sec: 62 },
    { position: 1, kind: 'questionamento', ref_id: 'card-01', shown_at_sec: null },
  ], error: null }]
  results.reel_items = [{ data: [
    { id: 'obj-06', label: 'Objeção de preço', mentor_role: '"Tá caro"', student_goal: 'Reancorar valor', client_line: null },
    { id: 'prof-01', label: 'Apressado', mentor_role: null, student_goal: null, client_line: null },
    { id: 'prod-01', label: 'Plano de internet', mentor_role: null, student_goal: null, client_line: null },
    { id: 'comp-01', label: 'Tá caro', mentor_role: null, student_goal: null, client_line: 'Olha, achei caro.' },
  ], error: null }]
  results.challenge_cards = [{ data: [{ id: 'card-01', text: 'Isso funciona mesmo?' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSimulation('s1'), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toBeDefined())
  expect(result.current.data!.scenario).toMatchObject({ objective: { label: 'Objeção de preço', studentGoal: 'Reancorar valor' }, profile: { label: 'Apressado' } })
  expect(result.current.data!.scenario!.complications.map((c) => c.label)).toEqual(['Tá caro'])
  expect(result.current.data!.cards).toEqual([
    { position: 0, kind: 'complicacao', refId: 'comp-01', shownAtSec: 62, text: 'Olha, achei caro.' },
    { position: 1, kind: 'questionamento', refId: 'card-01', shownAtSec: null, text: 'Isso funciona mesmo?' },
  ])
})

test('criar simulado usa a RPC atômica e numera as cartas', async () => {
  results['rpc:create_simulation'] = [{ data: 'novo-id', error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useCreateSimulation(), { wrapper: Wrapper })
  let id = ''
  await act(async () => {
    id = await result.current.mutateAsync({
      mode: 'treino', difficulty: 'medio', phase: 'f2', isBoss: false,
      draw: { objectiveId: 'obj-06', profileId: 'prof-01', productId: 'prod-01', complicationIds: ['comp-01'] },
      cards: [{ kind: 'questionamento', refId: 'card-01', atSec: 40 }, { kind: 'complicacao', refId: 'comp-01', atSec: 120 }],
    })
  })
  expect(id).toBe('novo-id')
  expect(calls.find((c) => c.method === 'rpc')!.args[0]).toEqual({
    p_mode: 'treino', p_difficulty: 'medio', p_phase: 'f2', p_is_boss: false,
    p_objective: 'obj-06', p_profile: 'prof-01', p_product: 'prod-01', p_complications: ['comp-01'],
    p_cards: [{ position: 0, kind: 'questionamento', ref_id: 'card-01' }, { position: 1, kind: 'complicacao', ref_id: 'comp-01' }],
  })
})

test('avançar simulado sem permissão (0 linhas) dá erro legível; transição inválida também', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useAdvanceSimulation(), { wrapper: Wrapper })
  results.simulations = [{ data: [], error: null }]
  await act(async () => {
    await expect(result.current.mutateAsync({ id: 's1', to: 'aguardando_notas' })).rejects.toThrow('Você não pode alterar este simulado.')
  })
  results.simulations = [{ data: null, error: { message: 'invalid_status_transition', code: 'P0001' } }]
  await act(async () => {
    await expect(result.current.mutateAsync({ id: 's1', to: 'em_andamento' })).rejects.toThrow(/já mudou de etapa/)
  })
})

test('ficha inválida não chega ao banco; ficha duplicada tem mensagem clara (Review Focus 4)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSubmitScore(), { wrapper: Wrapper })
  await act(async () => {
    await expect(result.current.mutateAsync({ simulationId: 's1', scores: { ...good, tom: 6 }, good: '', improve: '' })).rejects.toThrow(/1 a 5/)
  })
  expect(calls.some((c) => c.method === 'insert')).toBe(false)
  results.simulation_scores = [{ data: null, error: { message: 'duplicate key', code: '23505' } }]
  await act(async () => {
    await expect(result.current.mutateAsync({ simulationId: 's1', scores: good, good: ' ok ', improve: ' melhorar ' })).rejects.toThrow('Você já enviou a sua ficha.')
  })
  expect(calls.find((c) => c.method === 'insert')!.args[0]).toMatchObject({ simulation_id: 's1', good: 'ok', improve: 'melhorar', abertura: 4 })
})

test('upload sobe o áudio na pasta do simulado e registra a linha', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadRecording(), { wrapper: Wrapper })
  let outcome = ''
  await act(async () => { outcome = await result.current.mutateAsync({ simulationId: 's1', blob: new Blob(['abc']), mime: 'audio/webm;codecs=opus', durationSec: 300 }) })
  expect(outcome).toBe('uploaded')
  expect(calls).toContainEqual({ table: 'storage:recordings', method: 'upload', args: ['s1/audio.webm', { contentType: 'audio/webm', upsert: false }] })
  const row = calls.find((c) => c.table === 'simulation_recordings' && c.method === 'upsert')!
  expect(row.args[0]).toEqual({ simulation_id: 's1', file_path: 's1/audio.webm', mime: 'audio/webm;codecs=opus', duration_sec: 300, size_bytes: 3 })
})

test('upload que falha vira "pendente" e é reenviado depois (RF-76g); arquivo já existente não é erro', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadRecording(), { wrapper: Wrapper })
  results['storage:upload'] = [{ data: null, error: { message: 'Failed to fetch' } }]
  let outcome = ''
  await act(async () => { outcome = await result.current.mutateAsync({ simulationId: 's9', blob: new Blob(['x']), mime: 'audio/mp4', durationSec: 60 }) })
  expect(outcome).toBe('queued')

  const pending = renderHook(() => usePendingRecordings(), { wrapper: Wrapper })
  await waitFor(() => expect(pending.result.current.pending).toBe(0)) // o efeito de montagem já reenviou
  expect(calls.filter((c) => c.method === 'upload').map((c) => c.args[0])).toEqual(['s9/audio.m4a', 's9/audio.m4a'])
})

test('reenvio trata "já existe" no Storage como sucesso', async () => {
  const { Wrapper } = setup()
  results['storage:upload'] = [{ data: null, error: { message: 'The resource already exists' } }]
  const { result } = renderHook(() => useUploadRecording(), { wrapper: Wrapper })
  let outcome = ''
  await act(async () => { outcome = await result.current.mutateAsync({ simulationId: 's2', blob: new Blob(['x']), mime: 'audio/webm', durationSec: 10 }) })
  expect(outcome).toBe('uploaded')
})

test('useRecentObjectives devolve os 3 mais recentes visíveis, do mais antigo ao mais novo (RF-72)', async () => {
  const row = (o: string | null) => ({ created_at: 'x', simulation_scenarios: o ? { objective_id: o } : null })
  results.simulations = [{ data: [row('obj-05'), row(null), row('obj-04'), row('obj-03'), row('obj-02')], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useRecentObjectives(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toEqual(['obj-03', 'obj-04', 'obj-05']))
})

test('useScenarioBank traz inativos também', async () => {
  results.reel_items = [{ data: [{ id: 'obj-03', reel: 1, label: 'Follow-up', mentor_role: 'Lead', student_goal: 'Sim ou não', client_line: null, is_none: false, original: false, active: false }], error: null }]
  results.challenge_cards = [{ data: [{ id: 'card-01', text: 'Tem nota fiscal?', active: true }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useScenarioBank(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toBeDefined())
  expect(result.current.data!.items[0]).toMatchObject({ id: 'obj-03', active: false, mentorRole: 'Lead', original: false, isNone: false })
})

test('novo item do rolo ganha o próximo id e nunca é "original"; item inválido é recusado', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveReelItem(), { wrapper: Wrapper })
  await act(async () => { await expect(result.current.mutateAsync({ reel: 1, label: 'Follow-up' })).rejects.toThrow(/papel do mentor/) })
  results.reel_items = [{ data: [{ id: 'obj-01' }, { id: 'obj-30' }], error: null }, { data: null, error: null }]
  await act(async () => { await result.current.mutateAsync({ reel: 1, label: ' Follow-up ', mentorRole: 'Lead que sumiu', studentGoal: 'Obter sim ou não' }) })
  expect(calls.find((c) => c.method === 'insert')!.args[0]).toEqual({
    id: 'obj-31', reel: 1, label: 'Follow-up', mentor_role: 'Lead que sumiu', student_goal: 'Obter sim ou não', client_line: null, original: false, active: true,
  })
})
```


Em `src/features/progress/hooks.test.tsx`, acrescentar no fim do arquivo:
```tsx
test('simulados avaliados alimentam os itens automáticos do portão da Fase 2 (E5)', async () => {
  results.item_progress = [{ data: [], error: null }]
  results.node_overrides = [{ data: [], error: null }]
  results.v_simulation_results = [{ data: [{ objective_id: 'obj-01', phase: 'f2', difficulty: 'medio', total_official: '16.0' }], error: null }]
  results.reel_items = [{ data: [{ id: 'obj-01' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useNodeStates(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data?.gateDone.has('f2.gate.4')).toBe(true))
  expect(result.current.data!.gateDone.has('f2.gate.2')).toBe(true)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/simulations/hooks.test.tsx src/features/progress 2>&1 | tail -15`
Expected: FAIL — `useSimulations: implementado na Task 23` (esqueleto) e, no teste novo de progresso, `f2.gate.4` continua `false`.

- [ ] **Step 3: Fatos de simulados e envio de gravação**


`src/features/simulations/facts.ts`:
```ts
import { supabase } from '@/lib/supabase'
import { simulationFactsOf, type ResultRow } from '@/domain/simulationFacts'
import type { SimulationFacts } from '@/domain/trailState'

export const FACTS_KEY = ['sim_facts'] as const

type Row = { objective_id: string | null; phase: ResultRow['phase']; difficulty: ResultRow['difficulty']; total_official: number | string }

/** Simulados com as duas fichas + ids dos 15 objetivos originais: alimenta `buildTrailState` (RF-40). */
export async function fetchSimulationFacts(): Promise<SimulationFacts> {
  const [results, originals] = await Promise.all([
    supabase.from('v_simulation_results').select('objective_id, phase, difficulty, total_official'),
    supabase.from('reel_items').select('id').eq('reel', 1).eq('original', true),
  ])
  if (results.error) throw results.error
  if (originals.error) throw originals.error
  const rows = (results.data as Row[]).map((r) => ({
    objectiveId: r.objective_id, phase: r.phase, difficulty: r.difficulty, totalOfficial: Number(r.total_official),
  }))
  return simulationFactsOf(rows, (originals.data as { id: string }[]).map((r) => r.id))
}
```

`src/features/simulations/recordingSync.ts`:
```ts
import { supabase } from '@/lib/supabase'
import { idbStore } from './idbStore'
import { createRecordingQueue, type PendingRecording } from './recordingQueue'

const extensionOf = (mime: string) => (mime.startsWith('audio/mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm')

/** Sobe o áudio e registra a linha. Idempotente: repetir o envio de um item já enviado não falha. */
export async function uploadRecording(r: PendingRecording): Promise<void> {
  const path = `${r.simulationId}/audio.${extensionOf(r.mime)}`
  const { error } = await supabase.storage.from('recordings').upload(path, r.blob, { contentType: r.mime.split(';')[0], upsert: false })
  if (error && !/already exists|duplicate/i.test(error.message)) throw error
  const { error: rowError } = await supabase.from('simulation_recordings').upsert(
    { simulation_id: r.simulationId, file_path: path, mime: r.mime, duration_sec: Math.min(720, r.durationSec), size_bytes: r.blob.size },
    { onConflict: 'simulation_id', ignoreDuplicates: true },
  )
  if (rowError) throw rowError
}

export const recordingQueue = createRecordingQueue(idbStore, uploadRecording)
```


- [ ] **Step 4: Implementar os hooks**

`src/features/simulations/hooks.ts` (substitui o arquivo inteiro):

```ts
import { useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PhaseId } from '@/content/types'
import type { Difficulty } from '@/domain/roulette'
import { nextChallengeId, nextReelId, validateChallengeText, validateReelItem } from '@/domain/scenarioBank'
import { isValidScores, type Scores } from '@/domain/scoring'
import { FACTS_KEY } from './facts'
import { recordingQueue, uploadRecording } from './recordingSync'
import type {
  AdvanceSimulationVars, BankData, BankItem, CardShownVars, CreateSimulationVars, KeepRecordingVars, PendingRecordings,
  ReelDetail, SaveChallengeVars, SaveReelItemVars, Scenario, ScoreSheet, SetActiveVars, SimCard, SimMode, SimStatus,
  SimulationDetail, SimulationSummary, SubmitScoreVars, UploadOutcome, UploadRecordingVars,
} from './types'

const SIMS = ['simulations'] as const
const SIM = (id: string) => ['simulation', id] as const
const SCORES = (id: string) => ['simulation_scores', id] as const
const BANK = ['scenario_bank'] as const
const PENDING = ['pending_recordings'] as const

type DbError = { message: string; code?: string }

/** Lança um erro legível: `friendly` mapeia código SQL ou trecho da mensagem para texto em pt-BR. */
function fail(error: DbError, friendly: Record<string, string> = {}): never {
  const key = Object.keys(friendly).find((k) => error.code === k || error.message.includes(k))
  throw new Error(key ? friendly[key] : error.message)
}

async function myId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sessão expirada. Entre de novo.')
  return session.user.id
}

const SIM_COLUMNS =
  'id, mode, difficulty, phase, status, is_boss, created_at, started_at, revealed_at, simulation_scores(rater_id), simulation_recordings(simulation_id)'

interface SimRow {
  id: string; mode: SimMode; difficulty: Difficulty; phase: PhaseId; status: SimStatus; is_boss: boolean
  created_at: string; started_at: string | null; revealed_at: string | null
  simulation_scores: { rater_id: string }[]
  simulation_recordings: { simulation_id: string } | { simulation_id: string }[] | null
}

function toSummary(r: SimRow, me: string, official: number | null): SimulationSummary {
  const rec = r.simulation_recordings
  return {
    id: r.id, mode: r.mode, difficulty: r.difficulty, phase: r.phase, status: r.status, isBoss: r.is_boss,
    createdAt: r.created_at, startedAt: r.started_at, revealedAt: r.revealed_at,
    myScoreDone: r.simulation_scores.some((s) => s.rater_id === me),
    official,
    hasRecording: Array.isArray(rec) ? rec.length > 0 : rec !== null,
  }
}

export function useSimulations() {
  return useQuery({
    queryKey: SIMS,
    queryFn: async (): Promise<SimulationSummary[]> => {
      const me = await myId()
      const [sims, official] = await Promise.all([
        supabase.from('simulations').select(SIM_COLUMNS).order('created_at', { ascending: false }),
        supabase.from('v_simulation_official').select('simulation_id, total_official'),
      ])
      if (sims.error) throw sims.error
      if (official.error) throw official.error
      const totals = new Map((official.data as { simulation_id: string; total_official: number | string }[])
        .map((o) => [o.simulation_id, Number(o.total_official)]))
      return (sims.data as unknown as SimRow[]).map((r) => toSummary(r, me, totals.get(r.id) ?? null))
    },
  })
}

interface ReelRow { id: string; label: string; mentor_role: string | null; student_goal: string | null; client_line: string | null }
const toReel = (r: ReelRow): ReelDetail => ({ id: r.id, label: r.label, mentorRole: r.mentor_role, studentGoal: r.student_goal, clientLine: r.client_line })

async function fetchDetail(id: string): Promise<SimulationDetail> {
  const me = await myId()
  const [sim, official, scen, cards, rec] = await Promise.all([
    supabase.from('simulations').select(SIM_COLUMNS).eq('id', id).maybeSingle(),
    supabase.from('v_simulation_official').select('total_official').eq('simulation_id', id).maybeSingle(),
    supabase.from('simulation_scenarios').select('objective_id, profile_id, product_id, complication_ids').eq('simulation_id', id).maybeSingle(),
    supabase.from('simulation_cards').select('position, kind, ref_id, shown_at_sec').eq('simulation_id', id).order('position'),
    supabase.from('simulation_recordings').select('file_path, mime, duration_sec, size_bytes, keep, delete_after').eq('simulation_id', id).maybeSingle(),
  ])
  for (const r of [sim, official, scen, cards, rec]) if (r.error) throw r.error
  if (!sim.data) throw new Error('Simulado não encontrado.')

  type CardRow = { position: number; kind: SimCard['kind']; ref_id: string; shown_at_sec: number | null }
  const cardRows = cards.data as CardRow[]
  const scenario = scen.data as { objective_id: string; profile_id: string; product_id: string; complication_ids: string[] } | null
  const reelIds = [
    ...(scenario ? [scenario.objective_id, scenario.profile_id, scenario.product_id, ...scenario.complication_ids] : []),
    ...cardRows.filter((c) => c.kind === 'complicacao').map((c) => c.ref_id),
  ]
  const challengeIds = cardRows.filter((c) => c.kind === 'questionamento').map((c) => c.ref_id)
  const [reels, challenges] = await Promise.all([
    supabase.from('reel_items').select('id, label, mentor_role, student_goal, client_line').in('id', reelIds),
    supabase.from('challenge_cards').select('id, text').in('id', challengeIds),
  ])
  if (reels.error) throw reels.error
  if (challenges.error) throw challenges.error

  const reelById = new Map((reels.data as ReelRow[]).map((r) => [r.id, toReel(r)]))
  const reel = (rid: string): ReelDetail => reelById.get(rid) ?? { id: rid, label: rid, mentorRole: null, studentGoal: null, clientLine: null }
  const challengeText = new Map((challenges.data as { id: string; text: string }[]).map((c) => [c.id, c.text]))

  const total = (official.data as { total_official: number | string } | null)?.total_official
  const r = rec.data as { file_path: string; mime: string; duration_sec: number; size_bytes: number; keep: boolean; delete_after: string | null } | null
  return {
    summary: toSummary(sim.data as unknown as SimRow, me, total === undefined ? null : Number(total)),
    scenario: scenario && ({
      objective: reel(scenario.objective_id), profile: reel(scenario.profile_id), product: reel(scenario.product_id),
      complications: scenario.complication_ids.map(reel),
    } satisfies Scenario),
    cards: cardRows.map((c) => ({
      position: c.position, kind: c.kind, refId: c.ref_id, shownAtSec: c.shown_at_sec,
      text: c.kind === 'complicacao' ? (reel(c.ref_id).clientLine ?? reel(c.ref_id).label) : (challengeText.get(c.ref_id) ?? ''),
    })),
    recording: r && { filePath: r.file_path, mime: r.mime, durationSec: r.duration_sec, sizeBytes: r.size_bytes, keep: r.keep, deleteAfter: r.delete_after },
  }
}

export function useSimulation(id: string) {
  return useQuery({ queryKey: SIM(id), queryFn: () => fetchDetail(id) })
}

export function useScores(simulationId: string) {
  return useQuery({
    queryKey: SCORES(simulationId),
    queryFn: async (): Promise<ScoreSheet[]> => {
      const me = await myId()
      const { data, error } = await supabase.from('simulation_scores')
        .select('rater_id, abertura, tom, perguntas, escuta, objecao, fechamento, good, improve, submitted_at, profiles(role)')
        .eq('simulation_id', simulationId)
      if (error) throw error
      type Row = Scores & { rater_id: string; good: string; improve: string; submitted_at: string; profiles: { role: 'aluna' | 'mentor' } | null }
      return (data as unknown as Row[]).map((r) => ({
        raterRole: r.profiles?.role ?? 'aluna', mine: r.rater_id === me, good: r.good, improve: r.improve, submittedAt: r.submitted_at,
        scores: { abertura: r.abertura, tom: r.tom, perguntas: r.perguntas, escuta: r.escuta, objecao: r.objecao, fechamento: r.fechamento },
      }))
    },
  })
}

export function useScenarioBank() {
  return useQuery({
    queryKey: BANK,
    queryFn: async (): Promise<BankData> => {
      const [items, challenges] = await Promise.all([
        supabase.from('reel_items').select('id, reel, label, mentor_role, student_goal, client_line, is_none, original, active').order('id'),
        supabase.from('challenge_cards').select('id, text, active').order('id'),
      ])
      if (items.error) throw items.error
      if (challenges.error) throw challenges.error
      type Row = { id: string; reel: 1 | 2 | 3 | 4; label: string; mentor_role: string | null; student_goal: string | null; client_line: string | null; is_none: boolean; original: boolean; active: boolean }
      return {
        items: (items.data as Row[]).map((r): BankItem => ({
          id: r.id, reel: r.reel, label: r.label, active: r.active, isNone: r.is_none, original: r.original,
          mentorRole: r.mentor_role, studentGoal: r.student_goal, clientLine: r.client_line,
        })),
        challenges: challenges.data as { id: string; text: string; active: boolean }[],
      }
    },
  })
}

/** Objetivos dos últimos simulados que o usuário pode ver, do mais antigo para o mais novo (RF-72). */
export function useRecentObjectives() {
  return useQuery({
    queryKey: [...SIMS, 'recent_objectives'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('simulations')
        .select('created_at, simulation_scenarios(objective_id)').order('created_at', { ascending: false }).limit(6)
      if (error) throw error
      type Row = { simulation_scenarios: { objective_id: string } | { objective_id: string }[] | null }
      const ids = (data as unknown as Row[]).flatMap((r) => {
        const s = Array.isArray(r.simulation_scenarios) ? r.simulation_scenarios[0] : r.simulation_scenarios
        return s ? [s.objective_id] : []
      })
      return ids.slice(0, 3).reverse()
    },
  })
}

export function useRecordingUrl(filePath: string | null) {
  return useQuery({
    queryKey: ['recording_url', filePath],
    enabled: filePath !== null,
    staleTime: 50 * 60_000,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.storage.from('recordings').createSignedUrl(filePath!, 3600)
      if (error) throw error
      return data.signedUrl
    },
  })
}

/** RF-76g: reenvia sozinho ao abrir o app e quando a rede volta. */
export function usePendingRecordings(): PendingRecordings {
  const qc = useQueryClient()
  const pending = useQuery({ queryKey: PENDING, queryFn: () => recordingQueue.count(), initialData: 0 })
  const flush = useCallback(async () => {
    const { sent } = await recordingQueue.flush()
    await qc.invalidateQueries({ queryKey: PENDING })
    if (sent > 0) await qc.invalidateQueries({ queryKey: SIMS })
  }, [qc])
  useEffect(() => {
    void flush()
    window.addEventListener('online', flush)
    return () => window.removeEventListener('online', flush)
  }, [flush])
  return { pending: pending.data, flush }
}

export function useCreateSimulation() {
  const qc = useQueryClient()
  return useMutation<string, Error, CreateSimulationVars>({
    mutationFn: async (v) => {
      const { data, error } = await supabase.rpc('create_simulation', {
        p_mode: v.mode, p_difficulty: v.difficulty, p_phase: v.phase, p_is_boss: v.isBoss,
        p_objective: v.draw.objectiveId, p_profile: v.draw.profileId, p_product: v.draw.productId,
        p_complications: v.draw.complicationIds,
        p_cards: v.cards.map((c, position) => ({ position, kind: c.kind, ref_id: c.refId })),
      })
      if (error) fail(error, { '42501': 'Você não tem permissão para sortear este tipo de simulado.' })
      return data as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SIMS }),
  })
}

export function useAdvanceSimulation() {
  const qc = useQueryClient()
  return useMutation<void, Error, AdvanceSimulationVars>({
    mutationFn: async ({ id, to }) => {
      const { data, error } = await supabase.from('simulations').update({ status: to }).eq('id', id).select('id')
      if (error) fail(error, { invalid_status_transition: 'Este simulado já mudou de etapa. Atualize a tela.' })
      if (!data || data.length === 0) throw new Error('Você não pode alterar este simulado.')
    },
    onSettled: (_d, _e, v) => Promise.all([qc.invalidateQueries({ queryKey: SIMS }), qc.invalidateQueries({ queryKey: SIM(v.id) })]),
  })
}

export function useSubmitScore() {
  const qc = useQueryClient()
  return useMutation<void, Error, SubmitScoreVars>({
    mutationFn: async ({ simulationId, scores, good, improve }) => {
      if (!isValidScores(scores)) throw new Error('Dê uma nota de 1 a 5 em cada um dos 6 critérios.')
      const { error } = await supabase.from('simulation_scores')
        .insert({ simulation_id: simulationId, ...scores, good: good.trim(), improve: improve.trim() })
      if (error) fail(error, { '23505': 'Você já enviou a sua ficha.', simulation_not_finished: 'O simulado ainda não terminou.' })
    },
    onSettled: (_d, _e, v) => Promise.all([
      qc.invalidateQueries({ queryKey: SCORES(v.simulationId) }), qc.invalidateQueries({ queryKey: SIM(v.simulationId) }),
      qc.invalidateQueries({ queryKey: SIMS }), qc.invalidateQueries({ queryKey: FACTS_KEY }),
    ]),
  })
}

export function useRecordCardShown() {
  return useMutation<void, Error, CardShownVars>({
    mutationFn: async ({ simulationId, position, atSec }) => {
      const { error } = await supabase.from('simulation_cards').update({ shown_at_sec: atSec }).eq('simulation_id', simulationId).eq('position', position)
      if (error) throw error
    },
  })
}

export function useUploadRecording() {
  const qc = useQueryClient()
  return useMutation<UploadOutcome, Error, UploadRecordingVars>({
    mutationFn: async (v) => {
      try {
        await uploadRecording({ ...v, queuedAt: Date.now() })
        return 'uploaded'
      } catch {
        try { await recordingQueue.enqueue(v) } catch { throw new Error('Não foi possível enviar nem guardar a gravação neste aparelho.') }
        return 'queued'
      }
    },
    onSettled: (_d, _e, v) => Promise.all([
      qc.invalidateQueries({ queryKey: SIM(v.simulationId) }), qc.invalidateQueries({ queryKey: SIMS }), qc.invalidateQueries({ queryKey: PENDING }),
    ]),
  })
}

export function useKeepRecording() {
  const qc = useQueryClient()
  return useMutation<void, Error, KeepRecordingVars>({
    mutationFn: async ({ simulationId, keep }) => {
      const { data, error } = await supabase.from('simulation_recordings').update({ keep }).eq('simulation_id', simulationId).select('simulation_id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Só o mentor pode guardar a gravação.')
    },
    onSettled: (_d, _e, v) => qc.invalidateQueries({ queryKey: SIM(v.simulationId) }),
  })
}

const NO_PERMISSION = 'Só o mentor edita o banco de cenários.'

export function useSaveReelItem() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveReelItemVars>({
    mutationFn: async (v) => {
      const problem = validateReelItem(v)
      if (problem) throw new Error(problem)
      const fields = {
        label: v.label.trim(), mentor_role: v.mentorRole?.trim() || null,
        student_goal: v.studentGoal?.trim() || null, client_line: v.clientLine?.trim() || null,
      }
      if (v.id) {
        const { data, error } = await supabase.from('reel_items').update(fields).eq('id', v.id).select('id')
        if (error) throw error
        if (!data || data.length === 0) throw new Error(NO_PERMISSION)
        return
      }
      const { data: rows, error: listError } = await supabase.from('reel_items').select('id').eq('reel', v.reel)
      if (listError) throw listError
      const id = nextReelId(v.reel, (rows as { id: string }[]).map((r) => r.id))
      const { error } = await supabase.from('reel_items').insert({ id, reel: v.reel, ...fields, original: false, active: true })
      if (error) fail(error, { '42501': NO_PERMISSION })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BANK }),
  })
}

export function useSetReelItemActive() {
  const qc = useQueryClient()
  return useMutation<void, Error, SetActiveVars>({
    mutationFn: async ({ id, active }) => {
      const { data, error } = await supabase.from('reel_items').update({ active }).eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error(NO_PERMISSION)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BANK }),
  })
}

export function useSaveChallengeCard() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveChallengeVars>({
    mutationFn: async ({ id, text }) => {
      const problem = validateChallengeText(text)
      if (problem) throw new Error(problem)
      if (id) {
        const { data, error } = await supabase.from('challenge_cards').update({ text: text.trim() }).eq('id', id).select('id')
        if (error) throw error
        if (!data || data.length === 0) throw new Error(NO_PERMISSION)
        return
      }
      const { data: rows, error: listError } = await supabase.from('challenge_cards').select('id')
      if (listError) throw listError
      const { error } = await supabase.from('challenge_cards')
        .insert({ id: nextChallengeId((rows as { id: string }[]).map((r) => r.id)), text: text.trim(), active: true })
      if (error) fail(error, { '42501': NO_PERMISSION })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BANK }),
  })
}

export function useSetChallengeCardActive() {
  const qc = useQueryClient()
  return useMutation<void, Error, SetActiveVars>({
    mutationFn: async ({ id, active }) => {
      const { data, error } = await supabase.from('challenge_cards').update({ active }).eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error(NO_PERMISSION)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BANK }),
  })
}
```


- [ ] **Step 5: `useNodeStates` usa os simulados reais**

Em `src/features/progress/hooks.ts`: acrescentar o import
```ts
import { FACTS_KEY, fetchSimulationFacts } from '@/features/simulations/facts'
```
e trocar o corpo de `useNodeStates` por
```ts
export function useNodeStates(): NodeStatesResult {
  const progress = useProgress()
  const overrides = useQuery({ queryKey: OVERRIDES, queryFn: fetchOverrides })
  // E5: os simulados avaliados alimentam os itens automáticos do portão. Se a consulta falhar, cai em NO_SIMULATIONS.
  const facts = useQuery({ queryKey: FACTS_KEY, queryFn: fetchSimulationFacts, retry: 1 })
  const data = useMemo(
    () => (progress.data && overrides.data ? buildTrailState(progress.data.doneItems, overrides.data, facts.data) : undefined),
    [progress.data, overrides.data, facts.data],
  )
  return { data, isLoading: progress.isLoading || overrides.isLoading || facts.isLoading, error: progress.error ?? overrides.error ?? null }
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/features/simulations src/features/progress 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5 && npm test 2>&1 | tail -6`
Expected: PASS (hooks de simulados, contrato e progresso); `tsc` sem erros; suíte inteira verde (telas antigas mockam `@/features/progress/hooks`, então não são afetadas).

- [ ] **Step 7: Commit**

```bash
git add src/test/fakeSupabase.ts src/features/simulations/facts.ts src/features/simulations/recordingSync.ts src/features/simulations/hooks.ts src/features/simulations/hooks.test.tsx src/features/progress/hooks.ts src/features/progress/hooks.test.tsx
git commit -m "feat(simulations): supabase hooks and real simulation data for trail gates"
```

---

### Task 24: `useTrainingSession` — cronômetro, cartas e gravação — **[W3]**

**Files:**
- Create: `src/features/simulations/useTrainingSession.ts`
- Test: `src/features/simulations/useTrainingSession.test.ts`

**Interfaces:**
- Consumes: `startRecording`, `Recorder`, `RecordingResult` (`./recorder`, Task 22; o teste injeta `begin`); `CardKind` (`./types`, Task 20).
- Produces (**a Task 28 depende destes nomes**): `TrainingCard { position; kind; refId; text; atSec }`, `TrainingPhase = 'ready' | 'recording' | 'finished'`, `TrainingOptions { durationSec; cards; onCardShown?; begin?; vibrate? }`, `TrainingSession { phase; elapsedSec; remainingSec; currentCard; shownCards; error; start(); dismissCard(); finish(): Promise<RecordingResult | null> }`, `useTrainingSession(options): TrainingSession`. A contagem usa `Date.now()` (não conta ticks), então aba congelada não atrasa as cartas; `finish()` é idempotente.

- [ ] **Step 1: Testes**


`src/features/simulations/useTrainingSession.test.ts`:
```ts
import { act, renderHook } from '@testing-library/react'
import type { Recorder } from './recorder'
import { useTrainingSession, type TrainingCard } from './useTrainingSession'

const card = (position: number, atSec: number, kind: TrainingCard['kind'] = 'questionamento'): TrainingCard =>
  ({ position, kind, refId: `c${position}`, text: `fala ${position}`, atSec })

const recorder = () => {
  const stop = vi.fn().mockResolvedValue({ blob: new Blob(['a']), mime: 'audio/webm', durationSec: 300 })
  return { rec: { mime: 'audio/webm', stop } as Recorder, stop }
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

async function startedSession(cards: TrainingCard[], over: Partial<Parameters<typeof useTrainingSession>[0]> = {}) {
  const { rec, stop } = recorder()
  const onCardShown = vi.fn()
  const vibrate = vi.fn()
  const hook = renderHook(() => useTrainingSession({ durationSec: 300, cards, onCardShown, vibrate, begin: async () => rec, ...over }))
  await act(async () => { await hook.result.current.start() })
  return { hook, stop, onCardShown, vibrate }
}

test('começa parado e só grava depois de "Começar"', async () => {
  const { hook } = await startedSession([])
  expect(hook.result.current.phase).toBe('recording')
  expect(hook.result.current.remainingSec).toBe(300)
})

test('revela a carta no momento sorteado, registra o segundo e vibra', async () => {
  const { hook, onCardShown, vibrate } = await startedSession([card(0, 40), card(1, 120)])
  act(() => { vi.advanceTimersByTime(39_000) })
  expect(hook.result.current.currentCard).toBeNull()
  act(() => { vi.advanceTimersByTime(2_000) })
  expect(hook.result.current.currentCard?.position).toBe(0)
  expect(onCardShown).toHaveBeenCalledWith(expect.objectContaining({ position: 0 }), 40)
  expect(vibrate).toHaveBeenCalledTimes(1)
})

test('a carta fica até "respondi" ou até a próxima (RF-76e)', async () => {
  const { hook } = await startedSession([card(0, 40), card(1, 100)])
  act(() => { vi.advanceTimersByTime(60_000) })
  expect(hook.result.current.currentCard?.position).toBe(0)
  act(() => { hook.result.current.dismissCard() })
  expect(hook.result.current.currentCard).toBeNull()
  act(() => { vi.advanceTimersByTime(45_000) })
  expect(hook.result.current.currentCard?.position).toBe(1)
  expect(hook.result.current.shownCards.map((c) => c.position)).toEqual([0, 1])
})

test('cada carta aparece uma vez só', async () => {
  const { hook, onCardShown } = await startedSession([card(0, 30)])
  act(() => { vi.advanceTimersByTime(120_000) })
  expect(onCardShown).toHaveBeenCalledTimes(1)
  expect(hook.result.current.shownCards).toHaveLength(1)
})

test('encerra sozinho quando o tempo acaba e entrega a gravação', async () => {
  const { hook, stop } = await startedSession([], { durationSec: 60 })
  await act(async () => { vi.advanceTimersByTime(61_000) })
  expect(hook.result.current.phase).toBe('finished')
  expect(stop).toHaveBeenCalledTimes(1)
  expect(hook.result.current.remainingSec).toBe(0)
})

test('"Encerrar" é idempotente: para a gravação uma única vez', async () => {
  const { hook, stop } = await startedSession([card(0, 30)])
  let a: unknown, b: unknown
  await act(async () => { [a, b] = await Promise.all([hook.result.current.finish(), hook.result.current.finish()]) })
  expect(stop).toHaveBeenCalledTimes(1)
  expect(a).toBe(b)
})

test('microfone negado: continua parado e mostra o erro', async () => {
  const hook = renderHook(() => useTrainingSession({
    durationSec: 300, cards: [], begin: async () => { throw new Error('Não foi possível usar o microfone.') },
  }))
  await act(async () => { await hook.result.current.start() })
  expect(hook.result.current.phase).toBe('ready')
  expect(hook.result.current.error).toMatch(/microfone/)
  expect(await hook.result.current.finish()).toBeNull()
})

test('a contagem usa o relógio real: aba em segundo plano não atrasa as cartas (Review Focus 3)', async () => {
  const { hook } = await startedSession([card(0, 100)])
  vi.setSystemTime(Date.now() + 130_000) // aba congelada por 130 s
  act(() => { vi.advanceTimersByTime(500) })
  expect(hook.result.current.currentCard?.position).toBe(0)
  expect(hook.result.current.elapsedSec).toBe(130)
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/simulations/useTrainingSession.test.ts 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import "./useTrainingSession"`.

- [ ] **Step 3: Implementar**


`src/features/simulations/useTrainingSession.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CardKind } from './types'
import { startRecording, type Recorder, type RecordingResult } from './recorder'

export interface TrainingCard { position: number; kind: CardKind; refId: string; text: string; atSec: number }
export type TrainingPhase = 'ready' | 'recording' | 'finished'

export interface TrainingOptions {
  durationSec: number
  /** Cartas já agendadas por `planCards`, com o texto resolvido, em ordem de `atSec`. */
  cards: TrainingCard[]
  onCardShown?: (card: TrainingCard, atSec: number) => void
  begin?: () => Promise<Recorder>
  vibrate?: (ms: number) => void
}

export interface TrainingSession {
  phase: TrainingPhase
  elapsedSec: number
  remainingSec: number
  /** Carta na tela: fica até "respondi" (`dismissCard`) ou até a próxima (RF-76e). */
  currentCard: TrainingCard | null
  shownCards: TrainingCard[]
  error: string | null
  start(): Promise<void>
  dismissCard(): void
  /** "Encerrar" ou fim do tempo. Devolve a gravação; `null` se nunca começou. Idempotente. */
  finish(): Promise<RecordingResult | null>
}

const browserVibrate = (ms: number) => { if ('vibrate' in navigator) navigator.vibrate(ms) }

/** RF-76b/c/e/f: cronômetro, gravação e revelação das cartas nos momentos sorteados. */
export function useTrainingSession(opts: TrainingOptions): TrainingSession {
  const { durationSec, cards } = opts
  const optsRef = useRef(opts)
  useEffect(() => { optsRef.current = opts })

  const [phase, setPhase] = useState<TrainingPhase>('ready')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [currentCard, setCurrentCard] = useState<TrainingCard | null>(null)
  const [shownCards, setShownCards] = useState<TrainingCard[]>([])
  const [error, setError] = useState<string | null>(null)

  const recorder = useRef<Recorder | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAt = useRef(0)
  const shown = useRef(0)
  const result = useRef<Promise<RecordingResult | null> | null>(null)

  const finish = useCallback((): Promise<RecordingResult | null> => {
    if (result.current) return result.current
    if (!recorder.current) return Promise.resolve(null)
    if (timer.current) clearInterval(timer.current)
    setPhase('finished')
    result.current = recorder.current.stop()
    return result.current
  }, [])

  const tick = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startedAt.current) / 1000)
    setElapsedSec(Math.min(elapsed, durationSec))
    while (shown.current < cards.length && cards[shown.current].atSec <= elapsed) {
      const card = cards[shown.current++]
      setCurrentCard(card)
      setShownCards((prev) => [...prev, card])
      optsRef.current.onCardShown?.(card, elapsed)
      ;(optsRef.current.vibrate ?? browserVibrate)(200)
    }
    if (elapsed >= durationSec) void finish()
  }, [cards, durationSec, finish])

  const start = useCallback(async () => {
    if (recorder.current) return
    setError(null)
    try {
      recorder.current = await (optsRef.current.begin ?? startRecording)()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível iniciar a gravação.')
      return
    }
    startedAt.current = Date.now()
    setPhase('recording')
    timer.current = setInterval(tick, 500)
  }, [tick])

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  return {
    phase, elapsedSec, remainingSec: Math.max(0, durationSec - elapsedSec), currentCard, shownCards, error,
    start, dismissCard: () => setCurrentCard(null), finish,
  }
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/simulations/useTrainingSession.test.ts 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/useTrainingSession.ts src/features/simulations/useTrainingSession.test.ts
git commit -m "feat(simulations): training session hook with timer, surprise cards and recording"
```

---

### Task 25: ScenarioBankEditor — **[W3]**

**Files:**
- Create: `src/features/simulations/ScenarioBankEditor.tsx`
- Test: `src/features/simulations/ScenarioBankEditor.test.tsx`

**Interfaces:**
- Consumes: `useScenarioBank`, `useSaveReelItem`, `useSetReelItemActive`, `useSaveChallengeCard`, `useSetChallengeCardActive` (mockados a partir da Task 20); `validateReelItem`, `validateChallengeText`, `REEL_TITLES` (Task 20); `Badge`, `Button`, `Card`, `Checkbox`, `TextArea` de `@/design/ui`.
- Produces: `ScenarioBankEditor` (rota `/cenarios`, só mentor; sem props). Abas por rolo + baralho; adicionar, editar e ativar/desativar (RF-84); objetivo exige "papel do mentor" e "meta dela" (RF-85); complicação exige a fala do cliente; item "Nenhuma" é fixo; aviso quando um rolo obrigatório fica sem itens ativos.

- [ ] **Step 1: Testes**


`src/features/simulations/ScenarioBankEditor.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { asyncMutationOf, bankQuery } from '@/test/simulationMocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import * as sim from './hooks'
import { ScenarioBankEditor } from './ScenarioBankEditor'

const saveReel = vi.fn()
const setReelActive = vi.fn()
const saveCard = vi.fn()
const setCardActive = vi.fn()

function setup(bank = bankQuery()) {
  vi.mocked(sim.useScenarioBank).mockReturnValue(bank)
  vi.mocked(sim.useSaveReelItem).mockReturnValue({ ...(asyncMutationOf() as object), mutate: saveReel } as never)
  vi.mocked(sim.useSetReelItemActive).mockReturnValue({ ...(asyncMutationOf() as object), mutate: setReelActive } as never)
  vi.mocked(sim.useSaveChallengeCard).mockReturnValue({ ...(asyncMutationOf() as object), mutate: saveCard } as never)
  vi.mocked(sim.useSetChallengeCardActive).mockReturnValue({ ...(asyncMutationOf() as object), mutate: setCardActive } as never)
  return render(<ScenarioBankEditor />)
}

beforeEach(() => vi.clearAllMocks())

test('lista os itens do rolo, com os inativos riscados e o selo "Original"', () => {
  setup()
  expect(screen.getByText('Captura de lead')).toBeInTheDocument()
  expect(screen.getByText('Follow-up')).toBeInTheDocument()
  expect(screen.getAllByText('Original')).toHaveLength(2)
  expect(screen.getByRole('checkbox', { name: 'Ativo: Follow-up' })).not.toBeChecked()
})

test('desativar um item chama a mutation e o histórico continua no banco (RF-84)', async () => {
  setup()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Ativo: Captura de lead' }))
  expect(setReelActive).toHaveBeenCalledWith({ id: 'obj-01', active: false })
})

test('novo objetivo exige papel do mentor e meta dela (RF-85)', async () => {
  setup()
  const add = screen.getByRole('button', { name: 'Adicionar' })
  await userEvent.type(screen.getByLabelText('Nome'), 'Follow-up 2')
  expect(add).toBeDisabled()
  expect(screen.getByText(/papel do mentor/)).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('Papel do mentor'), 'Lead que sumiu')
  await userEvent.type(screen.getByLabelText('Meta dela'), 'Obter sim ou não')
  expect(add).toBeEnabled()
  await userEvent.click(add)
  expect(saveReel).toHaveBeenCalledWith(
    { id: undefined, reel: 1, label: 'Follow-up 2', mentorRole: 'Lead que sumiu', studentGoal: 'Obter sim ou não', clientLine: '' },
    expect.objectContaining({ onSuccess: expect.any(Function) }),
  )
})

test('editar preenche o formulário e salva com o id do item', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: 'Editar Agendamento' }))
  expect(screen.getByLabelText('Nome')).toHaveValue('Agendamento')
  await userEvent.clear(screen.getByLabelText('Nome'))
  await userEvent.type(screen.getByLabelText('Nome'), 'Agendar reunião')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  expect(saveReel).toHaveBeenCalledWith(expect.objectContaining({ id: 'obj-02', label: 'Agendar reunião' }), expect.anything())
})

test('rolo 4: "Nenhuma" é fixa e a complicação pede a fala do cliente', async () => {
  setup()
  await userEvent.click(screen.getByRole('tab', { name: 'Complicação' }))
  expect(screen.getByText('Fixo')).toBeInTheDocument()
  expect(screen.queryByRole('checkbox', { name: /Ativo: Nenhuma/ })).not.toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('Nome'), 'Concorrente barato')
  expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled()
  await userEvent.type(screen.getByLabelText('Fala do cliente (1ª pessoa)'), 'O concorrente cobra metade.')
  expect(screen.getByRole('button', { name: 'Adicionar' })).toBeEnabled()
})

test('avisa quando todos os itens de um rolo obrigatório estão inativos (Review Focus 3)', async () => {
  const bank = bankQuery()
  bank.data!.items = bank.data!.items.map((i) => (i.reel === 2 ? { ...i, active: false } : i))
  setup(bank)
  await userEvent.click(screen.getByRole('tab', { name: 'Perfil do cliente' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Ative pelo menos um item')
})

test('baralho de perguntas: adicionar e desativar', async () => {
  setup()
  await userEvent.click(screen.getByRole('tab', { name: 'Perguntas do produto' }))
  await userEvent.click(screen.getByRole('checkbox', { name: 'Ativa: Qual a garantia?' }))
  expect(setCardActive).toHaveBeenCalledWith({ id: 'card-02', active: false })
  await userEvent.type(screen.getByLabelText('Pergunta do cliente'), 'Tem nota fiscal?')
  await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
  expect(saveCard).toHaveBeenCalledWith({ id: undefined, text: 'Tem nota fiscal?' }, expect.anything())
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/simulations/ScenarioBankEditor.test.tsx 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import "./ScenarioBankEditor"`.

- [ ] **Step 3: Implementar**


`src/features/simulations/ScenarioBankEditor.tsx`:
```tsx
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
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/simulations/ScenarioBankEditor.test.tsx 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/ScenarioBankEditor.tsx src/features/simulations/ScenarioBankEditor.test.tsx
git commit -m "feat(simulations): scenario bank editor for the mentor"
```

---
### Task 26: SlotMachine (a peça visual principal do "cyber cassino") — **[W4]**

**Files:**

- Create: `src/features/simulations/SlotMachine.tsx`
- Test: `src/features/simulations/SlotMachine.test.tsx`

**Interfaces:**
- Consumes: só `src/design` (tokens e utilitários `glow`, `dither-dots`, `font-display`) e `react`; não depende de nenhuma Task da E5.
- Produces: `SlotMachine({ faces, result, spinId, onSettled?, reducedMotion? })` e `SlotResult { objective; profile; product; complications: string[] }`. Quatro rolos que giram e param em sequência da esquerda para a direita (0,7 s, depois +0,5 s por rolo); `spinId` reinicia a animação ("girar de novo", RF-73); com `prefers-reduced-motion` (ou `reducedMotion`) mostra o resultado na hora e chama `onSettled` (RF-74); um `role="status"` só para leitor de tela anuncia o sorteio no fim. Cada rolo tem `aria-label="Rolo N: <título>"`.

> **W4 pode caprichar no visual** (rolos com efeito de lâmpada, `dither-dots` no giro, luzes do painel) desde que mantenha props, textos acessíveis e os testes abaixo verdes; tokens novos não.

- [ ] **Step 1: Testes**

`src/features/simulations/SlotMachine.test.tsx`:
```tsx
import { act, render, screen } from '@testing-library/react'
import { SlotMachine, type SlotResult } from './SlotMachine'

const faces: [string[], string[], string[], string[]] = [['Captura de lead', 'Agendamento'], ['Apressado', 'Grosso'], ['Plano de internet', 'Academia'], ['Tá caro', 'Vou pensar']]
const result: SlotResult = { objective: 'Objeção de preço', profile: 'Desconfiado', product: 'Seguro de carro', complications: ['Sócio/cônjuge', 'Interrupção'] }

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

test('antes do primeiro giro mostra interrogações', () => {
  render(<SlotMachine faces={faces} result={null} spinId={0} reducedMotion={false} />)
  expect(screen.getAllByText('?')).toHaveLength(4)
})

test('os rolos param em sequência, da esquerda para a direita, e avisa no fim (RF-70)', () => {
  const onSettled = vi.fn()
  render(<SlotMachine faces={faces} result={result} spinId={1} onSettled={onSettled} reducedMotion={false} />)
  expect(screen.queryByText('Objeção de preço')).not.toBeInTheDocument()
  act(() => { vi.advanceTimersByTime(750) })
  expect(screen.getByText('Objeção de preço')).toBeInTheDocument()
  expect(screen.queryByText('Desconfiado')).not.toBeInTheDocument()
  act(() => { vi.advanceTimersByTime(500) })
  expect(screen.getByText('Desconfiado')).toBeInTheDocument()
  expect(onSettled).not.toHaveBeenCalled()
  act(() => { vi.advanceTimersByTime(1100) })
  expect(screen.getByText('Seguro de carro')).toBeInTheDocument()
  expect(screen.getByText('Sócio/cônjuge')).toBeInTheDocument()
  expect(screen.getByText('Interrupção')).toBeInTheDocument()
  expect(onSettled).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('status')).toHaveTextContent('Sorteio: Objeção de preço')
})

test('reduced motion: mostra o resultado na hora, sem animação (RF-74)', () => {
  const onSettled = vi.fn()
  render(<SlotMachine faces={faces} result={result} spinId={1} onSettled={onSettled} reducedMotion />)
  expect(screen.getByText('Objeção de preço')).toBeInTheDocument()
  expect(screen.getByText('Interrupção')).toBeInTheDocument()
  expect(onSettled).toHaveBeenCalledTimes(1)
})

test('"girar de novo" reinicia a animação com o novo resultado (RF-73)', () => {
  const { rerender } = render(<SlotMachine faces={faces} result={result} spinId={1} reducedMotion={false} />)
  act(() => { vi.advanceTimersByTime(3000) })
  expect(screen.getByText('Objeção de preço')).toBeInTheDocument()
  rerender(<SlotMachine faces={faces} result={{ ...result, objective: 'Pós-venda' }} spinId={2} reducedMotion={false} />)
  expect(screen.queryByText('Pós-venda')).not.toBeInTheDocument()
  act(() => { vi.advanceTimersByTime(3000) })
  expect(screen.getByText('Pós-venda')).toBeInTheDocument()
})

test('desmontar no meio do giro não dispara onSettled', () => {
  const onSettled = vi.fn()
  const { unmount } = render(<SlotMachine faces={faces} result={result} spinId={1} onSettled={onSettled} reducedMotion={false} />)
  unmount()
  act(() => { vi.advanceTimersByTime(5000) })
  expect(onSettled).not.toHaveBeenCalled()
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/simulations/SlotMachine.test.tsx 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import` do componente ainda inexistente.

- [ ] **Step 3: Implementar**

`src/features/simulations/SlotMachine.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react'

export interface SlotResult { objective: string; profile: string; product: string; complications: string[] }

export interface SlotMachineProps {
  /** Rótulos que passam girando em cada rolo (objetivo, perfil, produto, complicação). */
  faces: [string[], string[], string[], string[]]
  /** Rótulos sorteados; `null` até o primeiro giro. */
  result: SlotResult | null
  /** Incrementa a cada giro (inclusive "girar de novo") para reiniciar a animação. */
  spinId: number
  onSettled?: () => void
  /** Padrão: `prefers-reduced-motion` do sistema (RF-74). */
  reducedMotion?: boolean
}

const TITLES = ['Objetivo', 'Perfil do cliente', 'Produto', 'Complicação'] as const
const FIRST_STOP_MS = 700
const STOP_GAP_MS = 500
const TICK_MS = 90

const finals = (r: SlotResult): string[][] => [[r.objective], [r.profile], [r.product], r.complications]
const prefersReduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** RF-70: 4 rolos que giram e param da esquerda para a direita. */
export function SlotMachine({ faces, result, spinId, onSettled, reducedMotion }: SlotMachineProps) {
  const [stopped, setStopped] = useState(0)
  const [tick, setTick] = useState(0)
  const settled = useRef(onSettled)
  useEffect(() => { settled.current = onSettled })
  const reduced = reducedMotion ?? prefersReduced()

  // Gira só quando `spinId` muda; o resto é lido no momento do giro.
  useEffect(() => {
    if (!result) { setStopped(0); return }
    if (reduced) { setStopped(4); settled.current?.(); return }
    setStopped(0)
    const interval = setInterval(() => setTick((t) => t + 1), TICK_MS)
    const stops = [0, 1, 2, 3].map((i) => setTimeout(() => {
      setStopped(i + 1)
      if (i === 3) { clearInterval(interval); settled.current?.() }
    }, FIRST_STOP_MS + i * STOP_GAP_MS))
    return () => { clearInterval(interval); stops.forEach(clearTimeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId])

  const done = result !== null && stopped === 4
  return (
    <div role="group" aria-label="Roleta de cenário" className="grid grid-cols-2 gap-3">
      {TITLES.map((title, i) => {
        const landed = result !== null && stopped > i
        const lines = landed ? finals(result)[i] : [result ? (faces[i][(tick + i * 3) % Math.max(faces[i].length, 1)] ?? '…') : '?']
        return (
          <div key={title} aria-label={`Rolo ${i + 1}: ${title}`}
            className={`rounded-card border-2 bg-raised p-3 ${landed ? 'border-brand glow' : 'border-edge dither-dots'}`}>
            <p className="text-xs font-bold tracking-wide text-muted uppercase">{title}</p>
            <p className={`mt-1 font-display text-2xl leading-tight ${landed ? 'text-brand' : 'text-muted'}`}>
              {lines.map((l) => <span key={l} className="block">{l}</span>)}
            </p>
          </div>
        )
      })}
      <p role="status" className="sr-only">
        {done ? `Sorteio: ${result.objective}, ${result.profile}, ${result.product}, ${result.complications.join(' e ')}` : ''}
      </p>
    </div>
  )
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/simulations/SlotMachine.test.tsx 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/SlotMachine.tsx src/features/simulations/SlotMachine.test.tsx
git commit -m "feat(simulations): four-reel slot machine with reduced-motion fallback"
```

---

### Task 27: SimulationsHome — roleta, início do simulado e histórico — **[W4]**

**Files:**

- Create: `src/features/simulations/SimulationsHome.tsx`
- Test: `src/features/simulations/SimulationsHome.test.tsx`

**Interfaces:**
- Consumes: `SlotMachine` (Task 26); hooks `useScenarioBank`, `useRecentObjectives`, `useSimulations`, `useCreateSimulation`, `useAdvanceSimulation`, `usePendingRecordings` (mockados a partir da Task 20); `useNodeStates` e `useAuth` (Partes 3 e 1); `drawScenario`, `difficultyForPhase`, `RouletteError` (Task 8); `planCards` (Task 8); `statusLabel` (Task 20); `mmss`/`formatWhen`/`DIFFICULTY_LABEL` (Task 20).
- Produces: `SimulationsHome` (sem props; rota `/simulados` via `SimulationsPage`, Task 32). Mentor: "Girar a roleta" → "Iniciar simulado surpresa" (cria o simulado surpresa sem cartas e o leva a `em_andamento`). Aluna: "Girar para treinar" → "Começar treino" (cria o treino com as cartas de `planCards` e navega para `/simulados/:id` com `state: { plan: TrainingPlan }`). Dificuldade padrão pela fase e editável (RF-71), "Simulado chefe" de 10 min (RF-77), "Girar de novo" antes de iniciar (RF-73, só no cliente), erro legível da roleta (Review Focus 2), aviso "gravação pendente de envio" (RF-76g) e histórico com `statusLabel` (a aluna vê "Simulado surpresa em andamento" sem o cenário).

- [ ] **Step 1: Testes**

`src/features/simulations/SimulationsHome.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { asyncMutationOf, bankQuery, queryOf, summaryOf } from '@/test/simulationMocks'
import { nodeStatesOf as trailStatesOf } from '@/test/progressMocks'

const navigate = vi.fn()
vi.mock('react-router', async (orig) => ({ ...(await orig<typeof import('react-router')>()), useNavigate: () => navigate }))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('@/features/progress/hooks')
vi.mock('./hooks')

import { useAuth } from '@/features/auth/AuthProvider'
import { useNodeStates } from '@/features/progress/hooks'
import * as sim from './hooks'
import { SimulationsHome } from './SimulationsHome'

const mutateAsync = vi.fn()
function setup(role: 'aluna' | 'mentor', over: { bank?: ReturnType<typeof bankQuery> } = {}) {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(useNodeStates).mockReturnValue(trailStatesOf())
  vi.mocked(sim.useScenarioBank).mockReturnValue(over.bank ?? bankQuery())
  vi.mocked(sim.useRecentObjectives).mockReturnValue(queryOf<string[]>([]))
  vi.mocked(sim.useSimulations).mockReturnValue(queryOf([summaryOf({ id: 's-old', mode: 'surpresa', status: 'em_andamento' })]))
  vi.mocked(sim.usePendingRecordings).mockReturnValue({ pending: 0, flush: vi.fn() })
  vi.mocked(sim.useCreateSimulation).mockReturnValue(asyncMutationOf(mutateAsync))
  vi.mocked(sim.useAdvanceSimulation).mockReturnValue(asyncMutationOf())
  return render(<MemoryRouter><SimulationsHome /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mutateAsync.mockResolvedValue('novo-id')
  vi.spyOn(Math, 'random').mockReturnValue(0)
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), addEventListener: vi.fn(), removeEventListener: vi.fn() })) as never
})

test('mentor vê "Girar a roleta"; aluna vê "Girar para treinar"', () => {
  setup('mentor')
  expect(screen.getByRole('button', { name: 'Girar a roleta' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Editar banco de cenários' })).toBeInTheDocument()
})

test('aluna não vê o atalho do banco de cenários', () => {
  setup('aluna')
  expect(screen.getByRole('button', { name: 'Girar para treinar' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Editar banco de cenários' })).not.toBeInTheDocument()
})

test('dificuldade padrão vem da fase atual e pode ser trocada (RF-71)', async () => {
  setup('mentor')
  expect(screen.getByLabelText('Dificuldade')).toHaveValue('facil')
  await userEvent.selectOptions(screen.getByLabelText('Dificuldade'), 'dificil')
  expect(screen.getByLabelText('Dificuldade')).toHaveValue('dificil')
})

test('banco sem objetivo ativo mostra erro legível em vez de quebrar (Review Focus 3)', async () => {
  const bank = bankQuery()
  bank.data!.items = bank.data!.items.map((i) => (i.reel === 1 ? { ...i, active: false } : i))
  setup('mentor', { bank })
  await userEvent.click(screen.getByRole('button', { name: 'Girar a roleta' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(/objetivo/i)
})

test('mentor: gira, "Iniciar" cria simulado surpresa sem cartas e abre o simulado', async () => {
  setup('mentor')
  await userEvent.click(screen.getByRole('button', { name: 'Girar a roleta' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Iniciar simulado surpresa' }))
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('/simulados/novo-id', { state: undefined }))
  expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ mode: 'surpresa', difficulty: 'facil', phase: 'f1', isBoss: false, cards: [] }))
})

test('aluna: treino sai com cartas agendadas e o plano vai no estado da rota (RF-76c/d)', async () => {
  setup('aluna')
  await userEvent.click(screen.getByRole('button', { name: 'Girar para treinar' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Começar treino' }))
  await waitFor(() => expect(navigate).toHaveBeenCalled())
  const vars = mutateAsync.mock.calls[0][0]
  expect(vars.mode).toBe('treino')
  expect(vars.cards).toHaveLength(1) // fácil: só 1 questionamento
  expect(vars.cards[0].kind).toBe('questionamento')
  const [, opts] = navigate.mock.calls[0]
  expect(opts.state.plan.durationSec).toBe(300)
  expect(opts.state.plan.cardTimes).toEqual(vars.cards.map((c: { atSec: number }) => c.atSec))
})

test('simulado chefe dura 10 min', async () => {
  setup('aluna')
  await userEvent.click(screen.getByRole('checkbox', { name: /simulado chefe/i }))
  await userEvent.click(screen.getByRole('button', { name: 'Girar para treinar' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Começar treino' }))
  await waitFor(() => expect(navigate).toHaveBeenCalled())
  expect(navigate.mock.calls[0][1].state.plan.durationSec).toBe(600)
  expect(mutateAsync.mock.calls[0][0].isBoss).toBe(true)
})

test('histórico: a aluna vê o surpresa em andamento sem cenário; erro do banco aparece', async () => {
  setup('aluna')
  expect(screen.getByText('Simulado surpresa em andamento')).toBeInTheDocument()
  mutateAsync.mockRejectedValueOnce(new Error('Você não tem permissão'))
  await userEvent.click(screen.getByRole('button', { name: 'Girar para treinar' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Começar treino' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Você não tem permissão')
})

test('avisa quando há gravação pendente de envio (RF-76g)', () => {
  setup('aluna')
  vi.mocked(sim.usePendingRecordings).mockReturnValue({ pending: 2, flush: vi.fn() })
  render(<MemoryRouter><SimulationsHome /></MemoryRouter>)
  expect(screen.getAllByRole('status').some((n) => /2 gravações pendentes/.test(n.textContent ?? ''))).toBe(true)
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/simulations/SimulationsHome.test.tsx 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import` do componente ainda inexistente.

- [ ] **Step 3: Implementar**

`src/features/simulations/SimulationsHome.tsx`:
```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Badge, Button, Card, Checkbox } from '@/design/ui'
import { planCards } from '@/domain/cards'
import { difficultyForPhase, drawScenario, RouletteError, type Difficulty, type Draw, type ReelItem } from '@/domain/roulette'
import { statusLabel } from '@/domain/simulationState'
import { useAuth } from '@/features/auth/AuthProvider'
import { useNodeStates } from '@/features/progress/hooks'
import { DIFFICULTY_LABEL, formatWhen } from './format'
import {
  useAdvanceSimulation, useCreateSimulation, usePendingRecordings, useRecentObjectives, useScenarioBank, useSimulations,
} from './hooks'
import { SlotMachine, type SlotResult } from './SlotMachine'
import type { BankData, TrainingPlan } from './types'

const LEVELS = Object.keys(DIFFICULTY_LABEL) as Difficulty[]

function labelsOf(bank: BankData, d: Draw): SlotResult {
  const label = (id: string) => bank.items.find((i) => i.id === id)?.label ?? id
  return { objective: label(d.objectiveId), profile: label(d.profileId), product: label(d.productId), complications: d.complicationIds.map(label) }
}

/** `/simulados`: roleta (RF-70–74), início do simulado surpresa (mentor) ou do treino (aluna) e histórico. */
export function SimulationsHome() {
  const { profile } = useAuth()
  const role = profile?.role ?? 'aluna'
  const navigate = useNavigate()
  const trail = useNodeStates()
  const bank = useScenarioBank()
  const recent = useRecentObjectives()
  const sims = useSimulations()
  const create = useCreateSimulation()
  const advance = useAdvanceSimulation()
  const { pending } = usePendingRecordings()

  const phase = trail.data?.currentPhase ?? 'f1'
  const [chosen, setChosen] = useState<Difficulty | null>(null) // null = padrão da fase (RF-71)
  const level = chosen ?? difficultyForPhase(phase)
  const [boss, setBoss] = useState(false)
  const [draw, setDraw] = useState<Draw | null>(null)
  const [spinId, setSpinId] = useState(0)
  const [settled, setSettled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items: ReelItem[] = bank.data?.items ?? []
  const faces = ([1, 2, 3, 4] as const).map((reel) => items.filter((i) => i.reel === reel && i.active && !i.isNone).map((i) => i.label)) as [string[], string[], string[], string[]]
  const busy = create.isPending || advance.isPending

  function spin() {
    setError(null)
    setSettled(false)
    try {
      setDraw(drawScenario(items, level, recent.data ?? []))
      setSpinId((n) => n + 1)
    } catch (e) {
      setDraw(null)
      setError(e instanceof RouletteError ? e.message : 'Não foi possível sortear.')
    }
  }

  async function start() {
    if (!draw || !bank.data) return
    const mode = role === 'mentor' ? 'surpresa' : 'treino'
    const durationSec = boss ? 600 : 300
    try {
      const noneIds = new Set(items.filter((i) => i.isNone).map((i) => i.id))
      const challengeIds = bank.data.challenges.filter((c) => c.active).map((c) => c.id)
      const cards = mode === 'treino' ? planCards(draw, challengeIds, level, durationSec, Math.random, noneIds) : []
      const id = await create.mutateAsync({ mode, difficulty: level, phase, isBoss: boss, draw, cards })
      await advance.mutateAsync({ id, to: 'em_andamento' })
      const plan: TrainingPlan = { durationSec, cardTimes: cards.map((c) => c.atSec) }
      navigate(`/simulados/${id}`, { state: mode === 'treino' ? { plan } : undefined })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível iniciar.')
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-6 pb-8">
      <h1 className="font-display text-6xl leading-none font-black text-brand text-glow">Simulados</h1>
      {pending > 0 && (
        <p role="status" className="rounded-card border-2 border-streak p-3 font-bold text-streak">
          {pending === 1 ? '1 gravação pendente de envio.' : `${pending} gravações pendentes de envio.`} Elas sobem sozinhas quando a conexão voltar.
        </p>
      )}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 font-bold">
            Dificuldade
            <select value={level} onChange={(e) => setChosen(e.target.value as Difficulty)} disabled={busy}
              className="h-12 rounded-control border-2 border-line bg-surface px-3 font-normal focus:border-brand focus:outline-none">
              {LEVELS.map((l) => <option key={l} value={l}>{DIFFICULTY_LABEL[l]}</option>)}
            </select>
          </label>
          <Checkbox checked={boss} onChange={setBoss} label="Simulado chefe (10 min)" disabled={busy} />
        </div>

        <SlotMachine faces={faces} result={draw && bank.data ? labelsOf(bank.data, draw) : null} spinId={spinId} onSettled={() => setSettled(true)} />

        {error && <p role="alert" className="text-danger">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={spin} disabled={busy || bank.isLoading || (draw !== null && !settled)}>
            {draw ? 'Girar de novo' : role === 'mentor' ? 'Girar a roleta' : 'Girar para treinar'}
          </Button>
          <Button onClick={start} disabled={!draw || !settled} loading={busy}>
            {role === 'mentor' ? 'Iniciar simulado surpresa' : 'Começar treino'}
          </Button>
        </div>
        {role === 'mentor' && <Link to="/cenarios" className="font-bold text-brand underline">Editar banco de cenários</Link>}
      </Card>

      <section aria-labelledby="hist" className="flex flex-col gap-3">
        <h2 id="hist" className="font-display text-2xl font-black">Histórico</h2>
        {sims.isLoading && <p role="status" className="text-muted">Carregando…</p>}
        {sims.data?.length === 0 && <p className="text-muted">Nenhum simulado ainda.</p>}
        <ul className="flex flex-col gap-2">
          {sims.data?.slice(0, 20).map((s) => (
            <li key={s.id}>
              <Link to={`/simulados/${s.id}`} className="flex items-center justify-between gap-3 rounded-card border border-edge bg-surface p-3">
                <span>
                  <span className="block font-bold">{statusLabel(s.mode, s.status, role)}</span>
                  <span className="text-sm text-muted">{formatWhen(s.createdAt)} · {DIFFICULTY_LABEL[s.difficulty]}{s.isBoss ? ' · chefe' : ''}</span>
                </span>
                {s.official !== null && <Badge tone="success">{s.official.toFixed(1)} / 30</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/simulations/SimulationsHome.test.tsx 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/SimulationsHome.tsx src/features/simulations/SimulationsHome.test.tsx
git commit -m "feat(simulations): roulette screen to start surprise simulations and solo trainings"
```

---

### Task 28: SoloTraining — treino com cartas e gravação — **[W4]**

**Files:**

- Create: `src/features/simulations/SoloTraining.tsx`
- Test: `src/features/simulations/SoloTraining.test.tsx`

**Interfaces:**
- Consumes: `useTrainingSession`, `TrainingCard`, `TrainingSession` (Task 24; mockado nos testes); hooks `useRecordCardShown`, `useUploadRecording`, `useAdvanceSimulation` (mockados a partir da Task 20); `Scenario`, `UploadOutcome` (Task 20); `mmss` (Task 20).
- Produces: `SoloTraining({ simulationId, scenario, cards, durationSec, onDone })` com `onDone(outcome: UploadOutcome | 'sem_audio')`. Antes de começar mostra só objetivo, meta, perfil e produto (RF-76a: complicações ocultas); "Começar" liga cronômetro e gravação (erro de microfone vira alerta); a carta aparece em texto e fica até "Respondi" ou a próxima (RF-76e); cada carta mostrada é registrada com o segundo em que apareceu (RF-76f); no fim (tempo esgotado ou "Encerrar treino") envia o áudio (ou o deixa na fila), avança o simulado para `aguardando_notas` e chama `onDone`; falha ao salvar mostra "Tentar de novo".

- [ ] **Step 1: Testes**

`src/features/simulations/SoloTraining.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { asyncMutationOf, scenarioOf } from '@/test/simulationMocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')
vi.mock('./useTrainingSession')

import * as sim from './hooks'
import { SoloTraining } from './SoloTraining'
import { useTrainingSession, type TrainingCard, type TrainingSession } from './useTrainingSession'

const card: TrainingCard = { position: 0, kind: 'complicacao', refId: 'comp-01', text: 'Olha, achei caro.', atSec: 40 }
const recording = { blob: new Blob(['a']), mime: 'audio/webm', durationSec: 300 }
const uploadAsync = vi.fn()
const advanceAsync = vi.fn()
const shownMutate = vi.fn()

function session(over: Partial<TrainingSession> = {}): TrainingSession {
  return {
    phase: 'ready', elapsedSec: 0, remainingSec: 300, currentCard: null, shownCards: [], error: null,
    start: vi.fn(), dismissCard: vi.fn(), finish: vi.fn().mockResolvedValue(recording), ...over,
  }
}
function setup(s: TrainingSession, onDone = vi.fn()) {
  vi.mocked(useTrainingSession).mockReturnValue(s)
  vi.mocked(sim.useRecordCardShown).mockReturnValue({ mutate: shownMutate } as never)
  vi.mocked(sim.useUploadRecording).mockReturnValue(asyncMutationOf(uploadAsync))
  vi.mocked(sim.useAdvanceSimulation).mockReturnValue(asyncMutationOf(advanceAsync))
  render(<SoloTraining simulationId="s1" scenario={scenarioOf()} cards={[card]} durationSec={300} onDone={onDone} />)
  return onDone
}

beforeEach(() => { vi.clearAllMocks(); uploadAsync.mockResolvedValue('uploaded'); advanceAsync.mockResolvedValue(undefined) })

test('antes de começar mostra só objetivo, meta, perfil e produto; complicações ficam ocultas (RF-76a)', () => {
  setup(session())
  expect(screen.getByText('Objeção de preço')).toBeInTheDocument()
  expect(screen.getByText(/Reancorar valor/)).toBeInTheDocument()
  expect(screen.getByText('Apressado')).toBeInTheDocument()
  expect(screen.getByText('Plano de internet')).toBeInTheDocument()
  expect(screen.queryByText('Tá caro')).not.toBeInTheDocument()
  expect(screen.queryByText(/achei caro/)).not.toBeInTheDocument()
})

test('"Começar" inicia a sessão e erro de microfone aparece como alerta', async () => {
  const start = vi.fn()
  setup(session({ start, error: 'Não foi possível usar o microfone.' }))
  await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
  expect(start).toHaveBeenCalled()
  expect(screen.getByRole('alert')).toHaveTextContent('microfone')
})

test('gravando: cronômetro, carta em texto e "Respondi"', async () => {
  const dismissCard = vi.fn()
  setup(session({ phase: 'recording', remainingSec: 245, currentCard: card, dismissCard }))
  expect(screen.getByRole('timer')).toHaveTextContent('4:05')
  expect(screen.getByRole('region', { name: 'Carta do cliente' })).toHaveTextContent('Olha, achei caro.')
  await userEvent.click(screen.getByRole('button', { name: 'Respondi' }))
  expect(dismissCard).toHaveBeenCalled()
})

test('"Encerrar treino" pede o fim da sessão', async () => {
  const finish = vi.fn().mockResolvedValue(recording)
  setup(session({ phase: 'recording', finish }))
  await userEvent.click(screen.getByRole('button', { name: 'Encerrar treino' }))
  expect(finish).toHaveBeenCalled()
})

test('ao terminar: envia o áudio, avança para "aguardando notas" e avisa (RF-76g)', async () => {
  const onDone = setup(session({ phase: 'finished' }))
  await waitFor(() => expect(onDone).toHaveBeenCalledWith('uploaded'))
  expect(uploadAsync).toHaveBeenCalledWith({ simulationId: 's1', blob: recording.blob, mime: 'audio/webm', durationSec: 300 })
  expect(advanceAsync).toHaveBeenCalledWith({ id: 's1', to: 'aguardando_notas' })
})

test('gravação guardada no aparelho também segue para a ficha', async () => {
  uploadAsync.mockResolvedValue('queued')
  const onDone = setup(session({ phase: 'finished' }))
  await waitFor(() => expect(onDone).toHaveBeenCalledWith('queued'))
})

test('falha ao salvar mostra erro e permite tentar de novo', async () => {
  advanceAsync.mockRejectedValueOnce(new Error('Você não pode alterar este simulado.'))
  const onDone = setup(session({ phase: 'finished' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Você não pode alterar')
  await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  await waitFor(() => expect(onDone).toHaveBeenCalled())
})

test('cada carta mostrada é registrada com o segundo em que apareceu (RF-76f)', () => {
  setup(session())
  const opts = vi.mocked(useTrainingSession).mock.calls[0][0]
  opts.onCardShown?.(card, 41)
  expect(shownMutate).toHaveBeenCalledWith({ simulationId: 's1', position: 0, atSec: 41 })
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/simulations/SoloTraining.test.tsx 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import` do componente ainda inexistente.

- [ ] **Step 3: Implementar**

`src/features/simulations/SoloTraining.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card } from '@/design/ui'
import { mmss } from './format'
import { useAdvanceSimulation, useRecordCardShown, useUploadRecording } from './hooks'
import type { Scenario, UploadOutcome } from './types'
import { useTrainingSession, type TrainingCard } from './useTrainingSession'

export interface SoloTrainingProps {
  simulationId: string
  scenario: Scenario
  /** Cartas agendadas (`atSec`) com o texto resolvido. */
  cards: TrainingCard[]
  durationSec: number
  onDone(outcome: UploadOutcome | 'sem_audio'): void
}

/** Treino solo (RF-76a–g): mostra objetivo, meta, perfil e produto; as complicações só aparecem como cartas. */
export function SoloTraining({ simulationId, scenario, cards, durationSec, onDone }: SoloTrainingProps) {
  const shown = useRecordCardShown()
  const advance = useAdvanceSimulation()
  const upload = useUploadRecording()
  const session = useTrainingSession({
    durationSec, cards,
    onCardShown: (c, atSec) => shown.mutate({ simulationId, position: c.position, atSec }),
  })
  const [saveError, setSaveError] = useState<string | null>(null)
  const finalizing = useRef(false)

  async function finalize() {
    setSaveError(null)
    try {
      const rec = await session.finish()
      let outcome: UploadOutcome | 'sem_audio' = 'sem_audio'
      if (rec) outcome = await upload.mutateAsync({ simulationId, blob: rec.blob, mime: rec.mime, durationSec: rec.durationSec })
      await advance.mutateAsync({ id: simulationId, to: 'aguardando_notas' })
      onDone(outcome)
    } catch (e) {
      finalizing.current = false
      setSaveError(e instanceof Error ? e.message : 'Não foi possível salvar o treino.')
    }
  }

  // Fim do tempo ou "Encerrar": o hook muda para "finished" e o treino é salvo uma única vez.
  useEffect(() => {
    if (session.phase === 'finished' && !finalizing.current) {
      finalizing.current = true
      void finalize()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase])

  const { objective, profile, product } = scenario

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-6 pb-8">
      <h1 className="font-display text-4xl leading-none font-black text-brand text-glow">Treino</h1>

      <Card className="flex flex-col gap-2">
        <p><span className="font-bold text-muted">Objetivo:</span> {objective.label}</p>
        {objective.studentGoal && <p><span className="font-bold text-muted">Sua meta:</span> {objective.studentGoal}</p>}
        <p><span className="font-bold text-muted">Cliente:</span> {profile.label}</p>
        <p><span className="font-bold text-muted">Produto:</span> {product.label}</p>
        <p className="text-sm text-muted">Durante o treino podem aparecer cartas com falas e dúvidas do cliente. Responda em voz alta.</p>
      </Card>

      {session.phase === 'ready' && (
        <>
          {session.error && <p role="alert" className="text-danger">{session.error}</p>}
          <Button size="lg" onClick={() => void session.start()}>Começar</Button>
          <p className="text-sm text-muted">Mantenha a tela ligada e o celular desbloqueado: o áudio é gravado enquanto você treina.</p>
        </>
      )}

      {session.phase === 'recording' && (
        <>
          <p role="timer" aria-label="Tempo restante" className="text-center font-display text-7xl font-black tabular-nums text-brand">
            {mmss(session.remainingSec)}
          </p>
          <Badge tone="brand">● Gravando</Badge>
          {session.currentCard && (
            <section aria-label="Carta do cliente" aria-live="assertive" className="flex flex-col gap-3 rounded-card border-2 border-brand bg-raised p-4 glow">
              <p className="text-xs font-bold tracking-wide text-muted uppercase">
                {session.currentCard.kind === 'complicacao' ? 'O cliente diz' : 'Pergunta do cliente'}
              </p>
              <p className="font-display text-2xl leading-tight">{session.currentCard.text}</p>
              <Button variant="secondary" onClick={session.dismissCard}>Respondi</Button>
            </section>
          )}
          <Button variant="danger" onClick={() => void session.finish()}>Encerrar treino</Button>
        </>
      )}

      {session.phase === 'finished' && (
        saveError ? (
          <div className="flex flex-col gap-3">
            <p role="alert" className="text-danger">{saveError}</p>
            <Button onClick={() => { finalizing.current = true; void finalize() }}>Tentar de novo</Button>
          </div>
        ) : <p role="status" className="text-muted">Salvando o treino…</p>
      )}
    </main>
  )
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/simulations/SoloTraining.test.tsx 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/SoloTraining.tsx src/features/simulations/SoloTraining.test.tsx
git commit -m "feat(simulations): solo training screen with surprise cards and audio recording"
```

---

### Task 29: ScoreSheetForm — ficha de avaliação — **[W4]**

**Files:**

- Create: `src/features/simulations/ScoreSheetForm.tsx`
- Test: `src/features/simulations/ScoreSheetForm.test.tsx`

**Interfaces:**
- Consumes: `useSubmitScore` (mockado a partir da Task 20); `CRITERIA`, `CRITERIA_LABELS`, `isValidScores`, `total` (Task 7); `Button`, `Card`, `TextArea`.
- Produces: `ScoreSheetForm({ simulationId, onSubmitted? })`: 6 critérios de 1 a 5 com o texto "o que observar" (RF-78), "1 coisa que foi boa" e "1 coisa para melhorar" (RF-79), total ao vivo, "Enviar ficha" só com os 6 critérios preenchidos; erro do banco (ficha duplicada, simulado não terminado) aparece como alerta. Cada critério é um `fieldset` cujo `legend` é o nome do critério (o E2E da Task 32 depende disso).

- [ ] **Step 1: Testes**

`src/features/simulations/ScoreSheetForm.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { asyncMutationOf } from '@/test/simulationMocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import * as sim from './hooks'
import { ScoreSheetForm } from './ScoreSheetForm'

const mutate = vi.fn()
function setup(error: Error | null = null) {
  vi.mocked(sim.useSubmitScore).mockReturnValue({ ...(asyncMutationOf(vi.fn(), error) as object), mutate } as never)
  const onSubmitted = vi.fn()
  render(<ScoreSheetForm simulationId="s1" onSubmitted={onSubmitted} />)
  return onSubmitted
}
const rate = (criterion: string, n: number) =>
  userEvent.click(within(screen.getByRole('group', { name: criterion })).getByLabelText(String(n), { selector: 'input' }))

beforeEach(() => vi.clearAllMocks())

test('mostra os 6 critérios com o texto "o que observar" (RF-78)', () => {
  setup()
  for (const c of ['Abertura', 'Tom e energia', 'Perguntas', 'Escuta', 'Objeção', 'Fechamento']) expect(screen.getByRole('group', { name: c })).toBeInTheDocument()
  expect(screen.getByText('Disse quem é e o motivo em até 20 segundos?')).toBeInTheDocument()
})

test('só envia com os 6 critérios preenchidos e mostra o total', async () => {
  setup()
  const send = screen.getByRole('button', { name: 'Enviar ficha' })
  expect(send).toBeDisabled()
  expect(screen.getByText('Total: —')).toBeInTheDocument()
  for (const c of ['Abertura', 'Tom e energia', 'Perguntas', 'Escuta', 'Objeção']) await rate(c, 4)
  expect(send).toBeDisabled()
  await rate('Fechamento', 5)
  expect(send).toBeEnabled()
  expect(screen.getByText('Total: 25 de 30')).toBeInTheDocument()
})

test('envia notas e textos no formato do contrato (RF-79)', async () => {
  const onSubmitted = setup()
  for (const c of ['Abertura', 'Tom e energia', 'Perguntas', 'Escuta', 'Objeção', 'Fechamento']) await rate(c, 3)
  await userEvent.type(screen.getByLabelText('1 coisa que foi boa'), 'Boa abertura')
  await userEvent.type(screen.getByLabelText('1 coisa para melhorar'), 'Calar depois de pedir a venda')
  await userEvent.click(screen.getByRole('button', { name: 'Enviar ficha' }))
  expect(mutate).toHaveBeenCalledWith(
    { simulationId: 's1', scores: { abertura: 3, tom: 3, perguntas: 3, escuta: 3, objecao: 3, fechamento: 3 }, good: 'Boa abertura', improve: 'Calar depois de pedir a venda' },
    { onSuccess: onSubmitted },
  )
})

test('erro do banco (ficha duplicada) aparece como alerta', () => {
  setup(new Error('Você já enviou a sua ficha.'))
  expect(screen.getByRole('alert')).toHaveTextContent('Você já enviou a sua ficha.')
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/simulations/ScoreSheetForm.test.tsx 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import` do componente ainda inexistente.

- [ ] **Step 3: Implementar**

`src/features/simulations/ScoreSheetForm.tsx`:
```tsx
import { useState, type FormEvent } from 'react'
import { Button, Card, TextArea } from '@/design/ui'
import { CRITERIA, CRITERIA_LABELS, isValidScores, total, type Criterion } from '@/domain/scoring'
import { useSubmitScore } from './hooks'

const RATINGS = [1, 2, 3, 4, 5] as const

/** Ficha de avaliação (RF-78/79): 6 critérios de 1 a 5, "o que foi bom" e "o que melhorar". */
export function ScoreSheetForm({ simulationId, onSubmitted }: { simulationId: string; onSubmitted?: () => void }) {
  const submit = useSubmitScore()
  const [picked, setPicked] = useState<Partial<Record<Criterion, number>>>({})
  const [good, setGood] = useState('')
  const [improve, setImprove] = useState('')

  const complete = isValidScores(picked)
  const sum = complete ? total(picked) : null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidScores(picked)) return
    submit.mutate({ simulationId, scores: picked, good, improve }, { onSuccess: onSubmitted })
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <h2 className="font-display text-2xl font-black">Ficha de avaliação</h2>
        <p className="text-sm text-muted">Você só vê a nota da outra pessoa depois que as duas fichas forem enviadas.</p>

        {CRITERIA.map((c) => (
          <fieldset key={c} className="flex flex-col gap-2">
            <legend className="font-bold">{CRITERIA_LABELS[c].label}</legend>
            <p className="text-sm text-muted">{CRITERIA_LABELS[c].hint}</p>
            <div className="flex gap-2">
              {RATINGS.map((n) => (
                <label key={n} className="flex-1">
                  <input type="radio" name={c} value={n} checked={picked[c] === n} onChange={() => setPicked((p) => ({ ...p, [c]: n }))}
                    className="peer sr-only" />
                  <span className="flex h-12 items-center justify-center rounded-control border-2 border-line bg-surface font-bold tabular-nums
                    peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                    {n}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <TextArea label="1 coisa que foi boa" value={good} onChange={setGood} />
        <TextArea label="1 coisa para melhorar" value={improve} onChange={setImprove} />

        <p aria-live="polite" className="font-display text-3xl font-black tabular-nums">
          {sum === null ? 'Total: —' : `Total: ${sum} de 30`}
        </p>
        {submit.error && <p role="alert" className="text-danger">{submit.error.message}</p>}
        <Button type="submit" disabled={!complete} loading={submit.isPending}>Enviar ficha</Button>
      </form>
    </Card>
  )
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/simulations/ScoreSheetForm.test.tsx 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/ScoreSheetForm.tsx src/features/simulations/ScoreSheetForm.test.tsx
git commit -m "feat(simulations): score sheet form"
```

---

### Task 30: RecordingPlayer e ReviewQueue — **[W4]**

**Files:**
- Create: `src/features/simulations/RecordingPlayer.tsx`, `src/features/simulations/ReviewQueue.tsx`
- Test: `src/features/simulations/RecordingPlayer.test.tsx`, `src/features/simulations/ReviewQueue.test.tsx`

**Interfaces:**
- Consumes: `useRecordingUrl`, `useKeepRecording`, `useSimulations` (mockados a partir da Task 20); `needsMentorReview` (Task 20); `useAuth`; `RecordingInfo`, `Role` (Task 20); `formatWhen`, `mmss`, `DIFFICULTY_LABEL` (Task 20).
- Produces: `RecordingPlayer({ simulationId, recording, markers, role })` com `Marker { atSec; label }`: player de áudio com botões que pulam para o momento de cada carta (RF-76f), texto da retenção de 30 dias e, só para o mentor, "Guardar esta gravação" (RF-76j). `ReviewQueue()` (sem props): "Treinos para avaliar" (RF-76h), só para o mentor, com os treinos terminados que ainda esperam a nota dele; cada item abre `/simulados/:id`, onde estão cenário, cartas, autoavaliação, player e a ficha do mentor (RF-76i).

- [ ] **Step 1: Testes**


`src/features/simulations/RecordingPlayer.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { asyncMutationOf, queryOf } from '@/test/simulationMocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import * as sim from './hooks'
import { RecordingPlayer } from './RecordingPlayer'
import type { RecordingInfo } from './types'

const rec: RecordingInfo = { filePath: 's1/audio.webm', mime: 'audio/webm', durationSec: 300, sizeBytes: 100, keep: false, deleteAfter: null }
const keepMutate = vi.fn()
const play = vi.fn()

function setup(role: 'aluna' | 'mentor', recording = rec) {
  vi.mocked(sim.useRecordingUrl).mockReturnValue(queryOf('https://signed.test/s1/audio.webm'))
  vi.mocked(sim.useKeepRecording).mockReturnValue({ ...(asyncMutationOf() as object), mutate: keepMutate } as never)
  return render(<RecordingPlayer simulationId="s1" recording={recording} role={role} markers={[{ atSec: 62, label: 'Tá caro' }, { atSec: 130, label: 'Tem nota fiscal?' }]} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  window.HTMLMediaElement.prototype.play = play
})

test('pular para o marcador posiciona o áudio e toca (RF-76f)', async () => {
  const { container } = setup('mentor')
  await userEvent.click(screen.getByRole('button', { name: '1:02 · Tá caro' }))
  const audio = container.querySelector('audio')!
  expect(audio.currentTime).toBe(62)
  expect(play).toHaveBeenCalled()
  expect(audio).toHaveAttribute('src', 'https://signed.test/s1/audio.webm')
})

test('só o mentor vê "Guardar" e ele avisa da retenção (RF-76j)', async () => {
  setup('mentor')
  expect(screen.getByText('Será apagada 30 dias depois da nota do mentor.')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Guardar esta gravação' }))
  expect(keepMutate).toHaveBeenCalledWith({ simulationId: 's1', keep: true })
})

test('aluna não vê "Guardar"; gravação guardada e data de exclusão aparecem no texto', () => {
  setup('aluna', { ...rec, keep: true })
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  expect(screen.getByText('Esta gravação será guardada.')).toBeInTheDocument()
})

test('mostra a data de exclusão quando já agendada', () => {
  setup('aluna', { ...rec, deleteAfter: '2026-10-30T15:00:00Z' })
  expect(screen.getByText('Será apagada em 30/10, 12:00.')).toBeInTheDocument()
})
```

`src/features/simulations/ReviewQueue.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { queryOf, summaryOf } from '@/test/simulationMocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')

import { useAuth } from '@/features/auth/AuthProvider'
import * as sim from './hooks'
import { ReviewQueue } from './ReviewQueue'

const list = [
  summaryOf({ id: 'a', mode: 'treino', status: 'aguardando_notas', hasRecording: true, createdAt: '2026-09-29T15:00:00Z' }),
  summaryOf({ id: 'b', mode: 'treino', status: 'aguardando_notas', myScoreDone: true }),
  summaryOf({ id: 'c', mode: 'surpresa', status: 'aguardando_notas' }),
  summaryOf({ id: 'd', mode: 'treino', status: 'em_andamento' }),
]
function setup(role: 'aluna' | 'mentor', data = list) {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(sim.useSimulations).mockReturnValue(queryOf(data))
  return render(<MemoryRouter><ReviewQueue /></MemoryRouter>)
}

test('lista só treinos terminados que ainda esperam a nota do mentor', () => {
  setup('mentor')
  const links = screen.getAllByRole('link')
  expect(links).toHaveLength(1)
  expect(links[0]).toHaveAttribute('href', '/simulados/a')
  expect(links[0]).toHaveTextContent('29/09, 12:00')
  expect(screen.getByText('Com áudio')).toBeInTheDocument()
})

test('fila vazia mostra a mensagem', () => {
  setup('mentor', [])
  expect(screen.getByText('Nenhum treino esperando a sua nota.')).toBeInTheDocument()
})

test('a aluna não vê a fila', () => {
  const { container } = setup('aluna')
  expect(container).toBeEmptyDOMElement()
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/simulations/RecordingPlayer.test.tsx src/features/simulations/ReviewQueue.test.tsx 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import "./RecordingPlayer"` / `"./ReviewQueue"`.

- [ ] **Step 3: Implementar**


`src/features/simulations/RecordingPlayer.tsx`:
```tsx
import { useRef } from 'react'
import { Button, Checkbox } from '@/design/ui'
import { formatWhen, mmss } from './format'
import { useKeepRecording, useRecordingUrl } from './hooks'
import type { RecordingInfo, Role } from './types'

export interface Marker { atSec: number; label: string }

/** Player com marcadores nos momentos das cartas (RF-76f) e a opção "guardar" do mentor (RF-76j). */
export function RecordingPlayer({ simulationId, recording, markers, role }: { simulationId: string; recording: RecordingInfo; markers: Marker[]; role: Role }) {
  const url = useRecordingUrl(recording.filePath)
  const keep = useKeepRecording()
  const audio = useRef<HTMLAudioElement>(null)

  const jump = (atSec: number) => {
    if (!audio.current) return
    audio.current.currentTime = atSec
    void audio.current.play()
  }
  const retention = recording.keep
    ? 'Esta gravação será guardada.'
    : recording.deleteAfter
      ? `Será apagada em ${formatWhen(recording.deleteAfter)}.`
      : 'Será apagada 30 dias depois da nota do mentor.'

  return (
    <section aria-label="Gravação do treino" className="flex flex-col gap-3">
      {url.isLoading && <p role="status" className="text-muted">Carregando o áudio…</p>}
      {url.error && <p role="alert" className="text-danger">Não foi possível carregar o áudio.</p>}
      {url.data && <audio ref={audio} controls preload="metadata" src={url.data} className="w-full" />}
      {markers.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Momentos das cartas">
          {markers.map((m) => (
            <li key={`${m.atSec}-${m.label}`}>
              <Button size="sm" variant="secondary" onClick={() => jump(m.atSec)}>{mmss(m.atSec)} · {m.label}</Button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted">{retention}</p>
      {role === 'mentor' && (
        <Checkbox checked={recording.keep} onChange={(k) => keep.mutate({ simulationId, keep: k })} label="Guardar esta gravação" disabled={keep.isPending} />
      )}
      {keep.error && <p role="alert" className="text-danger">{keep.error.message}</p>}
    </section>
  )
}
```

`src/features/simulations/ReviewQueue.tsx`:
```tsx
import { Link } from 'react-router'
import { Badge } from '@/design/ui'
import { needsMentorReview } from '@/domain/simulationState'
import { useAuth } from '@/features/auth/AuthProvider'
import { DIFFICULTY_LABEL, formatWhen } from './format'
import { useSimulations } from './hooks'

/** RF-76h: "Treinos para avaliar" (só o mentor). Cada item abre o simulado com cenário, cartas, autoavaliação e áudio. */
export function ReviewQueue() {
  const { profile } = useAuth()
  const sims = useSimulations()
  if (profile?.role !== 'mentor') return null

  const queue = (sims.data ?? []).filter((s) => needsMentorReview(s, 'mentor'))
  return (
    <section aria-labelledby="review" className="flex flex-col gap-3">
      <h2 id="review" className="font-display text-2xl font-black">Treinos para avaliar</h2>
      {sims.isLoading && <p role="status" className="text-muted">Carregando…</p>}
      {sims.data && queue.length === 0 && <p className="text-muted">Nenhum treino esperando a sua nota.</p>}
      <ul className="flex flex-col gap-2">
        {queue.map((s) => (
          <li key={s.id}>
            <Link to={`/simulados/${s.id}`} className="flex items-center justify-between gap-3 rounded-card border border-edge bg-surface p-3">
              <span>
                <span className="block font-bold">{formatWhen(s.createdAt)}</span>
                <span className="text-sm text-muted">{DIFFICULTY_LABEL[s.difficulty]}{s.isBoss ? ' · chefe' : ''}</span>
              </span>
              <Badge tone={s.hasRecording ? 'streak' : 'muted'}>{s.hasRecording ? 'Com áudio' : 'Sem áudio'}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/simulations/RecordingPlayer.test.tsx src/features/simulations/ReviewQueue.test.tsx 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/RecordingPlayer.tsx src/features/simulations/RecordingPlayer.test.tsx src/features/simulations/ReviewQueue.tsx src/features/simulations/ReviewQueue.test.tsx
git commit -m "feat(simulations): recording player with card markers and mentor review queue"
```

---

### Task 31: SimulationDetail e SimulationPage — **[W4]**

**Files:**
- Create: `src/features/simulations/SimulationDetail.tsx`, `src/features/simulations/SimulationPage.tsx`
- Test: `src/features/simulations/SimulationDetail.test.tsx`, `src/features/simulations/SimulationPage.test.tsx`

**Interfaces:**
- Consumes: `useSimulation`, `useScores`, `useAdvanceSimulation` (mockados a partir da Task 20); `isScenarioHidden`, `statusLabel`, `canSubmitScore` (Task 20); `officialScore`, `CRITERIA`, `CRITERIA_LABELS` (Task 7); `ScoreSheetForm` (Task 29); `RecordingPlayer` (Task 30); `SoloTraining` (Task 28); `TrainingPlan` (Task 20); `useAuth`.
- Produces: `SimulationDetail()` (lê `:id` da rota): cabeçalho com o rótulo por papel; cenário só quando permitido (RF-75); "Encerrar simulado" (mentor, surpresa) e "Encerrar treino" (aluna, treino recarregado no meio); linha do tempo das cartas com o segundo em que apareceram; player; ficha; e, no `concluido`, "Nota oficial" com as duas notas por critério e os comentários (RF-81). `SimulationPage()`: se a aluna acabou de sortear o treino (`location.state.plan`) e o simulado está `em_andamento`, renderiza `SoloTraining` (cartas nos horários do plano); em qualquer outro caso, `SimulationDetail`.

- [ ] **Step 1: Testes**


`src/features/simulations/SimulationDetail.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { asyncMutationOf, detailOf, queryOf, scenarioOf, summaryOf } from '@/test/simulationMocks'
import type { ScoreSheet, SimulationDetail as Detail } from './types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')
vi.mock('./ScoreSheetForm', () => ({ ScoreSheetForm: () => <p>ficha aberta</p> }))
vi.mock('./RecordingPlayer', () => ({
  RecordingPlayer: ({ markers }: { markers: { atSec: number; label: string }[] }) => <p>player: {markers.map((m) => `${m.atSec}:${m.label}`).join('|')}</p>,
}))

import { useAuth } from '@/features/auth/AuthProvider'
import * as sim from './hooks'
import { SimulationDetail } from './SimulationDetail'

const advance = vi.fn()
const sheet = (role: 'aluna' | 'mentor', n: number, extra: Partial<ScoreSheet> = {}): ScoreSheet => ({
  raterRole: role, mine: false, submittedAt: 'x', good: '', improve: '',
  scores: { abertura: n, tom: n, perguntas: n, escuta: n, objecao: n, fechamento: n }, ...extra,
})

function setup(role: 'aluna' | 'mentor', detail: Detail, scores: ScoreSheet[] = []) {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(sim.useSimulation).mockReturnValue(queryOf(detail))
  vi.mocked(sim.useScores).mockReturnValue(queryOf(scores))
  vi.mocked(sim.useAdvanceSimulation).mockReturnValue({ ...(asyncMutationOf() as object), mutate: advance } as never)
  return render(<MemoryRouter initialEntries={['/simulados/sim-1']}><Routes><Route path="/simulados/:id" element={<SimulationDetail />} /></Routes></MemoryRouter>)
}
const withSummary = (over: Parameters<typeof summaryOf>[0], rest: Partial<Detail> = {}) => detailOf({ summary: summaryOf(over), ...rest })

beforeEach(() => vi.clearAllMocks())

test('aluna não vê o cenário do surpresa em andamento, nem se ele vier do banco (RF-75)', () => {
  setup('aluna', withSummary({ mode: 'surpresa', status: 'em_andamento' }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Simulado surpresa em andamento')
  expect(screen.getByText(/aparece quando o mentor encerrar/)).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Cenário' })).not.toBeInTheDocument()
  expect(screen.queryByText('Objeção de preço')).not.toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('mentor vê o cenário completo e encerra o simulado', async () => {
  setup('mentor', withSummary({ mode: 'surpresa', status: 'em_andamento' }))
  expect(screen.getByText('Objeção de preço')).toBeInTheDocument()
  expect(screen.getByText(/Papel do mentor:/)).toBeInTheDocument()
  expect(screen.getByText(/Olha, achei caro/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Encerrar simulado' }))
  expect(advance).toHaveBeenCalledWith({ id: 'sim-1', to: 'aguardando_notas' })
})

test('depois de encerrado a aluna vê o cenário e a ficha', () => {
  setup('aluna', withSummary({ mode: 'surpresa', status: 'aguardando_notas' }))
  expect(screen.getByRole('heading', { name: 'Cenário' })).toBeInTheDocument()
  expect(screen.getByText('ficha aberta')).toBeInTheDocument()
})

test('ficha já enviada mostra o aviso e não abre outra (RF-80)', () => {
  setup('aluna', withSummary({ mode: 'surpresa', status: 'aguardando_notas', myScoreDone: true }))
  expect(screen.queryByText('ficha aberta')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Ficha enviada')
})

test('treino em andamento (página recarregada): complicações e cartas ficam ocultas e dá para encerrar (RF-76a)', async () => {
  const cards = [{ position: 0, kind: 'complicacao' as const, refId: 'comp-01', text: 'Olha, achei caro.', shownAtSec: null }]
  setup('aluna', withSummary({ mode: 'treino', status: 'em_andamento' }, { cards }))
  expect(screen.queryByText(/achei caro/)).not.toBeInTheDocument()
  expect(screen.queryByText('Cartas do treino')).not.toBeInTheDocument()
  expect(screen.getByText(/como cartas durante o treino/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Encerrar treino' }))
  expect(advance).toHaveBeenCalledWith({ id: 'sim-1', to: 'aguardando_notas' })
})

test('treino terminado: linha do tempo das cartas, player com marcadores e aviso de média (RF-76f/82)', () => {
  const cards = [
    { position: 0, kind: 'complicacao' as const, refId: 'comp-01', text: 'Olha, achei caro.', shownAtSec: 62 },
    { position: 1, kind: 'questionamento' as const, refId: 'card-01', text: 'Isso funciona mesmo?', shownAtSec: null },
  ]
  const recording = { filePath: 's/a.webm', mime: 'audio/webm', durationSec: 300, sizeBytes: 1, keep: false, deleteAfter: null }
  setup('mentor', withSummary({ mode: 'treino', status: 'aguardando_notas', hasRecording: true }, { cards, recording }))
  expect(screen.getByText('1:02')).toBeInTheDocument()
  expect(screen.getByText('Não apareceu')).toBeInTheDocument()
  expect(screen.getByText('player: 62:Olha, achei caro.')).toBeInTheDocument()
  expect(screen.getByText(/ainda não conta na média oficial/)).toBeInTheDocument()
  expect(screen.getByText('ficha aberta')).toBeInTheDocument()
})

test('concluído: nota oficial = média das duas fichas, com as duas colunas e os comentários', () => {
  setup('aluna', withSummary({ mode: 'surpresa', status: 'concluido', myScoreDone: true, official: 24 }, { scenario: scenarioOf() }), [
    sheet('aluna', 3, { mine: true, good: 'Abertura clara', improve: 'Calar depois de fechar' }),
    sheet('mentor', 5, { good: 'Boa escuta' }),
  ])
  const region = screen.getByRole('heading', { name: 'Nota oficial' }).closest('section')!
  expect(within(region).getByText('24.0')).toBeInTheDocument()
  const row = within(region).getByRole('row', { name: /Abertura/ })
  expect(within(row).getAllByRole('cell').map((c) => c.textContent)).toEqual(['3', '5', '4.0'])
  expect(within(region).getByText('Abertura clara')).toBeInTheDocument()
  expect(within(region).getByText('Boa escuta')).toBeInTheDocument()
})

test('simulado inexistente mostra erro', () => {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role: 'aluna', name: 'X' } } as never)
  vi.mocked(sim.useSimulation).mockReturnValue({ ...queryOf(undefined), isLoading: false } as never)
  vi.mocked(sim.useScores).mockReturnValue(queryOf([]))
  vi.mocked(sim.useAdvanceSimulation).mockReturnValue(asyncMutationOf())
  render(<MemoryRouter><SimulationDetail /></MemoryRouter>)
  expect(screen.getByRole('alert')).toHaveTextContent('Simulado não encontrado')
})
```

`src/features/simulations/SimulationPage.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { detailOf, queryOf, summaryOf } from '@/test/simulationMocks'
import type { TrainingPlan } from './types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')
vi.mock('./SimulationDetail', () => ({ SimulationDetail: () => <p>detalhe</p> }))
vi.mock('./SoloTraining', () => ({
  SoloTraining: (p: { durationSec: number; cards: { atSec: number; text: string }[] }) => <p>treino {p.durationSec} {p.cards.map((c) => `${c.atSec}:${c.text}`).join('|')}</p>,
}))

import * as sim from './hooks'
import { SimulationPage } from './SimulationPage'

const plan: TrainingPlan = { durationSec: 300, cardTimes: [45, 130] }
const cards = [
  { position: 0, kind: 'questionamento' as const, refId: 'card-01', text: 'Pergunta A', shownAtSec: null },
  { position: 1, kind: 'complicacao' as const, refId: 'comp-01', text: 'Fala B', shownAtSec: null },
]
function renderAt(detail: ReturnType<typeof detailOf>, state?: { plan: TrainingPlan }) {
  vi.mocked(sim.useSimulation).mockReturnValue(queryOf(detail))
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/simulados/sim-1', state }]}>
      <Routes><Route path="/simulados/:id" element={<SimulationPage />} /></Routes>
    </MemoryRouter>,
  )
}

test('treino recém-sorteado com plano vai para a tela de treino, cartas nos horários do plano', () => {
  renderAt(detailOf({ summary: summaryOf({ mode: 'treino', status: 'em_andamento' }), cards }), { plan })
  expect(screen.getByText('treino 300 45:Pergunta A|130:Fala B')).toBeInTheDocument()
})

test('sem plano (página recarregada) cai no detalhe em vez de reiniciar o treino', () => {
  renderAt(detailOf({ summary: summaryOf({ mode: 'treino', status: 'em_andamento' }), cards }))
  expect(screen.getByText('detalhe')).toBeInTheDocument()
})

test('com plano mas já encerrado mostra o detalhe', () => {
  renderAt(detailOf({ summary: summaryOf({ mode: 'treino', status: 'aguardando_notas' }), cards }), { plan })
  expect(screen.getByText('detalhe')).toBeInTheDocument()
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/simulations/SimulationDetail.test.tsx src/features/simulations/SimulationPage.test.tsx 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import "./SimulationDetail"` / `"./SimulationPage"`.

- [ ] **Step 3: Implementar**


`src/features/simulations/SimulationDetail.tsx`:
```tsx
import { useParams } from 'react-router'
import { Badge, Button, Card } from '@/design/ui'
import { CRITERIA, CRITERIA_LABELS, officialScore } from '@/domain/scoring'
import { canSubmitScore, isScenarioHidden, statusLabel } from '@/domain/simulationState'
import { useAuth } from '@/features/auth/AuthProvider'
import { DIFFICULTY_LABEL, formatWhen, mmss } from './format'
import { useAdvanceSimulation, useScores, useSimulation } from './hooks'
import { RecordingPlayer } from './RecordingPlayer'
import { ScoreSheetForm } from './ScoreSheetForm'

const short = (t: string) => (t.length > 28 ? `${t.slice(0, 28)}…` : t)

/** `/simulados/:id`: cenário (respeitando o RF-75), cartas, áudio, ficha e nota oficial. */
export function SimulationDetail() {
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const role = profile?.role ?? 'aluna'
  const detail = useSimulation(id)
  const scores = useScores(id)
  const advance = useAdvanceSimulation()

  if (detail.isLoading) return <p role="status" className="p-6 text-muted">Carregando o simulado…</p>
  if (!detail.data) return <p role="alert" className="p-6 text-danger">Simulado não encontrado.</p>

  const { summary, scenario, cards, recording } = detail.data
  const hidden = isScenarioHidden(summary.mode, summary.status, role)
  // RF-76a: no treino em andamento as complicações e as cartas só aparecem como cartas, nunca aqui.
  const secret = role === 'aluna' && summary.mode === 'treino' && summary.status === 'em_andamento'
  const canEnd = summary.status === 'em_andamento'
    && ((role === 'mentor' && summary.mode === 'surpresa') || (role === 'aluna' && summary.mode === 'treino'))
  const sheets = scores.data ?? []
  const student = sheets.find((s) => s.raterRole === 'aluna')
  const mentor = sheets.find((s) => s.raterRole === 'mentor')
  const official = student && mentor ? officialScore(student.scores, mentor.scores) : null

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-6 pb-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl leading-tight font-black text-brand text-glow">{statusLabel(summary.mode, summary.status, role)}</h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {formatWhen(summary.createdAt)}
          <Badge tone="muted">{DIFFICULTY_LABEL[summary.difficulty]}</Badge>
          {summary.isBoss && <Badge tone="streak">Chefe</Badge>}
        </p>
      </header>

      {hidden && <Card><p>O cenário aparece quando o mentor encerrar o simulado.</p></Card>}

      {!hidden && scenario && (
        <Card className="flex flex-col gap-2">
          <h2 className="font-display text-2xl font-black">Cenário</h2>
          <p><span className="font-bold text-muted">Objetivo:</span> {scenario.objective.label}</p>
          {scenario.objective.mentorRole && <p><span className="font-bold text-muted">Papel do mentor:</span> {scenario.objective.mentorRole}</p>}
          {scenario.objective.studentGoal && <p><span className="font-bold text-muted">Meta dela:</span> {scenario.objective.studentGoal}</p>}
          <p><span className="font-bold text-muted">Cliente:</span> {scenario.profile.label}</p>
          <p><span className="font-bold text-muted">Produto:</span> {scenario.product.label}</p>
          {secret
            ? <p className="text-sm text-muted">As complicações aparecem como cartas durante o treino.</p>
            : scenario.complications.map((c) => (
              <p key={c.id}><span className="font-bold text-muted">Complicação:</span> {c.label}{c.clientLine ? ` — “${c.clientLine}”` : ''}</p>
            ))}
        </Card>
      )}

      {!secret && cards.length > 0 && (
        <section aria-labelledby="cartas" className="flex flex-col gap-2">
          <h2 id="cartas" className="font-display text-2xl font-black">Cartas do treino</h2>
          <ol className="flex flex-col gap-2">
            {cards.map((c) => (
              <li key={c.position} className="rounded-card border border-edge bg-surface p-3">
                <span className="font-bold tabular-nums">{c.shownAtSec === null ? 'Não apareceu' : mmss(c.shownAtSec)}</span> · {c.text}
              </li>
            ))}
          </ol>
        </section>
      )}

      {recording && (
        <RecordingPlayer simulationId={id} recording={recording} role={role}
          markers={cards.flatMap((c) => (c.shownAtSec === null ? [] : [{ atSec: c.shownAtSec, label: short(c.text) }]))} />
      )}

      {canEnd && (
        <>
          <Button variant="danger" loading={advance.isPending} onClick={() => advance.mutate({ id, to: 'aguardando_notas' })}>
            {summary.mode === 'surpresa' ? 'Encerrar simulado' : 'Encerrar treino'}
          </Button>
          {advance.error && <p role="alert" className="text-danger">{advance.error.message}</p>}
        </>
      )}

      {canSubmitScore(summary) && <ScoreSheetForm simulationId={id} />}
      {summary.myScoreDone && summary.status !== 'concluido' && <p role="status" className="text-muted">Ficha enviada. Falta a ficha da outra pessoa.</p>}
      {summary.mode === 'treino' && summary.status !== 'concluido' && (
        <p className="text-sm text-muted">Treino ainda não conta na média oficial: só depois da nota do mentor.</p>
      )}

      {summary.status === 'concluido' && official && student && mentor && (
        <section aria-labelledby="oficial" className="flex flex-col gap-3">
          <h2 id="oficial" className="font-display text-2xl font-black">Nota oficial</h2>
          <p className="font-display text-5xl font-black tabular-nums text-brand">{official.total.toFixed(1)} <span className="text-xl text-muted">de 30</span></p>
          <table className="w-full text-left">
            <thead><tr className="text-sm text-muted"><th scope="col">Critério</th><th scope="col">Aluna</th><th scope="col">Mentor</th><th scope="col">Oficial</th></tr></thead>
            <tbody>
              {CRITERIA.map((c) => (
                <tr key={c} className="border-t border-edge">
                  <th scope="row" className="py-2 font-normal">{CRITERIA_LABELS[c].label}</th>
                  <td className="tabular-nums">{student.scores[c]}</td>
                  <td className="tabular-nums">{mentor.scores[c]}</td>
                  <td className="font-bold tabular-nums">{official.byCriterion[c].toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {[['Aluna', student], ['Mentor', mentor]].map(([who, s]) => (
            <Card key={who as string} className="flex flex-col gap-1">
              <h3 className="font-bold">{who as string}</h3>
              {(s as typeof student).good && <p><span className="font-bold text-muted">Foi bom:</span> {(s as typeof student).good}</p>}
              {(s as typeof student).improve && <p><span className="font-bold text-muted">Melhorar:</span> {(s as typeof student).improve}</p>}
            </Card>
          ))}
        </section>
      )}
    </main>
  )
}
```

`src/features/simulations/SimulationPage.tsx`:
```tsx
import { useLocation, useNavigate, useParams } from 'react-router'
import { SimulationDetail } from './SimulationDetail'
import { useSimulation } from './hooks'
import { SoloTraining } from './SoloTraining'
import type { TrainingPlan } from './types'

/**
 * `/simulados/:id`. Logo depois de sortear, a aluna chega com o plano das cartas no estado da rota e cai no treino;
 * em qualquer outro caso (inclusive recarregar a página no meio do treino) mostra o detalhe do simulado.
 */
export function SimulationPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const detail = useSimulation(id)
  const plan = (location.state as { plan?: TrainingPlan } | null)?.plan
  const data = detail.data

  if (plan && data && data.summary.mode === 'treino' && data.summary.status === 'em_andamento' && data.scenario) {
    const cards = data.cards.map((c) => ({ position: c.position, kind: c.kind, refId: c.refId, text: c.text, atSec: plan.cardTimes[c.position] ?? 0 }))
    return (
      <SoloTraining simulationId={id} scenario={data.scenario} cards={cards} durationSec={plan.durationSec}
        onDone={() => navigate(`/simulados/${id}`, { replace: true })} />
    )
  }
  return <SimulationDetail />
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/simulations/SimulationDetail.test.tsx src/features/simulations/SimulationPage.test.tsx 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/simulations/SimulationDetail.tsx src/features/simulations/SimulationDetail.test.tsx src/features/simulations/SimulationPage.tsx src/features/simulations/SimulationPage.test.tsx
git commit -m "feat(simulations): simulation detail with scenario reveal, cards, recording, scores and official result"
```

---

### Task 32: Rotas, aba "Simulados" e E2E — **[W4]**

**Files:**
- Create: `src/features/simulations/SimulationsPage.tsx`, `e2e/simulations.spec.ts`
- Modify: `src/features/shell/AppShell.tsx`, `src/features/shell/AppShell.test.tsx`, `src/App.tsx`, `src/App.test.tsx`, `e2e/support.ts`

**Interfaces:**
- Consumes: todas as telas das Tasks 25–31; `RequireAuth` (com `role`); `PixelIcon name="reels"`; migration (Task 21) e hooks (Task 23) já aplicados; helpers do E2E da Parte 3 (`signIn`, `studentEmail`).
- Produces: rotas `/simulados` (roleta + histórico + fila do mentor), `/simulados/:id` e `/cenarios` (só mentor); aba "Simulados" na `BottomNav`; `mentorEmail()` e `resetSimulations()` em `e2e/support.ts`.

- [ ] **Step 1: Testes unitários das rotas e da aba**

Em `src/features/shell/AppShell.test.tsx`, acrescentar a rota `<Route path="simulados/:id" element={<h1>Tela simulado</h1>} />` ao lado das outras dentro de `renderAt` e o caso:
```tsx
test('aba Simulados continua ativa dentro de um simulado', () => {
  renderAt('/simulados/abc')
  expect(screen.getByRole('link', { name: 'Simulados' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Trilha' })).not.toHaveAttribute('aria-current')
})
```

Em `src/App.test.tsx`, acrescentar no fim (o mock de `@/lib/supabase` do arquivo já devolve sessão vazia):
```tsx
test('rotas de simulados e de cenários exigem login', async () => {
  for (const path of ['/simulados', '/simulados/abc', '/cenarios']) {
    const { unmount } = render(<MemoryRouter initialEntries={[path]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    unmount()
  }
})
```

- [ ] **Step 2: E2E — apoio e teste**

Em `e2e/support.ts`, substituir a função `studentEmail` (o bloco inteiro, do comentário `/** E-mail da conta aluna local ... */` até o `}` que a fecha) por:
```ts
async function accountEmail(role: 'aluna' | 'mentor', fallbackEmail: string, name: string): Promise<string> {
  const { data: existing, error } = await admin.from('profiles').select('id').eq('role', role).maybeSingle()
  if (error) throw error
  if (existing) {
    const { data, error: userError } = await admin.auth.admin.getUserById(existing.id)
    if (userError || !data.user.email) throw userError ?? new Error(`Conta ${role} sem e-mail`)
    return data.user.email
  }
  const { data, error: createError } = await admin.auth.admin.createUser({ email: fallbackEmail, email_confirm: true })
  if (createError) throw createError
  const { error: profileError } = await admin.from('profiles').insert({ id: data.user.id, role, name })
  if (profileError) throw profileError
  return fallbackEmail
}

/** E-mail da conta aluna local; cria uma conta de teste se ainda não existir. */
export const studentEmail = () => accountEmail('aluna', 'aluna.e2e@trilha.test', 'Aluna E2E')

/** E-mail da conta mentor local; cria uma conta de teste se ainda não existir. */
export const mentorEmail = () => accountEmail('mentor', 'mentor.e2e@trilha.test', 'Mentor E2E')

/** Apaga todos os simulados do banco local (fichas, cartas e gravações vão junto, por cascata). */
export async function resetSimulations(): Promise<void> {
  const r = await admin.from('simulations').delete().not('id', 'is', null)
  if (r.error) throw r.error
}
```

> **Atenção:** `resetSimulations` apaga todos os simulados do banco **local**; `e2e/support.ts` continua se recusando a rodar contra qualquer URL que não seja `localhost`/`127.0.0.1`.


`e2e/simulations.spec.ts`:
```ts
import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { mentorEmail, resetSimulations, signIn, studentEmail } from './support'

/** Cada pessoa em um contexto próprio (sessões separadas), no mesmo formato de celular do projeto. */
async function pageFor(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL: 'http://localhost:5173' })
  const page = await context.newPage()
  await signIn(page, email)
  return page
}

async function sendSheet(page: Page, note: number) {
  for (const criterion of ['Abertura', 'Tom e energia', 'Perguntas', 'Escuta', 'Objeção', 'Fechamento']) {
    await page.getByRole('group', { name: criterion }).getByText(String(note), { exact: true }).click()
  }
  await page.getByRole('button', { name: 'Enviar ficha' }).click()
  await expect(page.getByText('Ficha enviada. Falta a ficha da outra pessoa.').or(page.getByRole('heading', { name: 'Nota oficial' }))).toBeVisible()
}

test.beforeEach(async () => { await resetSimulations() })

test('surpresa: a aluna só vê o cenário depois que o mentor encerra; duas fichas geram a nota oficial', async ({ browser }) => {
  const mentor = await pageFor(browser, await mentorEmail())
  await mentor.getByRole('link', { name: 'Simulados', exact: true }).click()
  await mentor.getByRole('button', { name: 'Girar a roleta' }).click()
  await mentor.getByRole('button', { name: 'Iniciar simulado surpresa' }).click() // habilita quando os 4 rolos param
  await expect(mentor).toHaveURL(/\/simulados\/[0-9a-f-]{36}$/)
  await expect(mentor.getByRole('heading', { name: 'Cenário' })).toBeVisible()
  const detailUrl = mentor.url()

  const student = await pageFor(browser, await studentEmail())
  await student.goto(detailUrl)
  await expect(student.getByRole('heading', { level: 1, name: 'Simulado surpresa em andamento' })).toBeVisible()
  await expect(student.getByRole('heading', { name: 'Cenário' })).toHaveCount(0)

  await mentor.getByRole('button', { name: 'Encerrar simulado' }).click()
  await expect(mentor.getByRole('button', { name: 'Enviar ficha' })).toBeVisible()
  await student.reload()
  await expect(student.getByRole('heading', { name: 'Cenário' })).toBeVisible()

  await sendSheet(student, 3)
  await sendSheet(mentor, 5)
  await student.reload()
  await expect(student.getByRole('heading', { name: 'Nota oficial' })).toBeVisible()
  await expect(student.getByText('24.0')).toBeVisible()
})
```


- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test 2>&1 | tail -8 && set -a; eval "$(npx supabase status -o env)"; set +a; npx playwright test e2e/simulations.spec.ts 2>&1 | tail -12`
Expected: os 2 testes novos do Vitest FAIL (aba e rotas inexistentes); o E2E FAIL em `getByRole('link', { name: 'Simulados' })` (a aba ainda não existe).

- [ ] **Step 4: Implementar a página, a aba e as rotas**


`src/features/simulations/SimulationsPage.tsx`:
```tsx
import { ReviewQueue } from './ReviewQueue'
import { SimulationsHome } from './SimulationsHome'

/** `/simulados`: roleta e histórico; para o mentor, também a fila de treinos para avaliar. */
export function SimulationsPage() {
  return (
    <>
      <SimulationsHome />
      <div className="mx-auto max-w-md px-4 pb-8"><ReviewQueue /></div>
    </>
  )
}
```


Em `src/features/shell/AppShell.tsx`: acrescentar em `NAV`, depois de Trilha, `{ to: '/simulados', label: 'Simulados', icon: <PixelIcon name="reels" /> }` e trocar o comentário para `// E6 acrescenta "Caderno".`

Em `src/App.tsx`: acrescentar os imports
```tsx
import { ScenarioBankEditor } from './features/simulations/ScenarioBankEditor'
import { SimulationPage } from './features/simulations/SimulationPage'
import { SimulationsPage } from './features/simulations/SimulationsPage'
```
e, dentro do `<Route element={<RequireAuth><AppShell /></RequireAuth>}>`, depois de `trilha/:nodeId`:
```tsx
<Route path="simulados" element={<SimulationsPage />} />
<Route path="simulados/:id" element={<SimulationPage />} />
<Route path="cenarios" element={<RequireAuth role="mentor"><ScenarioBankEditor /></RequireAuth>} />
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test 2>&1 | tail -8 && set -a; eval "$(npx supabase status -o env)"; set +a; npx playwright test 2>&1 | tail -8`
Expected: Vitest verde; Playwright `2 passed` (o E2E da trilha e o de simulados). O E2E de simulados leva ~10 s por causa da animação da roleta.

- [ ] **Step 6: Verificação final da etapa**

Run: `npm test 2>&1 | tail -6 && npx supabase test db 2>&1 | tail -5 && npm run build 2>&1 | tail -4 && npm run lint 2>&1 | tail -4`
Expected: tudo verde (avisos antigos do `oxlint` em `AuthProvider` e `TodayScreen` não são desta etapa).

- [ ] **Step 7: Commit**

```bash
git add src/features/simulations/SimulationsPage.tsx src/features/shell/AppShell.tsx src/features/shell/AppShell.test.tsx src/App.tsx src/App.test.tsx e2e/simulations.spec.ts e2e/support.ts
git commit -m "feat(simulations): simulations routes, nav tab and surprise-flow e2e"
```

---

## Cobertura dos RFs da E5

| RF | Onde |
|---|---|
| RF-70 (4 rolos animados, parada em sequência) | Task 26 |
| RF-71 (dificuldade pela fase, editável; "Nenhuma" só no fácil) | Task 8 (`drawScenario`) + Task 27 |
| RF-72 (não repetir os últimos 3 objetivos) | Task 8 + Task 23 (`useRecentObjectives`) + Task 27 |
| RF-73 (girar de novo antes de iniciar) | Task 20 (`canRespin`) + Task 26 (`spinId`) + Task 27 |
| RF-74 (reduced motion) | Task 26 |
| RF-75 (surpresa: cenário oculto até o encerramento, no banco) | Task 21 (`simulation_guard`, RLS) + Task 31 + E2E na Task 32 |
| RF-76, 76a (treino solo; complicações ocultas) | Tasks 27, 28, 31 |
| RF-76b (cronômetro 5/10 min, áudio mono ~24 kbps, limite 12 min) | Tasks 22 e 24 |
| RF-76c, 76d (horários e quantidade de cartas) | Task 8 (`planCards`) + Tasks 24 e 27 |
| RF-76e (só texto; carta fica até "Respondi" ou a próxima) | Tasks 24 e 28 |
| RF-76f (momento da carta vira marcador no áudio) | Tasks 23 (`useRecordCardShown`), 28 e 30 |
| RF-76g (envio ao Storage, fila offline, aviso "pendente") | Tasks 21 (pasta/policy), 22, 23 e 27 |
| RF-76h, 76i ("Treinos para avaliar", nota do mentor no treino) | Tasks 20 (`needsMentorReview`), 30 e 31 |
| RF-76j (retenção de 30 dias, "guardar") | Task 21 (`delete_after`) + Task 30; job `pg_cron` na E8 |
| RF-77 (simulado chefe de 10 min) | Task 27 |
| RF-78, 79 (6 critérios, bom/melhorar) | Task 29 |
| RF-80 (uma ficha cada; a do outro só depois das duas) | Task 5 (RLS) + Task 21 (`score_guard`) + Tasks 29 e 31 |
| RF-81 (nota oficial = média das duas) | Task 7 + Task 31 |
| RF-82 (treino sem nota do mentor não entra na média) | Tasks 5 (`v_simulation_official`), 20 (`countsInOfficial`) e 21 (`v_simulation_results`) |
| RF-83 (estados do simulado) | Task 21 (triggers) + Tasks 20, 23 e 31 |
| RF-84, 85 (banco editável, papel do mentor e meta) | Tasks 20 (`validateReelItem`) e 25 |
| RF-40 (itens automáticos do portão com dados reais) | Tasks 20 (`simulationFactsOf`), 21 (`v_simulation_results`) e 23 (`useNodeStates`) |

## Após a Parte 4

Com as Tasks 20–32 verdes, a E5 está concluída. Não entram nesta etapa (e ficam registrados): Wake Lock durante o treino e o job `pg_cron` que apaga áudios vencidos (**E8**); notificação "TRIIIM" (v2); E2E do treino com microfone falso do Chromium (`--use-fake-device-for-media-stream`), que pode ser acrescentado depois do go-live da E5. Próximo passo: detalhar **E6 — Caderno e Biblioteca** (nova "Parte 5"), reaproveitando `journal.ts`, `streak.ts`, `TextArea` e o padrão de hooks isolados.

---

# Parte 5 — Plano detalhado: E6 Caderno e Biblioteca

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o caderno diário obrigatório (3 campos, prazo até 12:00 do dia seguinte, marca de atraso, sempre visível ao mentor), as notas livres (privadas por padrão, Markdown simples, busca e salvamento automático), as checklists manuais, a biblioteca com upload de PDF só do mentor e o leitor que retoma a última página, fechando com um E2E "caderno do dia enviado → mentor vê".

**Architecture:** As regras continuam puras em `src/domain` (`journalDays`, `markdown`, `notes`, `checklists`, `library`, mais `journal` e `streak` da Parte 2). O que precisa ser garantido fica no banco: `complete`, `late` e os horários do caderno (triggers da Parte 2), privacidade das notas (RLS), limites e coerência dos dados, pasta e tipo dos PDFs (uma migration nova com pgTAP). O acesso ao Supabase fica isolado em um módulo de hooks por área (`journal`, `notes`, `checklists`, `library`), com o contrato publicado primeiro (Task 33) para o W4 mockar; salvamento automático e Markdown seguro são utilitários compartilhados (`useAutosave`, `Markdown`).

**Tech Stack:** o da Parte 1. Única dependência nova: `react-pdf@^11` (já prevista no Tech Stack; traz o PDF.js), instalada só na Task 39.

**Spec:** `PRD.md` RF-42 (checklists manuais), §4.6 (RF-50–54), §4.7 (RF-60–65), §7 e §7.1.

## Global Constraints (adicionais às Partes 1–4)

- Telas só importam os hooks da própria área (`@/features/journal/hooks`, `notes`, `checklists`, `library`), nunca `@/lib/supabase`. Testes de tela começam com `vi.mock('@/lib/supabase', () => ({ supabase: {} }))` e `vi.mock('./hooks')` e usam as fábricas de `src/test/e6Mocks.ts`.
- Rotas finais (as da Parte 3 já apontam para elas): `/caderno` (dia de hoje), `/caderno/dia/:date`, `/caderno/notas`, `/caderno/notas/nova?semana=<id>|livro=<id>|video=<id>|simulado=<id>`, `/caderno/notas/:id`, `/caderno/checklists`, `/biblioteca`, `/biblioteca/:bookId`.
- Caderno (RF-50): cada campo com pelo menos 15 caracteres (`MIN_FIELD`); dia D aberto até 12:00 de D+1 em `America/Sao_Paulo`; `complete`, `late`, `created_at` e `updated_at` são do banco (o cliente nunca os envia); só a aluna escreve; o mentor lê tudo; ninguém apaga.
- Notas (RF-52): privadas por padrão; o mentor só vê as com `private = false` (RLS); as notas do mentor são só dele (a aluna nunca as lê). Salvamento automático ~1 s depois da última alteração, com o indicador "Salvo" (RF-54).
- Ids de notas, checklists e itens são gerados no cliente (`crypto.randomUUID()`): reenviar o mesmo salvamento nunca duplica nada.
- Markdown das notas é desenhado como elementos React, nunca como HTML cru; só links `http(s)` e `mailto` viram link; links externos abrem com `rel="noopener noreferrer"`.
- PDFs (RF-61/65): só o mentor envia ou remove; até 50 MB; só PDF; bucket privado; leitura por URL assinada de 1 h; cada envio usa um nome novo `<book_id>/<timestamp>.pdf` e o arquivo anterior só é apagado depois que o livro aponta para o novo. Só a aluna grava a página lida.
- O leitor de PDF (PDF.js) carrega sob demanda (`lazy`), sem camadas de texto e de anotação; o worker vem do próprio `pdfjs-dist`.
- Visual: só componentes e tokens de `src/design`; nenhum estilo novo. `font-display` só em títulos ≥ 20 px.
- `package.json` só na Task 39. Migration só na Task 34 (`supabase/migrations/20260930000002_notes_library.sql`; se já existir uma migration com timestamp maior, use um timestamp maior que o último). `src/App.tsx`, `src/features/shell/AppShell.tsx`, `src/features/today/TodayScreen.tsx` (e o teste) e `e2e/support.ts` só na Task 43.

## Review Focus

1. **Fronteira do prazo do caderno:** o dia de ontem às 11:59 (SP) ainda é preenchível e vira "preenchido com atraso"; às 12:00 fica fechado, os campos ficam desabilitados, nada é salvo e o banco recusa com "O prazo deste dia já passou…"; o fuso do aparelho não muda isso. → domínio na Task 33, mapeamento do erro na Task 36, tela na Task 41 (e o pgTAP da Parte 2 continua valendo).
2. **Nota privada vista pelo mentor:** uma nota privada da aluna não aparece para o mentor nem consultando a API; a compartilhada aparece como somente leitura; o mentor não edita nota alheia nem tem a opção de compartilhar. → pgTAP na Task 34 e telas na Task 42.
3. **Perda de texto na edição:** sair da tela ou trocar de aba com alteração pendente salva na hora; respostas fora de ordem nunca sobrescrevem texto mais novo; salvar duas vezes (autosave, toque duplo) não cria duas notas. → Task 35, Task 36 (`upsert` por id) e Task 42.
4. **PDF fora do combinado:** arquivo que não é PDF, acima de 50 MB, enviado pela aluna ou para uma pasta que não é de um livro é recusado (cliente e banco); trocar o PDF apaga o antigo sem deixar linha apontando para arquivo inexistente; PDF trocado por um menor abre na última página que existe. → Tasks 33, 34, 37, 39.
5. **Script injetado por texto:** `<script>`, `<img onerror>` e `[x](javascript:…)` na nota aparecem como texto; `javascript:` no link externo do livro é recusado (cliente e banco). → Tasks 33, 34 e 35.

## Ordem e paralelismo

Só W3 e W4 (o W1 fica fora por limite de uso). O W3 faz contrato, banco, hooks e utilitários; o W4 faz todas as telas e o E2E.

| Passo | Task | Dono | Depende de | Roda em paralelo com |
|---|---|---|---|---|
| 1 | 33 — Contrato de dados e domínio | **W3** | Tasks 1–32 | — |
| 2 | 35 — `useAutosave`, `useDebounced` e `Markdown` | **W3** | 33 | 38, 39 |
| 2 | 38 — ChecklistsScreen e ChecklistEditor | **W4** | 33 | 35 |
| 2 | 39 — PdfReader (instala `react-pdf`) | **W4** | 33 | 35 |
| 3 | 36 — Hooks do caderno, das notas e das checklists | **W3** | 33 | 34, 40, 41 |
| 3 | 34 — Migration: notas, biblioteca e Storage | **W3** | 21 (migrations anteriores) | 36, 40, 41 |
| 3 | 40 — LibraryScreen, BookScreen e BookAdmin | **W4** | 33, 39 | 34, 36 |
| 3 | 41 — JournalScreen, JournalForm e MentorJournal | **W4** | 33, 35 | 34, 36 |
| 4 | 37 — Hooks da biblioteca | **W3** | 33, 36 | 42 |
| 4 | 42 — NotesScreen e NoteEditor | **W4** | 33, 35 | 37 |
| 5 | 43 — Rotas, aba "Caderno", aviso da tela Hoje e E2E | **W4** | 34, 36–42 | — |

**Arquivos compartilhados (evitar conflito):** `src/test/fakeSupabase.ts` só na Task 36; `src/features/*/hooks.ts` são do W3 (esqueletos na 33, implementação na 36 e na 37); as telas do W4 não editam nada do W3. `src/features/simulations/format.ts` (da E5) é só lido (`formatWhen`).

**Contrato para mockar:** a partir da Task 33, o W4 escreve os testes de tela contra `vi.mock('./hooks')` e `src/test/e6Mocks.ts`, sem esperar as Tasks 36 e 37.

## Estrutura de arquivos (criada nesta parte)

```
supabase/
├── migrations/20260930000002_notes_library.sql        # T34
└── tests/journal_notes_library.test.sql               # T34
src/
├── domain/
│   ├── journalDays.ts, markdown.ts, notes.ts, checklists.ts, library.ts (+ .test.ts)   # T33
├── lib/
│   ├── useAutosave.ts, useDebounced.ts (+ teste)      # T35
│   └── db.ts                                          # T36 (fail, myId)
├── test/e6Mocks.ts                                    # T33
├── features/
│   ├── e6Contract.test.ts                             # T33
│   ├── journal/   types.ts, hooks.ts (T33 esqueleto → T36), hooks.test.tsx (T36),
│   │              JournalForm.tsx, MentorJournal.tsx, JournalScreen.tsx (+ testes) (T41), CadernoLayout.tsx (T43)
│   ├── notes/     types.ts, hooks.ts (T33 → T36), Markdown.tsx (T35), NotesScreen.tsx, NoteEditor.tsx (T42)
│   ├── checklists/ types.ts, hooks.ts (T33 → T36), ChecklistEditor.tsx, ChecklistsScreen.tsx (T38)
│   └── library/   types.ts, hooks.ts (T33 → T37), pdfWorker.ts, PdfReader.tsx (T39),
│                  BookAdmin.tsx, LibraryScreen.tsx, BookScreen.tsx (T40)
└── App.tsx, features/shell/AppShell.tsx, features/today/TodayScreen.tsx   # T43
e2e/journal.spec.ts, e2e/support.ts                    # T43
```

---

### Task 33: Contrato de dados e domínio do caderno, das notas, das listas e da biblioteca — **[W3]**

**Files:**
- Create: `src/domain/journalDays.ts`, `src/domain/markdown.ts`, `src/domain/notes.ts`, `src/domain/checklists.ts`, `src/domain/library.ts`, `src/features/journal/types.ts`, `src/features/notes/types.ts`, `src/features/checklists/types.ts`, `src/features/library/types.ts`, `src/features/journal/hooks.ts`, `src/features/notes/hooks.ts`, `src/features/checklists/hooks.ts`, `src/features/library/hooks.ts` (esqueletos), `src/test/e6Mocks.ts`
- Test: `src/domain/journalDays.test.ts`, `src/domain/markdown.test.ts`, `src/domain/notes.test.ts`, `src/domain/checklists.test.ts`, `src/domain/library.test.ts`, `src/features/e6Contract.test.ts`

**Interfaces:**
- Consumes: `writeWindow` (`@/domain/journal`); `spDate`, `addDays` (`@/lib/dates`); `NODES` (`@/content/trail`); `weekday` (`@/domain/routine`); `asyncMutationOf`, `queryOf`, `mutationOf` (`@/test/simulationMocks`).
- Produces (**contrato usado por W3 e W4 — não renomear**):
  - `journalDays.ts`: `DayStatus = 'done' | 'done_late' | 'open' | 'late_window' | 'missing' | 'future'`, `DayEntry { complete; late }`, `DAY_STATUS_LABEL`, `journalDayStatus(date, now, entry?)`, `lastDays(today, n)` (do mais novo ao mais antigo), `yesterdayNotice(completeDates, now): { kind: 'missing' | 'late_window'; date } | null`.
  - `markdown.ts`: `Inline`, `Block`, `safeHref(raw)`, `parseInline(s)`, `parseMarkdown(src)`.
  - `notes.ts`: `NoteLinkType`, `NoteLink { type; id }`, `noteLinkFromParams(URLSearchParams)`, `noteLinkLabel(link)`, `noteLinkPath(link)`, `snippet(body, max?)`.
  - `checklists.ts`: `ChecklistDraft`, `validateChecklistDraft(draft): string | null`, `checklistProgress(items)`.
  - `library.ts`: `MAX_PDF_BYTES`, `validatePdfFile(file): string | null`, `bookFilePath(bookId, stamp)`, `normalizeExternalUrl(raw): string | null`, `clampPage(page, total)`, `phaseLabel(phase)`.
  - Tipos por área em `types.ts`: `JournalEntry`, `SaveJournalVars`; `Note`, `SaveNoteVars`; `Checklist`, `ChecklistItem`, `SaveChecklistVars`, `ToggleChecklistItemVars`; `Book`, `BookProgress`, `SaveProgressVars`, `UploadBookVars`, `RemoveBookFileVars`, `SaveBookLinkVars`.
  - Cada `hooks.ts` exporta **exatamente**: `journal`: `useJournalEntries(): UseQueryResult<JournalEntry[]>`, `useSaveJournalEntry(): UseMutationResult<JournalEntry, Error, SaveJournalVars>`; `notes`: `useNotes(search: string): UseQueryResult<Note[]>`, `useNote(id: string | undefined): UseQueryResult<Note | null>`, `useSaveNote(): UseMutationResult<void, Error, SaveNoteVars>`, `useDeleteNote(): UseMutationResult<void, Error, string>`; `checklists`: `useChecklists(): UseQueryResult<Checklist[]>`, `useSaveChecklist(): UseMutationResult<void, Error, SaveChecklistVars>`, `useToggleChecklistItem(): UseMutationResult<void, Error, ToggleChecklistItemVars>`, `useDeleteChecklist(): UseMutationResult<void, Error, string>`; `library`: `useBooks(): UseQueryResult<Book[]>` (cada livro com a página lida em `progress`), `useBookUrl(filePath: string | null): UseQueryResult<string>`, `useSaveBookProgress(): UseMutationResult<void, Error, SaveProgressVars>`, `useUploadBook(): UseMutationResult<void, Error, UploadBookVars>`, `useRemoveBookFile(): UseMutationResult<void, Error, RemoveBookFileVars>`, `useSaveBookLink(): UseMutationResult<void, Error, SaveBookLinkVars>`.
  - `src/test/e6Mocks.ts`: `entryOf`, `noteOf`, `checklistOf`, `bookOf`, `courseOf` (todos aceitam `Partial<…>`), e re-exporta `queryOf`, `mutationOf`, `asyncMutationOf`.
- O `journal_days` usado por `useJournalDays` (streak e tela Hoje) é invalidado pela Task 36 depois de cada gravação do caderno.

- [ ] **Step 1: Testes do domínio**


`src/domain/journalDays.test.ts`:
```ts
import { DAY_STATUS_LABEL, journalDayStatus, lastDays, yesterdayNotice } from './journalDays'

const at = (iso: string) => new Date(iso)
// 30/09 às 11:59 em SP = 14:59Z; ao meio-dia = 15:00Z
const NOON_MINUS = at('2026-09-30T14:59:00Z')
const NOON = at('2026-09-30T15:00:00Z')

test('fronteira das 12:00 de São Paulo (Review Focus 1)', () => {
  expect(journalDayStatus('2026-09-29', NOON_MINUS, undefined)).toBe('late_window')
  expect(journalDayStatus('2026-09-29', NOON, undefined)).toBe('missing')
})

test('o fuso do aparelho não muda o resultado: 02:59Z do dia 30 ainda é 29 em SP', () => {
  expect(journalDayStatus('2026-09-29', at('2026-09-30T02:59:00Z'), undefined)).toBe('open')
})

test('entrada completa: no prazo ou com atraso, mesmo depois de fechado', () => {
  expect(journalDayStatus('2026-09-29', NOON, { complete: true, late: false })).toBe('done')
  expect(journalDayStatus('2026-09-29', NOON, { complete: true, late: true })).toBe('done_late')
})

test('rascunho incompleto continua pendente até fechar', () => {
  expect(journalDayStatus('2026-09-30', NOON, { complete: false, late: false })).toBe('open')
  expect(journalDayStatus('2026-09-27', NOON, { complete: false, late: false })).toBe('missing')
})

test('dia futuro', () => {
  expect(journalDayStatus('2026-10-01', NOON, undefined)).toBe('future')
  expect(DAY_STATUS_LABEL.missing).toBe('Em falta')
})

test('últimos dias, do mais novo ao mais antigo', () => {
  expect(lastDays('2026-10-01', 3)).toEqual(['2026-10-01', '2026-09-30', '2026-09-29'])
})

test('aviso de ontem na tela Hoje', () => {
  expect(yesterdayNotice(new Set(), NOON)).toEqual({ kind: 'missing', date: '2026-09-29' })
  expect(yesterdayNotice(new Set(), NOON_MINUS)).toEqual({ kind: 'late_window', date: '2026-09-29' })
  expect(yesterdayNotice(new Set(['2026-09-29']), NOON)).toBeNull()
})
```

`src/domain/markdown.test.ts`:
```ts
import { parseInline, parseMarkdown, safeHref } from './markdown'

test('parágrafos, títulos e listas', () => {
  const b = parseMarkdown('# Título\n\nTexto **forte** e *leve*.\n\n- um\n- dois\n\n1. a\n2. b')
  expect(b.map((x) => x.t)).toEqual(['h', 'p', 'ul', 'ol'])
  expect(b[0]).toMatchObject({ t: 'h', level: 1 })
  expect(b[2]).toMatchObject({ t: 'ul' })
  expect((b[2] as { items: unknown[] }).items).toHaveLength(2)
})

test('negrito, itálico, código e link válido', () => {
  expect(parseInline('a **b** *c* `d` [e](https://x.com)')).toEqual([
    { t: 'text', v: 'a ' }, { t: 'strong', c: [{ t: 'text', v: 'b' }] }, { t: 'text', v: ' ' },
    { t: 'em', c: [{ t: 'text', v: 'c' }] }, { t: 'text', v: ' ' }, { t: 'code', v: 'd' }, { t: 'text', v: ' ' },
    { t: 'link', href: 'https://x.com', c: [{ t: 'text', v: 'e' }] },
  ])
})

test('link perigoso vira texto (Review Focus 5)', () => {
  expect(safeHref('javascript:alert(1)')).toBeNull()
  expect(safeHref('data:text/html,<script>')).toBeNull()
  expect(safeHref('HTTPS://ok.com')).toBe('HTTPS://ok.com')
  expect(parseInline('[clique](javascript:alert(1))')).toEqual([{ t: 'text', v: '[clique](javascript:alert(1))' }])
})

test('HTML cru nunca vira marcação: fica como texto', () => {
  expect(parseMarkdown('<script>alert(1)</script>')).toEqual([{ t: 'p', c: [{ t: 'text', v: '<script>alert(1)</script>' }] }])
  expect(parseInline('<img src=x onerror=alert(1)>')).toEqual([{ t: 'text', v: '<img src=x onerror=alert(1)>' }])
})

test('marcações abertas e vazias não quebram nem sobem texto', () => {
  expect(parseInline('2 * 3 e **aberto')).toEqual([{ t: 'text', v: '2 * 3 e **aberto' }])
  expect(parseInline('snake_case_word')).toEqual([{ t: 'text', v: 'snake_case_word' }])
  expect(parseMarkdown('')).toEqual([])
})

test('quebra de linha dentro do parágrafo é mantida; CRLF é aceito', () => {
  expect(parseMarkdown('linha 1\r\nlinha 2')).toEqual([{ t: 'p', c: [{ t: 'text', v: 'linha 1\nlinha 2' }] }])
})
```

`src/domain/notes.test.ts`:
```ts
import { noteLinkFromParams, noteLinkLabel, noteLinkPath, snippet } from './notes'

const p = (q: string) => new URLSearchParams(q)

test('vínculo vem dos parâmetros da rota', () => {
  expect(noteLinkFromParams(p('semana=w05'))).toEqual({ type: 'week', id: 'w05' })
  expect(noteLinkFromParams(p('livro=carnegie'))).toEqual({ type: 'book', id: 'carnegie' })
  expect(noteLinkFromParams(p('simulado=11111111-1111-1111-1111-111111111111'))).toMatchObject({ type: 'simulation' })
  expect(noteLinkFromParams(p('video=w01.video.1'))).toEqual({ type: 'video', id: 'w01.video.1' })
})

test('parâmetro inválido é ignorado (semana inexistente, id malformado)', () => {
  expect(noteLinkFromParams(p('semana=w99'))).toBeNull()
  expect(noteLinkFromParams(p('livro=../etc'))).toBeNull()
  expect(noteLinkFromParams(p('video=w01.reading'))).toBeNull()
  expect(noteLinkFromParams(p(''))).toBeNull()
})

test('rótulos e rotas do vínculo', () => {
  expect(noteLinkLabel({ type: 'week', id: 'w05' })).toBe('Semana 5')
  expect(noteLinkLabel({ type: 'book', id: 'carnegie' })).toBe('Livro')
  expect(noteLinkPath({ type: 'week', id: 'w05' })).toBe('/trilha/w05')
  expect(noteLinkPath({ type: 'book', id: 'carnegie' })).toBe('/biblioteca/carnegie')
})

test('resumo tira marcações e corta com reticências', () => {
  expect(snippet('# Título\n\n**forte** texto')).toBe('Título forte texto')
  expect(snippet('x'.repeat(200), 10)).toBe('xxxxxxxxxx…')
})
```

`src/domain/checklists.test.ts`:
```ts
import { checklistProgress, validateChecklistDraft, type ChecklistDraft } from './checklists'

const ok: ChecklistDraft = { title: 'Semana 5', weekId: 'w05', dueDate: '2026-10-04', items: [{ text: 'Ligar para 5 empresas' }] }

test('lista válida', () => expect(validateChecklistDraft(ok)).toBeNull())

test('título, itens e limites (RF-42)', () => {
  expect(validateChecklistDraft({ ...ok, title: '  ' })).toMatch(/título/)
  expect(validateChecklistDraft({ ...ok, title: 'x'.repeat(121) })).toMatch(/120/)
  expect(validateChecklistDraft({ ...ok, items: [] })).toMatch(/pelo menos um item/)
  expect(validateChecklistDraft({ ...ok, items: [{ text: 'a' }, { text: ' ' }] })).toMatch(/em branco/)
  expect(validateChecklistDraft({ ...ok, items: [{ text: 'x'.repeat(301) }] })).toMatch(/300/)
})

test('semana e data são opcionais, mas se vierem precisam ser válidas', () => {
  expect(validateChecklistDraft({ ...ok, weekId: null, dueDate: null })).toBeNull()
  expect(validateChecklistDraft({ ...ok, weekId: 'w99' })).toMatch(/Semana/)
  expect(validateChecklistDraft({ ...ok, weekId: 'f4-marca' })).toMatch(/Semana/)
  expect(validateChecklistDraft({ ...ok, dueDate: '2026-02-30' })).toMatch(/Data/)
})

test('progresso', () => {
  expect(checklistProgress([])).toEqual({ done: 0, total: 0, ratio: 0 })
  expect(checklistProgress([{ done: true }, { done: false }])).toEqual({ done: 1, total: 2, ratio: 0.5 })
})
```

`src/domain/library.test.ts`:
```ts
import { bookFilePath, clampPage, MAX_PDF_BYTES, normalizeExternalUrl, phaseLabel, validatePdfFile } from './library'

test('só PDF de até 50 MB (RF-61)', () => {
  expect(validatePdfFile({ name: 'a.pdf', size: 1000, type: 'application/pdf' })).toBeNull()
  expect(validatePdfFile({ name: 'a.pdf', size: 1000, type: '' })).toBeNull()
  expect(validatePdfFile({ name: 'a.exe', size: 1000, type: 'application/x-msdownload' })).toMatch(/PDF/)
  expect(validatePdfFile({ name: 'a.png', size: 1000, type: '' })).toMatch(/PDF/)
  expect(validatePdfFile({ name: 'a.pdf', size: 0, type: 'application/pdf' })).toMatch(/vazio/)
  expect(validatePdfFile({ name: 'a.pdf', size: MAX_PDF_BYTES, type: 'application/pdf' })).toBeNull()
  expect(validatePdfFile({ name: 'a.pdf', size: MAX_PDF_BYTES + 1, type: 'application/pdf' })).toMatch(/50 MB/)
})

test('caminho do arquivo fica na pasta do livro', () => {
  expect(bookFilePath('carnegie', 1730000000000)).toBe('carnegie/1730000000000.pdf')
})

test('link externo só http(s)', () => {
  expect(normalizeExternalUrl(' https://exemplo.com/livro ')).toBe('https://exemplo.com/livro')
  expect(normalizeExternalUrl('javascript:alert(1)')).toBeNull()
  expect(normalizeExternalUrl('exemplo.com')).toBeNull()
  expect(normalizeExternalUrl('')).toBeNull()
})

test('página de retomada nunca sai do intervalo do PDF (Review Focus 4)', () => {
  expect(clampPage(12, 200)).toBe(12)
  expect(clampPage(500, 200)).toBe(200)
  expect(clampPage(0, 200)).toBe(1)
  expect(clampPage(-3, null)).toBe(1)
  expect(clampPage(Number.NaN, 10)).toBe(1)
  expect(clampPage(7.9, null)).toBe(7)
})

test('rótulo de fase da biblioteca', () => {
  expect(phaseLabel('1')).toBe('Fase 1')
  expect(phaseLabel('2-3')).toBe('Fases 2 e 3')
  expect(phaseLabel('1-3')).toBe('Fases 1 a 3')
})
```


- [ ] **Step 2: Teste do contrato dos hooks**


`src/features/e6Contract.test.ts`:
```ts
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

test('os módulos de hooks do caderno, das notas, das listas e da biblioteca exportam exatamente o contrato combinado', async () => {
  expect(Object.keys(await import('./journal/hooks')).sort()).toEqual(['useJournalEntries', 'useSaveJournalEntry'])
  expect(Object.keys(await import('./notes/hooks')).sort()).toEqual(['useDeleteNote', 'useNote', 'useNotes', 'useSaveNote'])
  expect(Object.keys(await import('./checklists/hooks')).sort()).toEqual(['useChecklists', 'useDeleteChecklist', 'useSaveChecklist', 'useToggleChecklistItem'])
  expect(Object.keys(await import('./library/hooks')).sort()).toEqual(['useBookUrl', 'useBooks', 'useRemoveBookFile', 'useSaveBookLink', 'useSaveBookProgress', 'useUploadBook'])
})
```


- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/domain/journalDays.test.ts src/domain/markdown.test.ts src/domain/notes.test.ts src/domain/checklists.test.ts src/domain/library.test.ts src/features/e6Contract.test.ts 2>&1 | tail -15`
Expected: FAIL — `Failed to resolve import "./journalDays"` (e os demais módulos ainda inexistentes).

- [ ] **Step 4: Implementar o domínio**


`src/domain/journalDays.ts`:
```ts
import { addDays, spDate } from '@/lib/dates'
import { writeWindow } from './journal'

export type DayStatus = 'done' | 'done_late' | 'open' | 'late_window' | 'missing' | 'future'
export interface DayEntry { complete: boolean; late: boolean }

export const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  done: 'Completo',
  done_late: 'Preenchido com atraso',
  open: 'Pendente',
  late_window: 'Ainda dá para preencher, até 12:00',
  missing: 'Em falta',
  future: '',
}

/** RF-50: situação de um dia do caderno. O dia D fica aberto até 12:00 (SP) de D+1; depois disso, sem entrada completa, está "em falta". */
export function journalDayStatus(date: string, now: Date, entry: DayEntry | undefined): DayStatus {
  if (date > spDate(now)) return 'future'
  if (entry?.complete) return entry.late ? 'done_late' : 'done'
  const w = writeWindow(date, now)
  return w === 'on_time' ? 'open' : w === 'late' ? 'late_window' : 'missing'
}

/** Hoje e os `n - 1` dias anteriores, do mais novo para o mais antigo. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, -i))
}

/** Aviso da tela Hoje: o caderno de ontem em falta (ou ainda dentro do prazo até 12:00). */
export function yesterdayNotice(completeDates: ReadonlySet<string>, now: Date): { kind: 'missing' | 'late_window'; date: string } | null {
  const date = addDays(spDate(now), -1)
  const status = journalDayStatus(date, now, completeDates.has(date) ? { complete: true, late: false } : undefined)
  return status === 'missing' || status === 'late_window' ? { kind: status, date } : null
}
```

`src/domain/markdown.ts`:
```ts
export type Inline =
  | { t: 'text'; v: string }
  | { t: 'strong'; c: Inline[] }
  | { t: 'em'; c: Inline[] }
  | { t: 'code'; v: string }
  | { t: 'link'; href: string; c: Inline[] }

export type Block =
  | { t: 'p'; c: Inline[] }
  | { t: 'h'; level: 1 | 2 | 3; c: Inline[] }
  | { t: 'ul'; items: Inline[][] }
  | { t: 'ol'; items: Inline[][] }

/** Só http(s) e mailto viram link; qualquer outra coisa (javascript:, data:…) fica como texto. */
export function safeHref(raw: string): string | null {
  return /^(https?:\/\/|mailto:)/i.test(raw) ? raw : null
}

export function parseInline(s: string): Inline[] {
  const out: Inline[] = []
  let buf = ''
  let i = 0
  const flush = () => { if (buf) { out.push({ t: 'text', v: buf }); buf = '' } }
  while (i < s.length) {
    if (s.startsWith('**', i)) {
      const j = s.indexOf('**', i + 2)
      if (j > i + 2) { flush(); out.push({ t: 'strong', c: parseInline(s.slice(i + 2, j)) }); i = j + 2; continue }
    }
    const ch = s[i]
    if (ch === '*' && s[i + 1] !== ' ') {
      const j = s.indexOf('*', i + 1)
      if (j > i + 1) { flush(); out.push({ t: 'em', c: parseInline(s.slice(i + 1, j)) }); i = j + 1; continue }
    }
    if (ch === '`') {
      const j = s.indexOf('`', i + 1)
      if (j > i + 1) { flush(); out.push({ t: 'code', v: s.slice(i + 1, j) }); i = j + 1; continue }
    }
    if (ch === '[') {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(s.slice(i))
      if (m) {
        const href = safeHref(m[2])
        if (href) { flush(); out.push({ t: 'link', href, c: parseInline(m[1]) }) } else buf += m[0]
        i += m[0].length
        continue
      }
    }
    buf += ch
    i++
  }
  flush()
  return out
}

/** Markdown simples (RF-51): parágrafos, títulos `#`–`###`, listas `-`/`*` e `1.`, **negrito**, *itálico*, `código` e [links](https://…). Nada de HTML. */
export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null
  const flushPara = () => { if (para.length) { blocks.push({ t: 'p', c: parseInline(para.join('\n')) }); para = [] } }
  const flushList = () => { if (list) { blocks.push({ t: list.kind, items: list.items.map(parseInline) }); list = null } }

  for (const line of src.replace(/\r\n?/g, '\n').split('\n')) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    const bullet = /^\s*[-*]\s+(.+)$/.exec(line)
    const numbered = /^\s*\d+\.\s+(.+)$/.exec(line)
    if (line.trim() === '') { flushPara(); flushList(); continue }
    if (heading) { flushPara(); flushList(); blocks.push({ t: 'h', level: heading[1].length as 1 | 2 | 3, c: parseInline(heading[2]) }); continue }
    const item = bullet ?? numbered
    if (item) {
      flushPara()
      const kind = bullet ? 'ul' : 'ol'
      if (list && list.kind !== kind) flushList()
      list ??= { kind, items: [] }
      list.items.push(item[1])
      continue
    }
    flushList()
    para.push(line)
  }
  flushPara()
  flushList()
  return blocks
}
```

`src/domain/notes.ts`:
```ts
import { NODES } from '@/content/trail'

export type NoteLinkType = 'week' | 'video' | 'book' | 'simulation'
export interface NoteLink { type: NoteLinkType; id: string }

const PARAM: Record<NoteLinkType, string> = { week: 'semana', video: 'video', book: 'livro', simulation: 'simulado' }
const VALID_ID: Record<NoteLinkType, (id: string) => boolean> = {
  week: (id) => NODES.some((n) => n.id === id && n.week !== undefined),
  video: (id) => NODES.some((n) => n.items.some((i) => i.id === id && i.kind === 'video')),
  book: (id) => /^[a-z0-9-]{1,40}$/.test(id),
  simulation: (id) => /^[0-9a-f-]{36}$/i.test(id),
}

/** `/caderno/notas/nova?semana=w05` → vínculo da nota. Parâmetro desconhecido ou inválido é ignorado. */
export function noteLinkFromParams(p: URLSearchParams): NoteLink | null {
  for (const type of Object.keys(PARAM) as NoteLinkType[]) {
    const id = p.get(PARAM[type])
    if (id && VALID_ID[type](id)) return { type, id }
  }
  return null
}

export function noteLinkLabel(l: NoteLink): string {
  if (l.type === 'week') {
    const n = NODES.find((x) => x.id === l.id)
    return n?.week !== undefined ? `Semana ${n.week}` : (n?.title ?? 'Semana')
  }
  return { video: 'Vídeo', book: 'Livro', simulation: 'Simulado' }[l.type]
}

/** Rota que o vínculo abre. */
export function noteLinkPath(l: NoteLink): string {
  return { week: `/trilha/${l.id}`, video: '/trilha', book: `/biblioteca/${l.id}`, simulation: `/simulados/${l.id}` }[l.type]
}

/** Resumo de uma linha para as listas. */
export function snippet(body: string, max = 120): string {
  const flat = body.replace(/[#*`>]/g, '').replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat
}
```

`src/domain/checklists.ts`:
```ts
import { NODES } from '@/content/trail'
import { weekday } from './routine'

export interface ChecklistDraft { title: string; weekId: string | null; dueDate: string | null; items: { text: string }[] }

const validDate = (iso: string): boolean => {
  try { weekday(iso); return true } catch { return false }
}

/** RF-42: título, itens, semana e data opcionais. Devolve a mensagem de erro em pt-BR ou `null`. Limites iguais aos do banco. */
export function validateChecklistDraft(d: ChecklistDraft): string | null {
  const title = d.title.trim()
  if (title === '') return 'Dê um título para a lista.'
  if (title.length > 120) return 'O título pode ter no máximo 120 caracteres.'
  const items = d.items.map((i) => i.text.trim())
  if (items.length === 0 || items.every((t) => t === '')) return 'Acrescente pelo menos um item.'
  if (items.some((t) => t === '')) return 'Há itens em branco: preencha ou remova.'
  if (items.some((t) => t.length > 300)) return 'Cada item pode ter no máximo 300 caracteres.'
  if (d.weekId !== null && !NODES.some((n) => n.id === d.weekId && n.week !== undefined)) return 'Semana inválida.'
  if (d.dueDate !== null && !validDate(d.dueDate)) return 'Data inválida.'
  return null
}

export function checklistProgress(items: { done: boolean }[]): { done: number; total: number; ratio: number } {
  const done = items.filter((i) => i.done).length
  return { done, total: items.length, ratio: items.length === 0 ? 0 : done / items.length }
}
```

`src/domain/library.ts`:
```ts
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
```


- [ ] **Step 5: Tipos, esqueletos dos hooks e mocks de teste**


`src/features/journal/types.ts`:
```ts
export interface JournalEntry {
  date: string
  learned: string
  practiced: string
  tomorrow: string
  /** `complete`, `late`, `createdAt` e `updatedAt` são definidos pelo banco (RF-50). */
  complete: boolean
  late: boolean
  createdAt: string
  updatedAt: string
}

export interface SaveJournalVars { date: string; learned: string; practiced: string; tomorrow: string }
```

`src/features/notes/types.ts`:
```ts
import type { NoteLink } from '@/domain/notes'

export interface Note {
  id: string
  title: string
  body: string
  /** Padrão `true`: o mentor só vê notas com `private = false` (RF-52, garantido pelo RLS). */
  private: boolean
  link: NoteLink | null
  updatedAt: string
  /** A nota é de quem está logado (só o autor edita e apaga). */
  mine: boolean
}

/** `id` é gerado no cliente (`crypto.randomUUID()`), então salvar de novo nunca cria uma segunda nota. */
export interface SaveNoteVars { id: string; title: string; body: string; private: boolean; link: NoteLink | null }
```

`src/features/checklists/types.ts`:
```ts
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
```

`src/features/library/types.ts`:
```ts
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
```


Esqueletos dos hooks (as Tasks 36 e 37 trocam os corpos, sem mudar nomes nem tipos):

`src/features/journal/hooks.ts`:
```ts
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { JournalEntry, SaveJournalVars } from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 36`)
}

export function useJournalEntries(): UseQueryResult<JournalEntry[]> { return notYet('useJournalEntries') }
export function useSaveJournalEntry(): UseMutationResult<JournalEntry, Error, SaveJournalVars> { return notYet('useSaveJournalEntry') }
```

`src/features/notes/hooks.ts`:
```ts
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { Note, SaveNoteVars } from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 36`)
}

export function useNotes(search: string): UseQueryResult<Note[]> { return notYet(`useNotes(${search})`) }
export function useNote(id: string | undefined): UseQueryResult<Note | null> { return notYet(`useNote(${id})`) }
export function useSaveNote(): UseMutationResult<void, Error, SaveNoteVars> { return notYet('useSaveNote') }
export function useDeleteNote(): UseMutationResult<void, Error, string> { return notYet('useDeleteNote') }
```

`src/features/checklists/hooks.ts`:
```ts
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { Checklist, SaveChecklistVars, ToggleChecklistItemVars } from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 36`)
}

export function useChecklists(): UseQueryResult<Checklist[]> { return notYet('useChecklists') }
export function useSaveChecklist(): UseMutationResult<void, Error, SaveChecklistVars> { return notYet('useSaveChecklist') }
export function useToggleChecklistItem(): UseMutationResult<void, Error, ToggleChecklistItemVars> { return notYet('useToggleChecklistItem') }
export function useDeleteChecklist(): UseMutationResult<void, Error, string> { return notYet('useDeleteChecklist') }
```

`src/features/library/hooks.ts`:
```ts
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { Book, RemoveBookFileVars, SaveBookLinkVars, SaveProgressVars, UploadBookVars } from './types'

function notYet(name: string): never {
  throw new Error(`${name}: implementado na Task 37`)
}

export function useBooks(): UseQueryResult<Book[]> { return notYet('useBooks') }
export function useBookUrl(filePath: string | null): UseQueryResult<string> { return notYet(`useBookUrl(${filePath})`) }
export function useSaveBookProgress(): UseMutationResult<void, Error, SaveProgressVars> { return notYet('useSaveBookProgress') }
export function useUploadBook(): UseMutationResult<void, Error, UploadBookVars> { return notYet('useUploadBook') }
export function useRemoveBookFile(): UseMutationResult<void, Error, RemoveBookFileVars> { return notYet('useRemoveBookFile') }
export function useSaveBookLink(): UseMutationResult<void, Error, SaveBookLinkVars> { return notYet('useSaveBookLink') }
```


`src/test/e6Mocks.ts`:
```ts
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
```


- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/domain src/features/e6Contract.test.ts 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS em todos os arquivos; `tsc` sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/domain/journalDays.ts src/domain/journalDays.test.ts src/domain/markdown.ts src/domain/markdown.test.ts src/domain/notes.ts src/domain/notes.test.ts src/domain/checklists.ts src/domain/checklists.test.ts src/domain/library.ts src/domain/library.test.ts src/features/journal/types.ts src/features/journal/hooks.ts src/features/notes/types.ts src/features/notes/hooks.ts src/features/checklists/types.ts src/features/checklists/hooks.ts src/features/library/types.ts src/features/library/hooks.ts src/features/e6Contract.test.ts src/test/e6Mocks.ts
git commit -m "feat(e6): domain rules and data contract for journal, notes, checklists and library"
```

---
### Task 34: Migration — notas, biblioteca e Storage — **[W3]**

**Files:**
- Create: `supabase/migrations/20260930000002_notes_library.sql`, `supabase/tests/journal_notes_library.test.sql`

**Interfaces:**
- Consumes: schema e RLS das Tasks 3 e 5 (`journal_entries`, `notes`, `books`, `book_progress`, `checklists`, `checklist_items`, buckets `books`) e as migrations da E5.
- Produces:
  - `public.touch_updated_at()` e os triggers `notes_touch` (insert/update) e `book_progress_touch` (insert/update): `updated_at` é sempre do banco.
  - Constraints: `notes` (título ≤ 200, texto ≤ 20.000, `link_type` e `link_id` juntos ou ambos nulos); `books` (`file_path` dentro da pasta do livro, `external_url` só `http(s)`); `book_progress` (`page <= total_pages`).
  - Policy `books_write` em `storage.objects`: só o mentor, só na pasta de um livro existente (`<book_id>/...`); bucket `books` aceita só `application/pdf`.
- Nada de RLS novo para notas, caderno e checklists: as políticas da Task 5 já valem; esta Task as **prova** com pgTAP (regravar o dia por `upsert`, mentor lê mas não escreve o caderno, nota privada invisível ao mentor, checklist só lida pelo outro, página só da aluna).

- [ ] **Step 1: Testes pgTAP primeiro**


`supabase/tests/journal_notes_library.test.sql`:
```sql
begin;
-- independente das contas locais: tudo é desfeito pelo rollback no fim
truncate public.profiles cascade;
delete from auth.users;
select plan(23);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'aluna@test'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor@test');
insert into public.profiles values
  ('00000000-0000-0000-0000-00000000000a', 'aluna', 'Aluna'),
  ('00000000-0000-0000-0000-00000000000b', 'mentor', 'Mentor');

-- caderno: a aluna salva e regrava o mesmo dia (upsert) sem duplicar
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
insert into public.journal_entries (date, learned, practiced, tomorrow)
values (timezone('America/Sao_Paulo', now())::date, 'aprendi a ouvir', 'curto', '')
on conflict (user_id, date) do update set learned = excluded.learned, practiced = excluded.practiced, tomorrow = excluded.tomorrow;
insert into public.journal_entries (date, learned, practiced, tomorrow)
values (timezone('America/Sao_Paulo', now())::date, 'aprendi a ouvir o cliente', 'pratiquei o pitch de 30 s', 'amanhã ligo para 3 empresas')
on conflict (user_id, date) do update set learned = excluded.learned, practiced = excluded.practiced, tomorrow = excluded.tomorrow;
select is((select count(*)::int from public.journal_entries), 1, 'regravar o mesmo dia atualiza a mesma linha');
select is((select complete from public.journal_entries), true, 'três campos com 15+ caracteres completam a entrada');

-- mentor lê o caderno, mas não escreve nele (RF-50/52)
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from public.journal_entries), 1, 'mentor lê o caderno da aluna');
select throws_ok($$ insert into public.journal_entries (date, learned, practiced, tomorrow)
  values (timezone('America/Sao_Paulo', now())::date - 1, 'x', 'y', 'z') $$, '42501', null, 'mentor não escreve no caderno');

-- notas: privada por padrão e invisível ao mentor; compartilhada aparece (RF-52)
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
insert into public.notes (id, title, body) values ('aaaaaaaa-0000-0000-0000-000000000001', 'segredo', 'técnicas de vendas por telefone');
insert into public.notes (id, title, body, private) values ('aaaaaaaa-0000-0000-0000-000000000002', 'aberta', 'rotina de prospecção', false);
select is((select private from public.notes where title = 'segredo'), true, 'nota nasce privada');
select is((select count(*)::int from public.notes where search @@ websearch_to_tsquery('portuguese', 'vendas')), 1, 'busca em português acha a nota');
select lives_ok($$ update public.notes set updated_at = '2000-01-01' where title = 'segredo' $$, 'aluna edita a própria nota');
select isnt((select updated_at from public.notes where title = 'segredo'), '2000-01-01'::timestamptz, 'o banco decide o updated_at');
select throws_ok($$ insert into public.notes (title, body, link_type) values ('x', 'y', 'week') $$, '23514', null, 'vínculo precisa de tipo e id');
select throws_ok($$ insert into public.notes (title) values (repeat('x', 201)) $$, '23514', null, 'título com mais de 200 caracteres é recusado');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select array_agg(title order by title) from public.notes), array['aberta'], 'mentor vê só a nota compartilhada');
update public.notes set title = 'invadida' where id = 'aaaaaaaa-0000-0000-0000-000000000002';
select is((select title from public.notes where id = 'aaaaaaaa-0000-0000-0000-000000000002'), 'aberta', 'mentor não edita nota da aluna');

-- biblioteca: só o mentor altera livros e sobe PDFs; só a aluna salva a página (RF-61/63)
select lives_ok($$ update public.books set external_url = 'https://exemplo.com/audiolivro' where id = 'carnegie' $$, 'mentor grava o link externo');
select throws_ok($$ update public.books set external_url = 'javascript:alert(1)' where id = 'carnegie' $$, '23514', null, 'link externo só http(s)');
select throws_ok($$ update public.books set file_path = 'outro/arquivo.pdf' where id = 'carnegie' $$, '23514', null, 'arquivo precisa estar na pasta do livro');
select lives_ok($$ insert into storage.objects (bucket_id, name) values ('books', 'carnegie/1.pdf') $$, 'mentor sobe PDF na pasta do livro');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('books', 'livro-que-nao-existe/1.pdf') $$, '42501', null, 'mentor não sobe fora da pasta de um livro');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('books', 'carnegie/2.pdf') $$, '42501', null, 'aluna não sobe PDF');

select lives_ok($$ insert into public.book_progress (book_id, page, total_pages) values ('carnegie', 3, 200)
  on conflict (book_id) do update set page = excluded.page, total_pages = excluded.total_pages $$, 'aluna salva a página lida');
select throws_ok($$ update public.book_progress set page = 300 where book_id = 'carnegie' $$, '23514', null, 'página não passa do total');

-- checklists: cada um edita as próprias; o outro só lê (RF-42)
insert into public.checklists (id, title) values ('cccccccc-0000-0000-0000-000000000001', 'Vendas da semana');
insert into public.checklist_items (id, checklist_id, text) values ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Ligar para 5 empresas');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from public.checklist_items), 1, 'mentor lê a checklist da aluna');
update public.checklist_items set done_at = now() where id = 'dddddddd-0000-0000-0000-000000000001';
select is((select done_at from public.checklist_items where id = 'dddddddd-0000-0000-0000-000000000001'), null, 'mentor não marca item da aluna');
select throws_ok($$ insert into public.book_progress (book_id, page, total_pages) values ('gitomer', 1, 100) $$, '42501', null, 'mentor não salva página de leitura');

select * from finish();
rollback;
```


- [ ] **Step 2: Ver falhar**

Run: `npx --yes supabase@2 test db 2>&1 | tail -15`
Expected: os testes antigos ok; `journal_notes_library.test.sql` FAIL (o trigger de `updated_at` e as constraints ainda não existem: por exemplo "o banco decide o updated_at" e "vínculo precisa de tipo e id").

- [ ] **Step 3: Implementar a migration**


`supabase/migrations/20260930000002_notes_library.sql`:
```sql
-- updated_at é do banco: o cliente não escolhe o horário
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger notes_touch before insert or update on public.notes
for each row execute function public.touch_updated_at();
create trigger book_progress_touch before insert or update on public.book_progress
for each row execute function public.touch_updated_at();

-- Limites e coerência dos dados (o cliente também valida, o banco é a autoridade)
alter table public.notes
  add constraint notes_title_len check (char_length(title) <= 200),
  add constraint notes_body_len check (char_length(body) <= 20000),
  add constraint notes_link_pair check ((link_type is null) = (link_id is null));

alter table public.books
  add constraint books_file_path_ck check (file_path is null or file_path like id || '/%'),
  add constraint books_external_url_ck check (external_url is null or external_url ~* '^https?://');

alter table public.book_progress
  add constraint book_progress_page_ck check (total_pages is null or page <= total_pages);

-- PDFs: só o mentor envia, só para dentro da pasta de um livro existente, só PDF (RF-61)
drop policy books_write on storage.objects;
create policy books_write on storage.objects for insert to authenticated with check (
  bucket_id = 'books' and public.my_role() = 'mentor'
  and exists (select 1 from public.books b where b.id = (storage.foldername(name))[1]));
update storage.buckets set allowed_mime_types = array['application/pdf'] where id = 'books';
```


- [ ] **Step 4: Aplicar e ver passar**

Run: `npx --yes supabase@2 db reset 2>&1 | tail -3 && npx --yes supabase@2 test db 2>&1 | tail -10`
Expected: "Finished supabase db reset"; `journal.test.sql`, `rls.test.sql`, `simulations.test.sql` e `journal_notes_library.test.sql` todos `ok`; `Result: PASS`. (O reset apaga as contas locais de teste; o E2E recria a aluna e o mentor.)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260930000002_notes_library.sql supabase/tests/journal_notes_library.test.sql
git commit -m "feat(db): notes limits and updated_at, book constraints, pdf-only storage policy"
```

---

### Task 35: `useAutosave`, `useDebounced` e `Markdown` — **[W3]**

**Files:**
- Create: `src/lib/useAutosave.ts`, `src/lib/useDebounced.ts`, `src/features/notes/Markdown.tsx`
- Test: `src/lib/useAutosave.test.ts`, `src/features/notes/Markdown.test.tsx`

**Interfaces:**
- Consumes: `parseMarkdown`, `Block`, `Inline` (Task 33).
- Produces: `useAutosave<T>({ value, save, delayMs = 1000, enabled = true }): { status: 'idle' | 'saving' | 'saved' | 'error'; error: string | null; flush(): Promise<void> }` (o valor inicial é a linha de base e não é salvo; um salvamento por vez; ao desmontar com alteração pendente, salva); `useDebounced<T>(value, ms): T`; `Markdown({ source })` (sem HTML cru).

- [ ] **Step 1: Testes**


`src/lib/useAutosave.test.ts`:
```ts
import { act, renderHook } from '@testing-library/react'
import { useAutosave } from './useAutosave'
import { useDebounced } from './useDebounced'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

const setup = (initial: string, save = vi.fn().mockResolvedValue(undefined)) => {
  const hook = renderHook(({ v }) => useAutosave({ value: v, save }), { initialProps: { v: initial } })
  return { ...hook, save }
}

test('não salva o valor inicial', () => {
  const { save } = setup('a')
  act(() => { vi.advanceTimersByTime(5000) })
  expect(save).not.toHaveBeenCalled()
})

test('salva 1 s depois da última alteração e mostra "salvo" (RF-54)', async () => {
  const { result, rerender, save } = setup('a')
  rerender({ v: 'ab' })
  act(() => { vi.advanceTimersByTime(600) })
  rerender({ v: 'abc' })
  act(() => { vi.advanceTimersByTime(900) })
  expect(save).not.toHaveBeenCalled()
  await act(async () => { vi.advanceTimersByTime(200) })
  expect(save).toHaveBeenCalledTimes(1)
  expect(save).toHaveBeenCalledWith('abc')
  expect(result.current.status).toBe('saved')
})

test('mudança durante um salvamento em andamento espera a vez e salva o valor mais novo', async () => {
  let release: () => void = () => {}
  const save = vi.fn().mockImplementationOnce(() => new Promise<void>((r) => { release = r })).mockResolvedValue(undefined)
  const { result, rerender } = setup('a', save)
  rerender({ v: 'b' })
  await act(async () => { vi.advanceTimersByTime(1000) })
  expect(save).toHaveBeenCalledTimes(1)
  rerender({ v: 'c' })
  await act(async () => { vi.advanceTimersByTime(1000) })
  expect(save).toHaveBeenCalledTimes(1) // ainda esperando a primeira resposta
  await act(async () => { release() })
  expect(save.mock.calls.map((c) => c[0])).toEqual(['b', 'c'])
  expect(result.current.status).toBe('saved')
})

test('erro é informado e o próximo ajuste tenta de novo', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('sem rede')).mockResolvedValue(undefined)
  const { result, rerender } = setup('a', save)
  rerender({ v: 'b' })
  await act(async () => { vi.advanceTimersByTime(1000) })
  expect(result.current.status).toBe('error')
  expect(result.current.error).toBe('sem rede')
  rerender({ v: 'bc' })
  await act(async () => { vi.advanceTimersByTime(1000) })
  expect(result.current.status).toBe('saved')
})

test('sair da tela com alteração pendente salva na hora (Review Focus 3)', async () => {
  const { rerender, unmount, save } = setup('a')
  rerender({ v: 'novo texto' })
  unmount()
  await act(async () => { await Promise.resolve() })
  expect(save).toHaveBeenCalledWith('novo texto')
})

test('flush salva sem esperar o tempo', async () => {
  const { result, rerender, save } = setup('a')
  rerender({ v: 'b' })
  await act(async () => { await result.current.flush() })
  expect(save).toHaveBeenCalledWith('b')
})

test('useDebounced só assenta depois da pausa', () => {
  const { result, rerender } = renderHook(({ v }) => useDebounced(v, 300), { initialProps: { v: 'a' } })
  rerender({ v: 'ab' })
  expect(result.current).toBe('a')
  act(() => { vi.advanceTimersByTime(300) })
  expect(result.current).toBe('ab')
})
```

`src/features/notes/Markdown.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Markdown } from './Markdown'

test('renderiza títulos, listas, negrito e link seguro', () => {
  render(<Markdown source={'## Ideias\n\n- **abrir** com o porquê\n- [guia](https://exemplo.com)'} />)
  expect(screen.getByRole('heading', { name: 'Ideias', level: 3 })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByText('abrir').tagName).toBe('STRONG')
  const link = screen.getByRole('link', { name: 'guia' })
  expect(link).toHaveAttribute('href', 'https://exemplo.com')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(link).toHaveAttribute('target', '_blank')
})

test('HTML e links perigosos aparecem como texto, sem virar elemento (Review Focus 5)', () => {
  const { container } = render(<Markdown source={'<script>alert(1)</script> <img src=x onerror=alert(1)>\n\n[clique](javascript:alert(1))'} />)
  expect(container.querySelector('script')).toBeNull()
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('a')).toBeNull()
  expect(container).toHaveTextContent('<script>alert(1)</script>')
  expect(container).toHaveTextContent('[clique](javascript:alert(1))')
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/useAutosave.test.ts src/features/notes/Markdown.test.tsx 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import "./useAutosave"` / `"./Markdown"`.

- [ ] **Step 3: Implementar**


`src/lib/useDebounced.ts`:
```ts
import { useEffect, useState } from 'react'

/** Valor "assentado": só muda `ms` milissegundos depois da última alteração (usado na busca de notas). */
export function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return settled
}
```

`src/lib/useAutosave.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface AutosaveOptions<T> {
  /** Valor atual do formulário. O valor inicial é a linha de base: só mudanças em relação a ele são salvas. */
  value: T
  save: (value: T) => Promise<unknown>
  /** RF-54: ~1 s depois da última alteração. */
  delayMs?: number
  enabled?: boolean
}

export interface Autosave { status: AutosaveStatus; error: string | null; flush(): Promise<void> }

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * RF-54: salva sozinho depois de uma pausa e informa "salvo". Só há um salvamento por vez (o último valor
 * espera a vez, então respostas fora de ordem nunca sobrescrevem algo mais novo) e, ao sair da tela com
 * alteração pendente, salva na hora.
 */
export function useAutosave<T>({ value, save, delayMs = 1000, enabled = true }: AutosaveOptions<T>): Autosave {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(value)
  const saved = useRef(value)
  const saveRef = useRef(save)
  const inFlight = useRef<Promise<void> | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { latest.current = value; saveRef.current = save })

  const run = useCallback(async (): Promise<void> => {
    for (;;) {
      if (inFlight.current) { await inFlight.current; continue }
      if (same(latest.current, saved.current)) return
      const sending = latest.current
      setStatus('saving')
      setError(null)
      let failed = false
      inFlight.current = saveRef.current(sending)
        .then(() => { saved.current = sending })
        .catch((e: unknown) => { failed = true; setStatus('error'); setError(e instanceof Error ? e.message : 'Não foi possível salvar.') })
        .finally(() => { inFlight.current = null })
      await inFlight.current
      if (failed) return
      if (same(latest.current, saved.current)) { setStatus('saved'); return }
    }
  }, [])

  useEffect(() => {
    if (!enabled || same(value, saved.current)) return
    timer.current = setTimeout(() => { void run() }, delayMs)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [value, enabled, delayMs, run])

  // Saiu da tela com algo pendente: salva agora.
  useEffect(() => () => { if (enabled && !same(latest.current, saved.current)) void run() }, [enabled, run])

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    await run()
  }, [run])

  return { status, error, flush }
}
```

`src/features/notes/Markdown.tsx`:
```tsx
import type { ReactNode } from 'react'
import { parseMarkdown, type Block, type Inline } from '@/domain/markdown'

function inline(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case 'text': return n.v
      case 'strong': return <strong key={i}>{inline(n.c)}</strong>
      case 'em': return <em key={i}>{inline(n.c)}</em>
      case 'code': return <code key={i} className="rounded-control bg-raised px-1 font-mono text-[0.9em]">{n.v}</code>
      case 'link': return <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-4">{inline(n.c)}</a>
    }
  })
}

function block(b: Block, i: number): ReactNode {
  switch (b.t) {
    case 'p': return <p key={i} className="whitespace-pre-line">{inline(b.c)}</p>
    case 'h': {
      const cls = b.level === 1 ? 'text-2xl' : b.level === 2 ? 'text-xl' : 'text-lg'
      return <p key={i} role="heading" aria-level={b.level + 1} className={`${cls} font-bold`}>{inline(b.c)}</p>
    }
    case 'ul': return <ul key={i} className="list-disc pl-6">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>
    case 'ol': return <ol key={i} className="list-decimal pl-6">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ol>
  }
}

/** Markdown simples da nota (RF-51), desenhado como elementos React: nenhum HTML cru chega ao DOM. */
export function Markdown({ source }: { source: string }) {
  return <div className="flex flex-col gap-3">{parseMarkdown(source).map(block)}</div>
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib src/features/notes/Markdown.test.tsx 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/lib/useAutosave.ts src/lib/useAutosave.test.ts src/lib/useDebounced.ts src/features/notes/Markdown.tsx src/features/notes/Markdown.test.tsx
git commit -m "feat(e6): autosave hook, debounce hook and safe markdown renderer"
```

---

### Task 36: Hooks do caderno, das notas e das checklists — **[W3]**

**Files:**
- Create: `src/lib/db.ts`
- Modify: `src/test/fakeSupabase.ts` (aceita `textSearch` e passa a ser por bucket, com `remove`), `src/features/journal/hooks.ts`, `src/features/notes/hooks.ts`, `src/features/checklists/hooks.ts` (trocam os esqueletos)
- Test: `src/features/journal/hooks.test.tsx`, `src/features/notes/hooks.test.tsx`, `src/features/checklists/hooks.test.tsx`

**Interfaces:**
- Consumes: `supabase`; tudo da Task 33 (tipos, domínio, mocks); `createFakeSupabase` (Task 23); `validateChecklistDraft`.
- Produces: os hooks do contrato da Task 33 para `journal`, `notes` e `checklists`; `fail(error, friendly)` e `myId()` em `src/lib/db.ts`. Query keys internas: `['journal_entries']`, `['notes', termo]`, `['note', id]`, `['checklists']`; além delas, cada gravação do caderno invalida `['journal_days']` (a chave de `useJournalDays`).
- Mensagens entregues às telas: "O prazo deste dia já passou (era até 12:00 do dia seguinte).", "Só a aluna escreve no caderno.", "Só quem escreveu a nota pode editá-la." / "…apagá-la.", "Título (até 200 caracteres) ou texto (até 20.000) grande demais.", "Só quem criou a lista marca os itens." / "…pode apagá-la.".
- Para o `fake`: `results['storage:remove']` e chamadas `storage:<bucket>` (a Task 37 usa `books`; as chamadas de `recordings` da E5 continuam iguais).

- [ ] **Step 1: Atualizar o Supabase falso e escrever os testes**

`src/test/fakeSupabase.ts` (substitui o arquivo inteiro; só acrescenta `textSearch`, o `remove` e o nome do bucket nas chamadas de Storage):

```ts
export type Result = { data: unknown; error: unknown; count?: number | null }
export interface Call { table: string; method: string; args: unknown[] }

const BUILDER_METHODS = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'is', 'order', 'limit', 'textSearch', 'maybeSingle', 'single']

/**
 * Supabase falso para testes de hooks. Cada `await` de uma consulta consome o próximo item de
 * `results[<tabela>]` (ou `results['rpc:<função>']`, `results['storage:upload']`, `results['storage:signed']`, `results['storage:remove']`);
 * sem item, devolve `{ data: [], error: null }`. Toda chamada encadeada fica registrada em `calls`.
 */
export function createFakeSupabase() {
  const results: Record<string, Result[]> = {}
  const calls: Call[] = []
  const next = (key: string, fallback: Result): Result => results[key]?.shift() ?? fallback

  const from = vi.fn((table: string) => {
    const b: Record<string, unknown> = {}
    for (const m of BUILDER_METHODS) {
      b[m] = (...args: unknown[]) => { calls.push({ table, method: m, args }); return b }
    }
    b.then = (ok: (r: Result) => unknown, fail: (e: unknown) => unknown) =>
      Promise.resolve(next(table, { data: [], error: null })).then(ok, fail)
    return b
  })
  const rpc = vi.fn(async (fn: string, args: unknown) => {
    calls.push({ table: `rpc:${fn}`, method: 'rpc', args: [args] })
    return next(`rpc:${fn}`, { data: null, error: null })
  })
  const bucketApi = (bucket: string) => ({
    upload: vi.fn(async (path: string, _blob: Blob, options: unknown) => {
      calls.push({ table: `storage:${bucket}`, method: 'upload', args: [path, options] })
      return next('storage:upload', { data: { path }, error: null })
    }),
    createSignedUrl: vi.fn(async (path: string, seconds: number) => {
      calls.push({ table: `storage:${bucket}`, method: 'createSignedUrl', args: [path, seconds] })
      return next('storage:signed', { data: { signedUrl: `https://signed.test/${path}` }, error: null })
    }),
    remove: vi.fn(async (paths: string[]) => {
      calls.push({ table: `storage:${bucket}`, method: 'remove', args: [paths] })
      return next('storage:remove', { data: [], error: null })
    }),
  })
  const getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'me' } } } })
  const storage = { from: vi.fn((bucket: string) => bucketApi(bucket)) }

  return {
    supabase: { from, rpc, storage, auth: { getSession } },
    results,
    calls,
    reset() {
      calls.length = 0
      for (const k of Object.keys(results)) delete results[k]
    },
  }
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>
```



`src/features/journal/hooks.test.tsx`:
```tsx
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { FakeSupabase } from '@/test/fakeSupabase'

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('@/test/fakeSupabase')
  const fake = createFakeSupabase()
  return { supabase: fake.supabase, fake }
})

const { fake } = (await import('@/lib/supabase')) as unknown as { fake: FakeSupabase }
const { results, calls } = fake

import { useJournalEntries, useSaveJournalEntry } from './hooks'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => fake.reset())

const row = (over: Record<string, unknown> = {}) => ({
  date: '2026-09-29', learned: 'aprendi a ouvir', practiced: 'pratiquei o pitch', tomorrow: 'ligar para 3 empresas',
  complete: true, late: false, created_at: '2026-09-29T22:10:00Z', updated_at: '2026-09-29T23:02:00Z', ...over,
})

test('useJournalEntries mapeia as linhas e mantém a ordem do banco', async () => {
  results.journal_entries = [{ data: [row(), row({ date: '2026-09-28', late: true })], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useJournalEntries(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data![0]).toEqual({
    date: '2026-09-29', learned: 'aprendi a ouvir', practiced: 'pratiquei o pitch', tomorrow: 'ligar para 3 empresas',
    complete: true, late: false, createdAt: '2026-09-29T22:10:00Z', updatedAt: '2026-09-29T23:02:00Z',
  })
  expect(result.current.data![1].late).toBe(true)
  expect(calls).toContainEqual({ table: 'journal_entries', method: 'order', args: ['date', { ascending: false }] })
})

test('salvar faz upsert por (usuário, dia) sem mandar complete, late nem horários; devolve o que o banco calculou', async () => {
  results.journal_entries = [{ data: row({ complete: false }), error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveJournalEntry(), { wrapper: Wrapper })
  let saved: unknown
  await act(async () => { saved = await result.current.mutateAsync({ date: '2026-09-29', learned: 'a', practiced: 'b', tomorrow: 'c' }) })
  const up = calls.find((c) => c.method === 'upsert')!
  expect(up.args).toEqual([{ date: '2026-09-29', learned: 'a', practiced: 'b', tomorrow: 'c' }, { onConflict: 'user_id,date' }])
  expect(saved).toMatchObject({ complete: false, late: false })
})

test('dia fechado e conta errada têm mensagem clara (Review Focus 1)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveJournalEntry(), { wrapper: Wrapper })
  results.journal_entries = [{ data: null, error: { message: 'journal_closed', code: 'P0001' } }]
  await act(async () => { await expect(result.current.mutateAsync({ date: '2026-09-27', learned: 'a', practiced: 'b', tomorrow: 'c' })).rejects.toThrow(/prazo deste dia já passou/) })
  results.journal_entries = [{ data: null, error: { message: 'new row violates row-level security policy', code: '42501' } }]
  await act(async () => { await expect(result.current.mutateAsync({ date: '2026-09-29', learned: 'a', practiced: 'b', tomorrow: 'c' })).rejects.toThrow('Só a aluna escreve no caderno.') })
})
```

`src/features/notes/hooks.test.tsx`:
```tsx
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { FakeSupabase } from '@/test/fakeSupabase'

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('@/test/fakeSupabase')
  const fake = createFakeSupabase()
  return { supabase: fake.supabase, fake }
})

const { fake } = (await import('@/lib/supabase')) as unknown as { fake: FakeSupabase }
const { results, calls } = fake

import { useDeleteNote, useNote, useNotes, useSaveNote } from './hooks'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => fake.reset())

const row = (over: Record<string, unknown> = {}) => ({
  id: 'n1', author: 'me', title: 'Ideias', body: 'texto', private: true, link_type: null, link_id: null, updated_at: '2026-09-29T15:00:00Z', ...over,
})

test('useNotes marca as minhas e converte o vínculo', async () => {
  results.notes = [{ data: [row({ link_type: 'week', link_id: 'w05' }), row({ id: 'n2', author: 'aluna-1', private: false })], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useNotes(''), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data![0]).toEqual({ id: 'n1', title: 'Ideias', body: 'texto', private: true, link: { type: 'week', id: 'w05' }, updatedAt: '2026-09-29T15:00:00Z', mine: true })
  expect(result.current.data![1]).toMatchObject({ mine: false, private: false, link: null })
  expect(calls.some((c) => c.method === 'textSearch')).toBe(false)
})

test('busca (RF-53) usa o índice em português e ignora espaços nas pontas', async () => {
  results.notes = [{ data: [row()], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useNotes('  vendas por telefone '), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(1))
  expect(calls).toContainEqual({ table: 'notes', method: 'textSearch', args: ['search', 'vendas por telefone', { config: 'portuguese', type: 'websearch' }] })
})

test('useNote devolve null quando a nota não existe ou não é visível', async () => {
  results.notes = [{ data: null, error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useNote('sumiu'), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toBeNull()
})

test('useNote sem id não consulta', () => {
  const { Wrapper } = setup()
  renderHook(() => useNote(undefined), { wrapper: Wrapper })
  expect(calls).toHaveLength(0)
})

test('salvar usa o id do cliente (upsert): autosave e toque duplo não duplicam a nota (Review Focus 3)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveNote(), { wrapper: Wrapper })
  const vars = { id: 'uuid-1', title: 'T', body: 'B', private: true, link: { type: 'book' as const, id: 'carnegie' } }
  await act(async () => { await result.current.mutateAsync(vars); await result.current.mutateAsync(vars) })
  const ups = calls.filter((c) => c.method === 'upsert')
  expect(ups).toHaveLength(2)
  expect(ups[0].args).toEqual([{ id: 'uuid-1', title: 'T', body: 'B', private: true, link_type: 'book', link_id: 'carnegie' }, { onConflict: 'id' }])
})

test('nota nova sem vínculo grava nulos; erros ficam legíveis', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveNote(), { wrapper: Wrapper })
  await act(async () => { await result.current.mutateAsync({ id: 'u', title: '', body: '', private: true, link: null }) })
  expect(calls.find((c) => c.method === 'upsert')!.args[0]).toMatchObject({ link_type: null, link_id: null, private: true })
  results.notes = [{ data: null, error: { message: 'violates check constraint', code: '23514' } }]
  await act(async () => { await expect(result.current.mutateAsync({ id: 'u', title: 'x', body: 'y', private: true, link: null })).rejects.toThrow(/grande demais/) })
  results.notes = [{ data: null, error: { message: 'row-level security', code: '42501' } }]
  await act(async () => { await expect(result.current.mutateAsync({ id: 'u', title: 'x', body: 'y', private: true, link: null })).rejects.toThrow('Só quem escreveu a nota pode editá-la.') })
})

test('apagar nota de outra pessoa (0 linhas) dá erro legível', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useDeleteNote(), { wrapper: Wrapper })
  results.notes = [{ data: [], error: null }]
  await act(async () => { await expect(result.current.mutateAsync('n2')).rejects.toThrow('Só quem escreveu a nota pode apagá-la.') })
  results.notes = [{ data: [{ id: 'n1' }], error: null }]
  await act(async () => { await result.current.mutateAsync('n1') })
})
```

`src/features/checklists/hooks.test.tsx`:
```tsx
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { FakeSupabase } from '@/test/fakeSupabase'

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('@/test/fakeSupabase')
  const fake = createFakeSupabase()
  return { supabase: fake.supabase, fake }
})

const { fake } = (await import('@/lib/supabase')) as unknown as { fake: FakeSupabase }
const { results, calls } = fake

import type { Checklist } from './types'
import { useChecklists, useDeleteChecklist, useSaveChecklist, useToggleChecklistItem } from './hooks'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => fake.reset())

test('useChecklists ordena os itens por posição e marca as minhas', async () => {
  results.checklists = [{ data: [{
    id: 'c1', owner: 'me', title: 'Semana 5', week_id: 'w05', due_date: '2026-10-04', created_at: 'x',
    checklist_items: [{ id: 'i2', text: 'segundo', done_at: null, position: 1 }, { id: 'i1', text: 'primeiro', done_at: '2026-09-29T10:00:00Z', position: 0 }],
  }, { id: 'c2', owner: 'outra', title: 'Da mentora', week_id: null, due_date: null, created_at: 'y', checklist_items: [] }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useChecklists(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data![0].items.map((i) => [i.text, i.done])).toEqual([['primeiro', true], ['segundo', false]])
  expect(result.current.data![0]).toMatchObject({ mine: true, weekId: 'w05', dueDate: '2026-10-04' })
  expect(result.current.data![1].mine).toBe(false)
})

test('salvar lista: cabeçalho, remove os itens que saíram e regrava os que ficam sem tocar em done_at', async () => {
  results.checklist_items = [{ data: [{ id: 'i1' }, { id: 'velho' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveChecklist(), { wrapper: Wrapper })
  await act(async () => {
    await result.current.mutateAsync({ id: 'c1', title: ' Semana 5 ', weekId: 'w05', dueDate: null, items: [{ id: 'i1', text: ' primeiro ' }, { id: 'i3', text: 'novo' }] })
  })
  expect(calls.find((c) => c.table === 'checklists' && c.method === 'upsert')!.args).toEqual([{ id: 'c1', title: 'Semana 5', week_id: 'w05', due_date: null }, { onConflict: 'id' }])
  expect(calls).toContainEqual({ table: 'checklist_items', method: 'in', args: ['id', ['velho']] })
  const items = calls.filter((c) => c.table === 'checklist_items' && c.method === 'upsert')[0].args[0]
  expect(items).toEqual([{ id: 'i1', checklist_id: 'c1', text: 'primeiro', position: 0 }, { id: 'i3', checklist_id: 'c1', text: 'novo', position: 1 }])
})

test('lista inválida não chega ao banco', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveChecklist(), { wrapper: Wrapper })
  await act(async () => { await expect(result.current.mutateAsync({ id: 'c', title: '', weekId: null, dueDate: null, items: [{ id: 'a', text: 'x' }] })).rejects.toThrow(/título/) })
  expect(calls).toHaveLength(0)
})

test('marcar item é otimista e volta atrás quando o banco recusa (só o dono marca)', async () => {
  const { qc, Wrapper } = setup()
  const list: Checklist = { id: 'c1', title: 'x', weekId: null, dueDate: null, createdAt: 'x', mine: false, items: [{ id: 'i1', text: 'a', done: false, position: 0 }] }
  qc.setQueryData<Checklist[]>(['checklists'], [list])
  const { result } = renderHook(() => useToggleChecklistItem(), { wrapper: Wrapper })
  results.checklist_items = [{ data: [], error: null }]
  await act(async () => { await result.current.mutateAsync({ itemId: 'i1', done: true }).catch(() => undefined) })
  expect(qc.getQueryData<Checklist[]>(['checklists'])![0].items[0].done).toBe(false)
  await waitFor(() => expect(result.current.error?.message).toBe('Só quem criou a lista marca os itens.'))
})

test('marcar grava done_at; desmarcar grava null; apagar de outra pessoa dá erro', async () => {
  const { Wrapper } = setup()
  const toggle = renderHook(() => useToggleChecklistItem(), { wrapper: Wrapper })
  results.checklist_items = [{ data: [{ id: 'i1' }], error: null }, { data: [{ id: 'i1' }], error: null }]
  await act(async () => { await toggle.result.current.mutateAsync({ itemId: 'i1', done: true }); await toggle.result.current.mutateAsync({ itemId: 'i1', done: false }) })
  const updates = calls.filter((c) => c.method === 'update').map((c) => (c.args[0] as { done_at: string | null }).done_at)
  expect(updates[0]).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  expect(updates[1]).toBeNull()
  const del = renderHook(() => useDeleteChecklist(), { wrapper: Wrapper })
  results.checklists = [{ data: [], error: null }]
  await act(async () => { await expect(del.result.current.mutateAsync('c9')).rejects.toThrow('Só quem criou a lista pode apagá-la.') })
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/journal src/features/notes/hooks.test.tsx src/features/checklists 2>&1 | tail -15`
Expected: FAIL — `useJournalEntries: implementado na Task 36` (e os equivalentes de notas e listas).

- [ ] **Step 3: Implementar**


`src/lib/db.ts`:
```ts
import { supabase } from '@/lib/supabase'

type DbError = { message: string; code?: string }

/** Lança um erro legível: `friendly` mapeia código SQL ou trecho da mensagem para texto em pt-BR. */
export function fail(error: DbError, friendly: Record<string, string> = {}): never {
  const key = Object.keys(friendly).find((k) => error.code === k || error.message.includes(k))
  throw new Error(key ? friendly[key] : error.message)
}

export async function myId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sessão expirada. Entre de novo.')
  return session.user.id
}
```

`src/features/journal/hooks.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fail } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { JournalEntry, SaveJournalVars } from './types'

const ENTRIES = ['journal_entries'] as const
const COLUMNS = 'date, learned, practiced, tomorrow, complete, late, created_at, updated_at'

interface Row { date: string; learned: string; practiced: string; tomorrow: string; complete: boolean; late: boolean; created_at: string; updated_at: string }
const toEntry = (r: Row): JournalEntry => ({
  date: r.date, learned: r.learned, practiced: r.practiced, tomorrow: r.tomorrow,
  complete: r.complete, late: r.late, createdAt: r.created_at, updatedAt: r.updated_at,
})

/** Últimos 120 dias com entrada, do mais novo ao mais antigo. Os dois perfis leem; só a aluna escreve. */
export function useJournalEntries() {
  return useQuery({
    queryKey: ENTRIES,
    queryFn: async (): Promise<JournalEntry[]> => {
      const { data, error } = await supabase.from('journal_entries').select(COLUMNS).order('date', { ascending: false }).limit(120)
      if (error) throw error
      return (data as Row[]).map(toEntry)
    },
  })
}

/** RF-50/54: grava o rascunho do dia. `complete`, `late` e os horários voltam calculados pelo banco. */
export function useSaveJournalEntry() {
  const qc = useQueryClient()
  return useMutation<JournalEntry, Error, SaveJournalVars>({
    mutationFn: async ({ date, learned, practiced, tomorrow }) => {
      const { data, error } = await supabase.from('journal_entries')
        .upsert({ date, learned, practiced, tomorrow }, { onConflict: 'user_id,date' })
        .select(COLUMNS).single()
      if (error) fail(error, {
        journal_closed: 'O prazo deste dia já passou (era até 12:00 do dia seguinte).',
        '42501': 'Só a aluna escreve no caderno.',
      })
      return toEntry(data as Row)
    },
    // `journal_days` é a chave de `useJournalDays` (streak e tela Hoje).
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ENTRIES }), qc.invalidateQueries({ queryKey: ['journal_days'] })]),
  })
}
```

`src/features/notes/hooks.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NoteLink, NoteLinkType } from '@/domain/notes'
import { fail, myId } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Note, SaveNoteVars } from './types'

const NOTES = ['notes'] as const
const COLUMNS = 'id, author, title, body, private, link_type, link_id, updated_at'

interface Row { id: string; author: string; title: string; body: string; private: boolean; link_type: NoteLinkType | null; link_id: string | null; updated_at: string }
const toNote = (r: Row, me: string): Note => ({
  id: r.id, title: r.title, body: r.body, private: r.private, updatedAt: r.updated_at, mine: r.author === me,
  link: r.link_type && r.link_id ? ({ type: r.link_type, id: r.link_id } satisfies NoteLink) : null,
})

/** RF-51/53: notas que o usuário pode ver (as próprias e, para o mentor, as compartilhadas), com busca em português. */
export function useNotes(search: string) {
  const term = search.trim()
  return useQuery({
    queryKey: [...NOTES, term],
    queryFn: async (): Promise<Note[]> => {
      const me = await myId()
      let q = supabase.from('notes').select(COLUMNS).order('updated_at', { ascending: false })
      if (term) q = q.textSearch('search', term, { config: 'portuguese', type: 'websearch' })
      const { data, error } = await q
      if (error) throw error
      return (data as Row[]).map((r) => toNote(r, me))
    },
  })
}

export function useNote(id: string | undefined) {
  return useQuery({
    queryKey: ['note', id],
    enabled: id !== undefined,
    queryFn: async (): Promise<Note | null> => {
      const me = await myId()
      const { data, error } = await supabase.from('notes').select(COLUMNS).eq('id', id!).maybeSingle()
      if (error) throw error
      return data ? toNote(data as Row, me) : null
    },
  })
}

const FRIENDLY = {
  '23514': 'Título (até 200 caracteres) ou texto (até 20.000) grande demais.',
  '42501': 'Só quem escreveu a nota pode editá-la.',
}

/** Cria ou atualiza pelo `id` do cliente: salvar duas vezes (autosave, toque duplo) nunca duplica a nota. */
export function useSaveNote() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveNoteVars>({
    mutationFn: async ({ id, title, body, private: isPrivate, link }) => {
      const { error } = await supabase.from('notes').upsert(
        { id, title, body, private: isPrivate, link_type: link?.type ?? null, link_id: link?.id ?? null },
        { onConflict: 'id' },
      )
      if (error) fail(error, FRIENDLY)
    },
    onSuccess: (_d, v) => Promise.all([qc.invalidateQueries({ queryKey: NOTES }), qc.invalidateQueries({ queryKey: ['note', v.id] })]),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { data, error } = await supabase.from('notes').delete().eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Só quem escreveu a nota pode apagá-la.')
    },
    onSuccess: (_d, id) => Promise.all([qc.invalidateQueries({ queryKey: NOTES }), qc.removeQueries({ queryKey: ['note', id] })]),
  })
}
```

`src/features/checklists/hooks.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { validateChecklistDraft } from '@/domain/checklists'
import { myId } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Checklist, SaveChecklistVars, ToggleChecklistItemVars } from './types'

const LISTS = ['checklists'] as const
const NOT_OWNER = 'Só quem criou a lista pode editá-la.'

interface ItemRow { id: string; text: string; done_at: string | null; position: number }
interface Row { id: string; owner: string; title: string; week_id: string | null; due_date: string | null; created_at: string; checklist_items: ItemRow[] }

/** RF-42: listas das duas contas (cada uma edita só as suas). */
export function useChecklists() {
  return useQuery({
    queryKey: LISTS,
    queryFn: async (): Promise<Checklist[]> => {
      const me = await myId()
      const { data, error } = await supabase.from('checklists')
        .select('id, owner, title, week_id, due_date, created_at, checklist_items(id, text, done_at, position)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as unknown as Row[]).map((r) => ({
        id: r.id, title: r.title, weekId: r.week_id, dueDate: r.due_date, createdAt: r.created_at, mine: r.owner === me,
        items: [...r.checklist_items].sort((a, b) => a.position - b.position)
          .map((i) => ({ id: i.id, text: i.text, done: i.done_at !== null, position: i.position })),
      }))
    },
  })
}

/**
 * Cria ou atualiza a lista e troca o conjunto de itens. Os ids vêm do cliente, então repetir o envio depois
 * de uma falha no meio do caminho termina o trabalho sem duplicar nada; a marcação dos itens que ficam é preservada.
 */
export function useSaveChecklist() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveChecklistVars>({
    mutationFn: async (v) => {
      const problem = validateChecklistDraft({ title: v.title, weekId: v.weekId, dueDate: v.dueDate, items: v.items })
      if (problem) throw new Error(problem)
      const head = await supabase.from('checklists').upsert(
        { id: v.id, title: v.title.trim(), week_id: v.weekId, due_date: v.dueDate }, { onConflict: 'id' })
      if (head.error) throw head.error.code === '42501' ? new Error(NOT_OWNER) : head.error
      const existing = await supabase.from('checklist_items').select('id').eq('checklist_id', v.id)
      if (existing.error) throw existing.error
      const keep = new Set(v.items.map((i) => i.id))
      const removed = (existing.data as { id: string }[]).map((r) => r.id).filter((id) => !keep.has(id))
      if (removed.length > 0) {
        const del = await supabase.from('checklist_items').delete().in('id', removed)
        if (del.error) throw del.error
      }
      const up = await supabase.from('checklist_items').upsert(
        v.items.map((it, position) => ({ id: it.id, checklist_id: v.id, text: it.text.trim(), position })), { onConflict: 'id' })
      if (up.error) throw up.error
    },
    onSettled: () => qc.invalidateQueries({ queryKey: LISTS }),
  })
}

export function useToggleChecklistItem() {
  const qc = useQueryClient()
  return useMutation<void, Error, ToggleChecklistItemVars, { prev?: Checklist[] }>({
    mutationFn: async ({ itemId, done }) => {
      const { data, error } = await supabase.from('checklist_items')
        .update({ done_at: done ? new Date().toISOString() : null }).eq('id', itemId).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Só quem criou a lista marca os itens.')
    },
    onMutate: async ({ itemId, done }) => {
      await qc.cancelQueries({ queryKey: LISTS })
      const prev = qc.getQueryData<Checklist[]>(LISTS)
      if (prev) {
        qc.setQueryData<Checklist[]>(LISTS, prev.map((l) => ({ ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, done } : i)) })))
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(LISTS, ctx.prev) },
    onSettled: () => qc.invalidateQueries({ queryKey: LISTS }),
  })
}

export function useDeleteChecklist() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { data, error } = await supabase.from('checklists').delete().eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Só quem criou a lista pode apagá-la.')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LISTS }),
  })
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/journal src/features/notes src/features/checklists src/features/simulations 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS (os testes da E5 continuam verdes com o Supabase falso novo); `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db.ts src/test/fakeSupabase.ts src/features/journal/hooks.ts src/features/journal/hooks.test.tsx src/features/notes/hooks.ts src/features/notes/hooks.test.tsx src/features/checklists/hooks.ts src/features/checklists/hooks.test.tsx
git commit -m "feat(e6): supabase hooks for journal, notes and checklists"
```

---

### Task 37: Hooks da biblioteca — **[W3]**

**Files:**
- Modify: `src/features/library/hooks.ts` (troca o esqueleto)
- Test: `src/features/library/hooks.test.tsx`

**Interfaces:**
- Consumes: `supabase` (tabelas `books` e `book_progress`, bucket `books`); `fail` (Task 36); `validatePdfFile`, `bookFilePath`, `normalizeExternalUrl`, `clampPage` (Task 33); `createFakeSupabase` com Storage por bucket (Task 36); migration da Task 34 para o comportamento real.
- Produces: os 6 hooks do contrato da Task 33 para `library`. Query keys internas: `['books']`, `['book_url', filePath]`. `useSaveBookProgress` atualiza o cache de `['books']` em vez de recarregar a lista a cada página.
- Mensagens entregues às telas: "Só o mentor altera os materiais da biblioteca.", "Só a aluna salva a página de leitura.", "Use um link que comece com http:// ou https://." e as de `validatePdfFile` ("Envie um arquivo PDF.", "O PDF pode ter no máximo 50 MB.").

- [ ] **Step 1: Testes**


`src/features/library/hooks.test.tsx`:
```tsx
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { FakeSupabase } from '@/test/fakeSupabase'

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('@/test/fakeSupabase')
  const fake = createFakeSupabase()
  return { supabase: fake.supabase, fake }
})

const { fake } = (await import('@/lib/supabase')) as unknown as { fake: FakeSupabase }
const { results, calls } = fake

import type { Book } from './types'
import { useBooks, useBookUrl, useRemoveBookFile, useSaveBookLink, useSaveBookProgress, useUploadBook } from './hooks'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return { qc, Wrapper }
}

beforeEach(() => fake.reset())

const pdf = (size = 1000, type = 'application/pdf') => new File([new Uint8Array(size)], 'livro.pdf', { type })

test('useBooks traz a página lida de cada livro', async () => {
  results.books = [{ data: [
    { id: 'carnegie', order: 1, title: 'Como Fazer Amigos', author: 'Dale Carnegie', phase: '1', kind: 'livro', file_path: 'carnegie/1.pdf', external_url: null, book_progress: { page: 12, total_pages: 200, updated_at: 'x' } },
    { id: 'sebrae', order: 2, title: 'Cursos', author: null, phase: '2-3', kind: 'curso', file_path: null, external_url: 'https://loja.sebrae.com.br', book_progress: null },
  ], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useBooks(), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toHaveLength(2))
  expect(result.current.data![0]).toMatchObject({ id: 'carnegie', filePath: 'carnegie/1.pdf', progress: { page: 12, totalPages: 200 } })
  expect(result.current.data![1]).toMatchObject({ kind: 'curso', progress: null, externalUrl: 'https://loja.sebrae.com.br' })
  expect(calls).toContainEqual({ table: 'books', method: 'order', args: ['order'] })
})

test('URL assinada de 1 hora; sem arquivo não consulta (RF-65)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useBookUrl('carnegie/1.pdf'), { wrapper: Wrapper })
  await waitFor(() => expect(result.current.data).toBe('https://signed.test/carnegie/1.pdf'))
  expect(calls).toContainEqual({ table: 'storage:books', method: 'createSignedUrl', args: ['carnegie/1.pdf', 3600] })
  fake.reset()
  renderHook(() => useBookUrl(null), { wrapper: Wrapper })
  expect(calls).toHaveLength(0)
})

test('salvar página: limita ao total e atualiza o cache sem recarregar a lista (Review Focus 4)', async () => {
  const { qc, Wrapper } = setup()
  const book: Book = { id: 'carnegie', order: 1, title: 'x', author: null, phase: '1', kind: 'livro', filePath: 'carnegie/1.pdf', externalUrl: null, progress: null }
  qc.setQueryData<Book[]>(['books'], [book])
  const { result } = renderHook(() => useSaveBookProgress(), { wrapper: Wrapper })
  await act(async () => { await result.current.mutateAsync({ bookId: 'carnegie', page: 999, totalPages: 200 }) })
  expect(calls.find((c) => c.method === 'upsert')!.args).toEqual([{ book_id: 'carnegie', page: 200, total_pages: 200 }, { onConflict: 'book_id' }])
  expect(qc.getQueryData<Book[]>(['books'])![0].progress).toMatchObject({ page: 200, totalPages: 200 })
})

test('mentor não salva página: mensagem clara', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveBookProgress(), { wrapper: Wrapper })
  results.book_progress = [{ data: null, error: { message: 'row-level security', code: '42501' } }]
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', page: 1, totalPages: null })).rejects.toThrow('Só a aluna salva a página de leitura.') })
})

test('upload: sobe com nome novo na pasta do livro, aponta o livro e apaga o arquivo anterior (RF-61)', async () => {
  results.books = [{ data: [{ id: 'carnegie' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadBook(), { wrapper: Wrapper })
  await act(async () => { await result.current.mutateAsync({ bookId: 'carnegie', file: pdf(), previousPath: 'carnegie/antigo.pdf' }) })
  const up = calls.find((c) => c.method === 'upload')!
  expect(up.table).toBe('storage:books')
  expect(up.args[0]).toMatch(/^carnegie\/\d+\.pdf$/)
  expect(up.args[1]).toEqual({ contentType: 'application/pdf', upsert: false })
  expect(calls.find((c) => c.table === 'books' && c.method === 'update')!.args[0]).toEqual({ file_path: up.args[0] })
  expect(calls).toContainEqual({ table: 'storage:books', method: 'remove', args: [['carnegie/antigo.pdf']] })
})

test('arquivo que não é PDF ou passa de 50 MB nem chega ao Storage', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadBook(), { wrapper: Wrapper })
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', file: pdf(10, 'image/png'), previousPath: null })).rejects.toThrow(/PDF/) })
  const big = { name: 'g.pdf', type: 'application/pdf', size: 51 * 1024 * 1024 } as File
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', file: big, previousPath: null })).rejects.toThrow(/50 MB/) })
  expect(calls).toHaveLength(0)
})

test('aluna tentando subir: Storage recusa com mensagem clara e nada fica órfão', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadBook(), { wrapper: Wrapper })
  results['storage:upload'] = [{ data: null, error: { message: 'new row violates row-level security policy', statusCode: '403' } }]
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', file: pdf(), previousPath: null })).rejects.toThrow('Só o mentor altera os materiais da biblioteca.') })
  expect(calls.some((c) => c.method === 'remove')).toBe(false)
})

test('se a linha do livro não atualiza, o arquivo recém-enviado é removido', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useUploadBook(), { wrapper: Wrapper })
  results.books = [{ data: [], error: null }]
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', file: pdf(), previousPath: 'carnegie/antigo.pdf' })).rejects.toThrow(/Só o mentor/) })
  const removes = calls.filter((c) => c.method === 'remove')
  expect(removes).toHaveLength(1)
  expect((removes[0].args[0] as string[])[0]).toMatch(/^carnegie\/\d+\.pdf$/) // o novo, nunca o antigo
})

test('remover PDF: limpa a linha e apaga o objeto', async () => {
  results.books = [{ data: [{ id: 'carnegie' }], error: null }]
  const { Wrapper } = setup()
  const { result } = renderHook(() => useRemoveBookFile(), { wrapper: Wrapper })
  await act(async () => { await result.current.mutateAsync({ bookId: 'carnegie', filePath: 'carnegie/1.pdf' }) })
  expect(calls.find((c) => c.table === 'books' && c.method === 'update')!.args[0]).toEqual({ file_path: null })
  expect(calls).toContainEqual({ table: 'storage:books', method: 'remove', args: [['carnegie/1.pdf']] })
})

test('link externo: normaliza, limpa com vazio e recusa esquemas perigosos (RF-62)', async () => {
  const { Wrapper } = setup()
  const { result } = renderHook(() => useSaveBookLink(), { wrapper: Wrapper })
  results.books = [{ data: [{ id: 'carnegie' }], error: null }, { data: [{ id: 'carnegie' }], error: null }]
  await act(async () => { await result.current.mutateAsync({ bookId: 'carnegie', externalUrl: ' https://exemplo.com/a ' }) })
  await act(async () => { await result.current.mutateAsync({ bookId: 'carnegie', externalUrl: '  ' }) })
  const sent = calls.filter((c) => c.method === 'update').map((c) => (c.args[0] as { external_url: string | null }).external_url)
  expect(sent).toEqual(['https://exemplo.com/a', null])
  await act(async () => { await expect(result.current.mutateAsync({ bookId: 'carnegie', externalUrl: 'javascript:alert(1)' })).rejects.toThrow(/http/) })
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/library/hooks.test.tsx 2>&1 | tail -10`
Expected: FAIL — `useBooks: implementado na Task 37`.

- [ ] **Step 3: Implementar**


`src/features/library/hooks.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookFilePath, clampPage, normalizeExternalUrl, validatePdfFile } from '@/domain/library'
import { fail } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Book, BookProgress, RemoveBookFileVars, SaveBookLinkVars, SaveProgressVars, UploadBookVars } from './types'

const BOOKS = ['books'] as const
const ONLY_MENTOR = 'Só o mentor altera os materiais da biblioteca.'

interface ProgressRow { page: number; total_pages: number | null; updated_at: string }
interface Row {
  id: string; order: number; title: string; author: string | null; phase: string; kind: 'livro' | 'curso'
  file_path: string | null; external_url: string | null; book_progress: ProgressRow | ProgressRow[] | null
}

/** RF-60: os materiais na ordem da trilha, cada um com a última página lida. */
export function useBooks() {
  return useQuery({
    queryKey: BOOKS,
    queryFn: async (): Promise<Book[]> => {
      const { data, error } = await supabase.from('books')
        .select('id, order, title, author, phase, kind, file_path, external_url, book_progress(page, total_pages, updated_at)')
        .order('order')
      if (error) throw error
      return (data as unknown as Row[]).map((r) => {
        const p = Array.isArray(r.book_progress) ? r.book_progress[0] : r.book_progress
        return {
          id: r.id, order: r.order, title: r.title, author: r.author, phase: r.phase, kind: r.kind,
          filePath: r.file_path, externalUrl: r.external_url,
          progress: p ? { page: p.page, totalPages: p.total_pages, updatedAt: p.updated_at } : null,
        }
      })
    },
  })
}

/** RF-65: URL assinada de 1 h; nenhum PDF é público. */
export function useBookUrl(filePath: string | null) {
  return useQuery({
    queryKey: ['book_url', filePath],
    enabled: filePath !== null,
    staleTime: 50 * 60_000,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.storage.from('books').createSignedUrl(filePath!, 3600)
      if (error) throw error
      return data.signedUrl
    },
  })
}

/** RF-63: só a aluna grava a página. Atualiza o cache sem recarregar a lista a cada virada de página. */
export function useSaveBookProgress() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveProgressVars>({
    mutationFn: async ({ bookId, page, totalPages }) => {
      const safe = clampPage(page, totalPages)
      const { error } = await supabase.from('book_progress').upsert({ book_id: bookId, page: safe, total_pages: totalPages }, { onConflict: 'book_id' })
      if (error) fail(error, { '42501': 'Só a aluna salva a página de leitura.' })
    },
    onSuccess: (_d, { bookId, page, totalPages }) => {
      const progress: BookProgress = { page: clampPage(page, totalPages), totalPages, updatedAt: new Date().toISOString() }
      qc.setQueryData<Book[]>(BOOKS, (old) => old?.map((b) => (b.id === bookId ? { ...b, progress } : b)))
    },
  })
}

/** RF-61: só o mentor, só PDF, até 50 MB. Sobe com nome novo, aponta o livro para ele e só então apaga o arquivo anterior. */
export function useUploadBook() {
  const qc = useQueryClient()
  return useMutation<void, Error, UploadBookVars>({
    mutationFn: async ({ bookId, file, previousPath }) => {
      const problem = validatePdfFile(file)
      if (problem) throw new Error(problem)
      const path = bookFilePath(bookId, Date.now())
      const up = await supabase.storage.from('books').upload(path, file, { contentType: 'application/pdf', upsert: false })
      if (up.error) fail(up.error, { 'row-level security': ONLY_MENTOR })
      const row = await supabase.from('books').update({ file_path: path }).eq('id', bookId).select('id')
      if (row.error || !row.data || row.data.length === 0) {
        await supabase.storage.from('books').remove([path])
        if (row.error) fail(row.error)
        throw new Error(ONLY_MENTOR)
      }
      if (previousPath) await supabase.storage.from('books').remove([previousPath])
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BOOKS }),
  })
}

export function useRemoveBookFile() {
  const qc = useQueryClient()
  return useMutation<void, Error, RemoveBookFileVars>({
    mutationFn: async ({ bookId, filePath }) => {
      const row = await supabase.from('books').update({ file_path: null }).eq('id', bookId).select('id')
      if (row.error) throw row.error
      if (!row.data || row.data.length === 0) throw new Error(ONLY_MENTOR)
      await supabase.storage.from('books').remove([filePath])
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BOOKS }),
  })
}

/** RF-62: link externo opcional (compra ou audiolivro); `null` limpa. */
export function useSaveBookLink() {
  const qc = useQueryClient()
  return useMutation<void, Error, SaveBookLinkVars>({
    mutationFn: async ({ bookId, externalUrl }) => {
      const url = externalUrl === null || externalUrl.trim() === '' ? null : normalizeExternalUrl(externalUrl)
      if (externalUrl !== null && externalUrl.trim() !== '' && url === null) throw new Error('Use um link que comece com http:// ou https://.')
      const { data, error } = await supabase.from('books').update({ external_url: url }).eq('id', bookId).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error(ONLY_MENTOR)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BOOKS }),
  })
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/library 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/library/hooks.ts src/features/library/hooks.test.tsx
git commit -m "feat(library): supabase hooks for books, reading progress and pdf upload"
```

---
### Task 38: ChecklistsScreen e ChecklistEditor — **[W4]**

**Files:**

- Create: `src/features/checklists/ChecklistEditor.tsx`
- Create: `src/features/checklists/ChecklistsScreen.tsx`
- Test: `src/features/checklists/ChecklistsScreen.test.tsx`

**Interfaces:**
- Consumes: `useChecklists`, `useSaveChecklist`, `useToggleChecklistItem`, `useDeleteChecklist` (mockados a partir da Task 33); `validateChecklistDraft`, `checklistProgress` (Task 33); `NODES`; `useAuth`; `Badge`, `Button`, `Card`, `Checkbox`, `ProgressBar`; `crypto.randomUUID()`.
- Produces: `ChecklistsScreen()` (sem props; aba "Listas" em `/caderno/checklists`) e `ChecklistEditor({ initial?, onDone })`. RF-42: título, itens, semana opcional (as 16 semanas) e data opcional; cada pessoa edita e apaga só as próprias listas (a outra vê em só leitura, com "Lista da aluna" / "Lista do mentor"); marcar item é imediato; "Apagar" pede confirmação. Os ids da lista e dos itens nascem no cliente e os itens que ficam mantêm o id ao editar (a marcação deles é preservada).


- [ ] **Step 1: Testes**

`src/features/checklists/ChecklistsScreen.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { asyncMutationOf, checklistOf, queryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')

import { useAuth } from '@/features/auth/AuthProvider'
import { ChecklistsScreen } from './ChecklistsScreen'
import * as api from './hooks'

const toggle = vi.fn()
const save = vi.fn()
const remove = vi.fn()

function setup(lists = [checklistOf()], role: 'aluna' | 'mentor' = 'aluna') {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(api.useChecklists).mockReturnValue(queryOf(lists))
  vi.mocked(api.useToggleChecklistItem).mockReturnValue({ ...(asyncMutationOf() as object), mutate: toggle } as never)
  vi.mocked(api.useSaveChecklist).mockReturnValue({ ...(asyncMutationOf() as object), mutate: save } as never)
  vi.mocked(api.useDeleteChecklist).mockReturnValue({ ...(asyncMutationOf() as object), mutate: remove } as never)
  return render(<ChecklistsScreen />)
}

beforeEach(() => vi.clearAllMocks())

test('mostra a lista com semana, progresso e itens marcados', () => {
  setup()
  expect(screen.getByRole('heading', { name: 'Semana 5' })).toBeInTheDocument()
  expect(screen.getByText('Semana 5', { selector: 'span' })).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: 'Ligar para 5 empresas' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Escrever 10 respostas' })).not.toBeChecked()
})

test('marcar um item chama a mutation', async () => {
  setup()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Escrever 10 respostas' }))
  expect(toggle).toHaveBeenCalledWith({ itemId: 'i2', done: true })
})

test('lista da outra pessoa é só leitura, com o nome de quem é', () => {
  setup([checklistOf({ mine: false })], 'mentor')
  expect(screen.getByText('Lista da aluna')).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: 'Escrever 10 respostas' })).toBeDisabled()
  expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Apagar/ })).not.toBeInTheDocument()
})

test('nova lista: título, itens, semana e data; só salva quando válida (RF-42)', async () => {
  setup([])
  await userEvent.click(screen.getByRole('button', { name: 'Nova lista' }))
  const saveButton = screen.getByRole('button', { name: 'Salvar lista' })
  expect(saveButton).toBeDisabled()
  await userEvent.type(screen.getByLabelText('Título'), 'Preparar a semana')
  expect(saveButton).toBeDisabled() // item vazio
  await userEvent.type(screen.getByLabelText('Item 1'), 'Ler o capítulo 3')
  await userEvent.click(screen.getByRole('button', { name: 'Adicionar item' }))
  await userEvent.type(screen.getByLabelText('Item 2'), 'Ligar para 3 empresas')
  await userEvent.selectOptions(screen.getByLabelText('Semana (opcional)'), 'w05')
  await userEvent.type(screen.getByLabelText('Data (opcional)'), '2026-10-04')
  expect(saveButton).toBeEnabled()
  await userEvent.click(saveButton)
  const vars = save.mock.calls[0][0]
  expect(vars).toMatchObject({ title: 'Preparar a semana', weekId: 'w05', dueDate: '2026-10-04' })
  expect(vars.id).toEqual(expect.any(String))
  expect(vars.items.map((i: { text: string }) => i.text)).toEqual(['Ler o capítulo 3', 'Ligar para 3 empresas'])
  expect(new Set(vars.items.map((i: { id: string }) => i.id)).size).toBe(2)
})

test('editar preserva os ids dos itens e remover tira o item', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: 'Editar Semana 5' }))
  await userEvent.click(screen.getByRole('button', { name: 'Remover item 2' }))
  await userEvent.click(screen.getByRole('button', { name: 'Salvar lista' }))
  expect(save.mock.calls[0][0]).toMatchObject({ id: 'c1', items: [{ id: 'i1', text: 'Ligar para 5 empresas' }] })
})

test('apagar pede confirmação', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: 'Apagar Semana 5' }))
  expect(remove).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))
  expect(remove).toHaveBeenCalledWith('c1')
})

test('sem listas mostra a mensagem', () => {
  setup([])
  expect(within(document.body).getByText('Nenhuma lista ainda.')).toBeInTheDocument()
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/checklists 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import` do componente ainda inexistente.

- [ ] **Step 3: Implementar**

`src/features/checklists/ChecklistEditor.tsx`:
```tsx
import { useState } from 'react'
import { Button, Card } from '@/design/ui'
import { NODES } from '@/content/trail'
import { validateChecklistDraft } from '@/domain/checklists'
import { useSaveChecklist } from './hooks'
import type { Checklist } from './types'

const WEEKS = NODES.filter((n) => n.week !== undefined)
const inputClass = 'h-12 rounded-control border-2 border-line bg-surface px-3 font-normal focus:border-brand focus:outline-none'

/** Cria ou edita uma lista (RF-42): título, itens, semana e data opcionais. Os ids nascem aqui, então salvar de novo é seguro. */
export function ChecklistEditor({ initial, onDone }: { initial?: Checklist; onDone(): void }) {
  const save = useSaveChecklist()
  const [id] = useState(() => initial?.id ?? crypto.randomUUID())
  const [title, setTitle] = useState(initial?.title ?? '')
  const [weekId, setWeekId] = useState(initial?.weekId ?? '')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [items, setItems] = useState<{ id: string; text: string }[]>(
    initial?.items.map((i) => ({ id: i.id, text: i.text })) ?? [{ id: crypto.randomUUID(), text: '' }],
  )

  const draft = { title, weekId: weekId || null, dueDate: dueDate || null, items }
  const problem = validateChecklistDraft(draft)
  const setText = (itemId: string, text: string) => setItems((xs) => xs.map((x) => (x.id === itemId ? { ...x, text } : x)))

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-black">{initial ? 'Editar lista' : 'Nova lista'}</h2>
      <label className="flex flex-col gap-1 font-bold">Título
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </label>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 font-bold">Semana (opcional)
          <select value={weekId} onChange={(e) => setWeekId(e.target.value)} className={inputClass}>
            <option value="">Nenhuma</option>
            {WEEKS.map((w) => <option key={w.id} value={w.id}>Semana {w.week}: {w.title}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-bold">Data (opcional)
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-bold">Itens</legend>
        {items.map((it, n) => (
          <div key={it.id} className="flex gap-2">
            <input aria-label={`Item ${n + 1}`} value={it.text} onChange={(e) => setText(it.id, e.target.value)} className={`${inputClass} flex-1`} />
            <Button variant="ghost" size="sm" aria-label={`Remover item ${n + 1}`} onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}>Remover</Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => setItems((xs) => [...xs, { id: crypto.randomUUID(), text: '' }])}>Adicionar item</Button>
      </fieldset>

      {problem && title !== '' && <p aria-live="polite" className="text-sm text-muted">{problem}</p>}
      {save.error && <p role="alert" className="text-danger">{save.error.message}</p>}
      <div className="flex gap-2">
        <Button disabled={problem !== null} loading={save.isPending} onClick={() => save.mutate({ id, ...draft }, { onSuccess: onDone })}>Salvar lista</Button>
        <Button variant="ghost" onClick={onDone}>Cancelar</Button>
      </div>
    </Card>
  )
}
```

`src/features/checklists/ChecklistsScreen.tsx`:
```tsx
import { useState } from 'react'
import { Badge, Button, Card, Checkbox, ProgressBar } from '@/design/ui'
import { NODES } from '@/content/trail'
import { checklistProgress } from '@/domain/checklists'
import { useAuth } from '@/features/auth/AuthProvider'
import { ChecklistEditor } from './ChecklistEditor'
import { useChecklists, useDeleteChecklist, useToggleChecklistItem } from './hooks'
import type { Checklist } from './types'

const dueFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })

/** `/caderno/checklists` (RF-42): listas manuais das duas contas; cada uma edita só as suas. */
export function ChecklistsScreen() {
  const { profile } = useAuth()
  const otherName = profile?.role === 'mentor' ? 'Lista da aluna' : 'Lista do mentor'
  const lists = useChecklists()
  const toggle = useToggleChecklistItem()
  const remove = useDeleteChecklist()
  const [editing, setEditing] = useState<Checklist | 'new' | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  if (lists.isLoading) return <p role="status" className="p-6 text-muted">Carregando as listas…</p>
  if (!lists.data) return <p role="alert" className="p-6 text-danger">Não foi possível carregar as listas.</p>

  return (
    <div className="flex flex-col gap-4">
      {editing ? (
        <ChecklistEditor key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
      ) : (
        <Button variant="secondary" onClick={() => setEditing('new')}>Nova lista</Button>
      )}
      {lists.data.length === 0 && <p className="text-muted">Nenhuma lista ainda.</p>}
      {toggle.error && <p role="alert" className="text-danger">{toggle.error.message}</p>}
      {remove.error && <p role="alert" className="text-danger">{remove.error.message}</p>}
      {lists.data.map((l) => {
        const p = checklistProgress(l.items)
        const week = NODES.find((n) => n.id === l.weekId)
        return (
          <Card key={l.id} className="flex flex-col gap-3">
            <header className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold">{l.title}</h2>
              {!l.mine && <Badge tone="muted">{otherName}</Badge>}
              {week?.week !== undefined && <Badge tone="brand">Semana {week.week}</Badge>}
              {l.dueDate && <Badge tone="streak">Até {dueFormat.format(new Date(`${l.dueDate}T12:00:00Z`))}</Badge>}
            </header>
            <ProgressBar value={p.ratio} label={`${l.title}: ${p.done} de ${p.total}`} />
            <ul className="flex flex-col gap-1">
              {l.items.map((i) => (
                <li key={i.id}>
                  <Checkbox checked={i.done} label={i.text} disabled={!l.mine} onChange={(done) => toggle.mutate({ itemId: i.id, done })} />
                </li>
              ))}
            </ul>
            {l.mine && (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(l)}>Editar {l.title}</Button>
                {confirming === l.id
                  ? <Button size="sm" variant="danger" onClick={() => { remove.mutate(l.id); setConfirming(null) }}>Confirmar exclusão</Button>
                  : <Button size="sm" variant="ghost" onClick={() => setConfirming(l.id)}>Apagar {l.title}</Button>}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/checklists 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/checklists/ChecklistEditor.tsx src/features/checklists/ChecklistsScreen.tsx src/features/checklists/ChecklistsScreen.test.tsx
git commit -m "feat(checklists): manual checklists screen and editor"
```

---

### Task 39: PdfReader — **[W4]**

**Files:**
- Create: `src/features/library/pdfWorker.ts`, `src/features/library/PdfReader.tsx`
- Modify: `package.json`, `package-lock.json` (só esta Task mexe neles)
- Test: `src/features/library/PdfReader.test.tsx`

**Interfaces:**
- Consumes: `react-pdf` (`Document`, `Page`, `pdfjs`); `clampPage` (Task 33); `Button`.
- Produces: `PdfReader({ url, initialPage, onPageChange? })` com `onPageChange(page, total)`: abre na página pedida (ajustada ao tamanho real do PDF, Review Focus 4), "Página anterior" / "Próxima página", campo "Ir para a página" (vale com Enter ou ao sair do campo), "de N", alerta legível se o PDF não abre; chama `onPageChange` ao abrir e a cada troca. `src/features/library/pdfWorker.ts` só configura o worker do PDF.js (efeito colateral do import).

- [ ] **Step 1: Instalar a dependência e conferir o worker**

Run: `npm i react-pdf@^11 2>&1 | tail -2 && ls node_modules/pdfjs-dist/build/pdf.worker.min.mjs`
Expected: `react-pdf` em `dependencies`; o arquivo do worker existe (a Task usa `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`; se o gerenciador de pacotes não deixar `pdfjs-dist` acessível na raiz, acrescente `pdfjs-dist` às dependências com a mesma versão que o `react-pdf` pede).

- [ ] **Step 2: Testes (o `react-pdf` é simulado; o navegador de verdade é conferido na Task 43)**


`src/features/library/PdfReader.test.tsx`:
```tsx
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const pdfState = vi.hoisted(() => ({ numPages: 10, fail: false }))
vi.mock('react-pdf', async () => {
  const { useEffect } = await import('react')
  return {
    pdfjs: { GlobalWorkerOptions: {} },
    Document: ({ children, onLoadSuccess, onLoadError }: { children: ReactNode; onLoadSuccess: (d: { numPages: number }) => void; onLoadError: () => void }) => {
      useEffect(() => { if (pdfState.fail) onLoadError(); else onLoadSuccess({ numPages: pdfState.numPages }) }, [onLoadSuccess, onLoadError])
      return pdfState.fail ? null : <div data-testid="document">{children}</div>
    },
    Page: ({ pageNumber }: { pageNumber: number }) => <div data-testid="page">página {pageNumber}</div>,
  }
})

import { PdfReader } from './PdfReader'

beforeEach(() => { pdfState.numPages = 10; pdfState.fail = false })

test('abre na última página lida e avisa o total (RF-63)', async () => {
  const onPageChange = vi.fn()
  render(<PdfReader url="https://signed.test/a.pdf" initialPage={4} onPageChange={onPageChange} />)
  expect(await screen.findByText('página 4')).toBeInTheDocument()
  await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(4, 10))
  expect(screen.getByText('de 10')).toBeInTheDocument()
})

test('PDF trocado por um menor: a página salva é ajustada ao novo total (Review Focus 4)', async () => {
  pdfState.numPages = 6
  const onPageChange = vi.fn()
  render(<PdfReader url="u" initialPage={80} onPageChange={onPageChange} />)
  expect(await screen.findByText('página 6')).toBeInTheDocument()
  expect(onPageChange).toHaveBeenLastCalledWith(6, 6)
})

test('próxima e anterior respeitam os limites e avisam a cada troca', async () => {
  const onPageChange = vi.fn()
  render(<PdfReader url="u" initialPage={1} onPageChange={onPageChange} />)
  await screen.findByText('página 1')
  const prev = screen.getByRole('button', { name: 'Página anterior' })
  const next = screen.getByRole('button', { name: 'Próxima página' })
  expect(prev).toBeDisabled()
  await userEvent.click(next)
  expect(screen.getByText('página 2')).toBeInTheDocument()
  expect(onPageChange).toHaveBeenLastCalledWith(2, 10)
  await userEvent.click(prev)
  expect(screen.getByText('página 1')).toBeInTheDocument()
})

test('ir direto para uma página, com limite no total', async () => {
  render(<PdfReader url="u" initialPage={1} />)
  await screen.findByText('página 1')
  const input = screen.getByLabelText('Ir para a página')
  await userEvent.clear(input)
  await userEvent.type(input, '7{Enter}')
  expect(screen.getByText('página 7')).toBeInTheDocument()
  await userEvent.clear(input)
  await userEvent.type(input, '99{Enter}')
  expect(screen.getByText('página 10')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
})

test('falha ao abrir mostra alerta legível', async () => {
  pdfState.fail = true
  render(<PdfReader url="u" initialPage={1} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível abrir o PDF')
})
```


- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/features/library/PdfReader.test.tsx 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import "./PdfReader"`.

- [ ] **Step 4: Implementar**


`src/features/library/pdfWorker.ts`:
```ts
import { pdfjs } from 'react-pdf'

// Vite copia o worker do PDF.js para o build e devolve a URL final.
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
```

`src/features/library/PdfReader.tsx`:
```tsx
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
            className="h-9 w-20 rounded-control border-2 border-line bg-surface px-2 tabular-nums focus:border-brand focus:outline-none" />
        </label>
        <span aria-live="polite" className="text-sm text-muted">de {total ?? '…'}</span>
        <Button size="sm" variant="secondary" disabled={total === null || page >= total} onClick={() => go(page + 1)}>Próxima página</Button>
      </div>
    </div>
  )
}
```


- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/features/library/PdfReader.test.tsx 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/features/library/pdfWorker.ts src/features/library/PdfReader.tsx src/features/library/PdfReader.test.tsx
git commit -m "feat(library): embedded pdf reader that resumes on the last page"
```

---

### Task 40: LibraryScreen, BookScreen e BookAdmin — **[W4]**

**Files:**

- Create: `src/features/library/BookAdmin.tsx`
- Create: `src/features/library/LibraryScreen.tsx`
- Create: `src/features/library/BookScreen.tsx`
- Test: `src/features/library/LibraryScreen.test.tsx`, `src/features/library/BookScreen.test.tsx`

**Interfaces:**
- Consumes: `useBooks`, `useBookUrl`, `useSaveBookProgress`, `useUploadBook`, `useRemoveBookFile`, `useSaveBookLink` (mockados a partir da Task 33); `PdfReader` (Task 39); `phaseLabel`, `MAX_PDF_BYTES` (Task 33); `useDebounced` (Task 35); `useAuth`; `Badge`, `Button`, `Card`, `ProgressBar`.
- Produces: `LibraryScreen()` (`/biblioteca`, RF-60/64): materiais na ordem da trilha com tipo, fase e página lida; curso abre por link externo; livro sem PDF mostra "PDF ainda não disponível". `BookScreen()` (`/biblioteca/:bookId`): leitor na última página lida (RF-63); a página só é gravada pela aluna, depois de 1 s parada; sem PDF, aviso e link externo opcional (RF-62); "Material não encontrado". `BookAdmin({ book })` (só o mentor, RF-61/62): enviar ou trocar o PDF (até 50 MB, só PDF), remover com confirmação e guardar o link externo; erros do envio aparecem como alerta. O leitor entra por `lazy` na Task 43.


- [ ] **Step 1: Testes**

`src/features/library/LibraryScreen.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { bookOf, courseOf, queryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import * as api from './hooks'
import { LibraryScreen } from './LibraryScreen'

function setup(books = [bookOf(), courseOf()]) {
  vi.mocked(api.useBooks).mockReturnValue(queryOf(books))
  return render(<MemoryRouter><LibraryScreen /></MemoryRouter>)
}

test('lista os materiais com tipo e fase (RF-60)', () => {
  setup()
  expect(screen.getByText('Como Fazer Amigos e Influenciar Pessoas')).toBeInTheDocument()
  expect(screen.getByText('Livro')).toBeInTheDocument()
  expect(screen.getByText('Curso')).toBeInTheDocument()
  expect(screen.getByText('Fase 1')).toBeInTheDocument()
  expect(screen.getByText('Fases 2 e 3')).toBeInTheDocument()
})

test('livro sem PDF mostra "PDF ainda não disponível" (RF-62)', () => {
  setup([bookOf()])
  expect(screen.getByText('PDF ainda não disponível')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ver detalhes' })).toHaveAttribute('href', '/biblioteca/carnegie')
})

test('livro com PDF e progresso oferece continuar na página lida', () => {
  setup([bookOf({ filePath: 'carnegie/1.pdf', progress: { page: 12, totalPages: 200, updatedAt: 'x' } })])
  expect(screen.getByRole('link', { name: 'Continuar na página 12' })).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: /página 12 de 200/ })).toBeInTheDocument()
  expect(screen.queryByText('PDF ainda não disponível')).not.toBeInTheDocument()
})

test('curso abre por link externo em nova aba (RF-64)', () => {
  setup([courseOf()])
  const link = screen.getByRole('link', { name: 'Abrir curso' })
  expect(link).toHaveAttribute('href', 'https://loja.sebrae.com.br/cursos/cursos-online')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})
```

`src/features/library/BookScreen.test.tsx`:
```tsx
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { asyncMutationOf, bookOf, courseOf, queryOf } from '@/test/e6Mocks'
import type { Book } from './types'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')
vi.mock('./PdfReader', () => ({
  PdfReader: ({ url, initialPage, onPageChange }: { url: string; initialPage: number; onPageChange: (p: number, t: number) => void }) => (
    <div>
      <p>leitor {url} na página {initialPage}</p>
      <button onClick={() => onPageChange(9, 200)}>virar para 9</button>
    </div>
  ),
}))

import { useAuth } from '@/features/auth/AuthProvider'
import { BookScreen } from './BookScreen'
import * as api from './hooks'

const saveProgress = vi.fn()
const upload = vi.fn()
const saveLink = vi.fn()

function setup(book: Book, role: 'aluna' | 'mentor' = 'aluna') {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(api.useBooks).mockReturnValue(queryOf([book]))
  vi.mocked(api.useBookUrl).mockReturnValue(queryOf('https://signed.test/carnegie/1.pdf'))
  vi.mocked(api.useSaveBookProgress).mockReturnValue({ ...(asyncMutationOf() as object), mutate: saveProgress } as never)
  vi.mocked(api.useUploadBook).mockReturnValue({ ...(asyncMutationOf() as object), mutate: upload } as never)
  vi.mocked(api.useRemoveBookFile).mockReturnValue(asyncMutationOf())
  vi.mocked(api.useSaveBookLink).mockReturnValue({ ...(asyncMutationOf() as object), mutate: saveLink } as never)
  return render(<MemoryRouter initialEntries={[`/biblioteca/${book.id}`]}><Routes><Route path="/biblioteca/:bookId" element={<BookScreen />} /></Routes></MemoryRouter>)
}

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ shouldAdvanceTime: true }) })
afterEach(() => vi.useRealTimers())

test('abre o leitor na última página lida', () => {
  setup(bookOf({ filePath: 'carnegie/1.pdf', progress: { page: 12, totalPages: 200, updatedAt: 'x' } }))
  expect(screen.getByText('leitor https://signed.test/carnegie/1.pdf na página 12')).toBeInTheDocument()
})

test('aluna: a página é gravada depois de 1 s parada, não a cada virada (RF-63)', async () => {
  setup(bookOf({ filePath: 'carnegie/1.pdf', progress: { page: 12, totalPages: 200, updatedAt: 'x' } }))
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'virar para 9' }))
  expect(saveProgress).not.toHaveBeenCalled()
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveProgress).toHaveBeenCalledWith({ bookId: 'carnegie', page: 9, totalPages: 200 })
})

test('mentor lê, mas não grava a página', async () => {
  setup(bookOf({ filePath: 'carnegie/1.pdf', progress: null }), 'mentor')
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'virar para 9' }))
  await act(async () => { await vi.advanceTimersByTimeAsync(1500) })
  expect(saveProgress).not.toHaveBeenCalled()
})

test('sem PDF: aviso e link externo opcional; aluna não vê a administração (RF-62)', () => {
  setup(bookOf({ externalUrl: 'https://exemplo.com/audiolivro' }))
  expect(screen.getByText('PDF ainda não disponível')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Abrir link/ })).toHaveAttribute('href', 'https://exemplo.com/audiolivro')
  expect(screen.queryByText('Administrar material')).not.toBeInTheDocument()
})

test('mentor envia o PDF e guarda o link (RF-61/62)', async () => {
  setup(bookOf({ filePath: 'carnegie/velho.pdf' }), 'mentor')
  const file = new File(['%PDF-1.4'], 'livro.pdf', { type: 'application/pdf' })
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).upload(screen.getByLabelText(/Trocar o PDF/), file)
  expect(upload).toHaveBeenCalledWith({ bookId: 'carnegie', file, previousPath: 'carnegie/velho.pdf' })
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).type(screen.getByLabelText(/Link externo/), 'https://exemplo.com/compra')
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Salvar link' }))
  expect(saveLink).toHaveBeenCalledWith({ bookId: 'carnegie', externalUrl: 'https://exemplo.com/compra' })
})

test('curso mostra só o link e livro inexistente dá erro', () => {
  setup(courseOf())
  expect(screen.getByRole('link', { name: 'Abrir curso' })).toBeInTheDocument()
  expect(screen.queryByText('PDF ainda não disponível')).not.toBeInTheDocument()
})

test('material inexistente', () => {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role: 'aluna', name: 'X' } } as never)
  vi.mocked(api.useBooks).mockReturnValue(queryOf([bookOf()]))
  render(<MemoryRouter initialEntries={['/biblioteca/nao-existe']}><Routes><Route path="/biblioteca/:bookId" element={<BookScreen />} /></Routes></MemoryRouter>)
  expect(screen.getByRole('alert')).toHaveTextContent('Material não encontrado')
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/library 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import` do componente ainda inexistente.

- [ ] **Step 3: Implementar**

`src/features/library/BookAdmin.tsx`:
```tsx
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
```

`src/features/library/LibraryScreen.tsx`:
```tsx
import { Link } from 'react-router'
import { Badge, Card, ProgressBar } from '@/design/ui'
import { phaseLabel } from '@/domain/library'
import { useBooks } from './hooks'

/** `/biblioteca` (RF-60/64): os materiais na ordem da trilha; cursos abrem por link externo. */
export function LibraryScreen() {
  const books = useBooks()
  if (books.isLoading) return <p role="status" className="p-6 text-muted">Carregando a biblioteca…</p>
  if (!books.data) return <p role="alert" className="p-6 text-danger">Não foi possível carregar a biblioteca.</p>

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-8">
      <h1 className="font-display text-5xl leading-none font-black text-brand text-glow">Biblioteca</h1>
      <ul className="flex flex-col gap-3">
        {books.data.map((b) => {
          const ratio = b.progress?.totalPages ? b.progress.page / b.progress.totalPages : 0
          return (
            <li key={b.id}>
              <Card className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={b.kind === 'livro' ? 'brand' : 'success'}>{b.kind === 'livro' ? 'Livro' : 'Curso'}</Badge>
                  <Badge tone="muted">{phaseLabel(b.phase)}</Badge>
                </div>
                <h2 className="font-bold">{b.title}</h2>
                {b.author && <p className="text-sm text-muted">{b.author}</p>}
                {b.kind === 'curso' ? (
                  b.externalUrl && <a href={b.externalUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-4">Abrir curso</a>
                ) : (
                  <>
                    {b.progress && b.progress.totalPages && (
                      <ProgressBar value={ratio} label={`${b.title}: página ${b.progress.page} de ${b.progress.totalPages}`} />
                    )}
                    <Link to={`/biblioteca/${b.id}`} className="font-bold text-brand underline underline-offset-4">
                      {b.filePath ? (b.progress ? `Continuar na página ${b.progress.page}` : 'Ler') : 'Ver detalhes'}
                    </Link>
                    {!b.filePath && <p className="text-sm text-muted">PDF ainda não disponível</p>}
                  </>
                )}
              </Card>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
```

`src/features/library/BookScreen.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Badge, Card } from '@/design/ui'
import { phaseLabel } from '@/domain/library'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDebounced } from '@/lib/useDebounced'
import { BookAdmin } from './BookAdmin'
import { useBooks, useBookUrl, useSaveBookProgress } from './hooks'
import { PdfReader } from './PdfReader'
import type { Book } from './types'

function Reader({ book, role }: { book: Book; role: 'aluna' | 'mentor' }) {
  const url = useBookUrl(book.filePath)
  const save = useSaveBookProgress()
  const [seen, setSeen] = useState<{ page: number; total: number } | null>(null)
  const settled = useDebounced(seen, 1000)
  const saved = book.progress?.page

  // RF-63: só a aluna grava a página; espera a leitura assentar (1 s) em vez de gravar a cada virada.
  useEffect(() => {
    if (role === 'aluna' && settled && (settled.page !== saved || book.progress?.totalPages !== settled.total)) {
      save.mutate({ bookId: book.id, page: settled.page, totalPages: settled.total })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled])

  if (url.isLoading) return <p role="status" className="text-muted">Preparando o PDF…</p>
  if (!url.data) return <p role="alert" className="text-danger">Não foi possível preparar o PDF.</p>
  return <PdfReader url={url.data} initialPage={book.progress?.page ?? 1} onPageChange={(page, total) => setSeen({ page, total })} />
}

/** `/biblioteca/:bookId`: leitor de PDF (RF-63), "PDF ainda não disponível" com link opcional (RF-62) e, para o mentor, a administração. */
export function BookScreen() {
  const { bookId } = useParams()
  const { profile } = useAuth()
  const role = profile?.role ?? 'aluna'
  const books = useBooks()

  if (books.isLoading) return <p role="status" className="p-6 text-muted">Carregando…</p>
  const book = books.data?.find((b) => b.id === bookId)
  if (!book) return <p role="alert" className="p-6 text-danger">Material não encontrado.</p>

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-8">
      <Link to="/biblioteca" className="font-bold text-brand underline underline-offset-4">Voltar à biblioteca</Link>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge tone={book.kind === 'livro' ? 'brand' : 'success'}>{book.kind === 'livro' ? 'Livro' : 'Curso'}</Badge>
          <Badge tone="muted">{phaseLabel(book.phase)}</Badge>
        </div>
        <h1 className="font-display text-3xl leading-tight font-black">{book.title}</h1>
        {book.author && <p className="text-muted">{book.author}</p>}
      </header>

      {book.kind === 'curso' && book.externalUrl && (
        <a href={book.externalUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-4">Abrir curso</a>
      )}

      {book.kind === 'livro' && (book.filePath
        ? <Reader key={book.filePath} book={book} role={role} />
        : (
          <Card className="flex flex-col gap-2">
            <p className="font-bold">PDF ainda não disponível</p>
            {book.externalUrl && <a href={book.externalUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-4">Abrir link (compra ou audiolivro)</a>}
          </Card>
        ))}

      {role === 'mentor' && book.kind === 'livro' && <BookAdmin key={`${book.id}:${book.filePath}`} book={book} />}
    </main>
  )
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/library 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/library/BookAdmin.tsx src/features/library/LibraryScreen.tsx src/features/library/BookScreen.tsx src/features/library/LibraryScreen.test.tsx src/features/library/BookScreen.test.tsx
git commit -m "feat(library): library list, book screen with reader and mentor admin"
```

---

### Task 41: JournalScreen, JournalForm e MentorJournal — **[W4]**

**Files:**

- Create: `src/features/journal/JournalForm.tsx`
- Create: `src/features/journal/MentorJournal.tsx`
- Create: `src/features/journal/JournalScreen.tsx`
- Test: `src/features/journal/JournalForm.test.tsx`, `src/features/journal/JournalScreen.test.tsx`

**Interfaces:**
- Consumes: `useJournalEntries`, `useSaveJournalEntry` (mockados a partir da Task 33); `useAutosave` (Task 35); `journalDayStatus`, `DAY_STATUS_LABEL`, `lastDays` (Task 33); `fieldOk`, `MIN_FIELD`, `writeWindow` (Parte 2); `formatWhen` de `@/features/simulations/format` (E5); `useAuth`; `Badge`, `Card`, `TextArea`.
- Produces: `JournalScreen()` (`/caderno` e `/caderno/dia/:date`, sem props). Aluna: `JournalForm({ date, initial })` com os 3 campos e contador de 15 caracteres, salvamento automático com "Salvo", marca "Completo" / "Preenchido com atraso" vinda do banco, aviso do prazo até 12:00 e dia fechado somente leitura (Review Focus 1), mais a lista dos últimos 14 dias com a situação de cada um; data inválida ou futura volta para hoje. Mentor: `MentorJournal({ entries })` com 30 dias, texto dos campos, "Criado … · atualizado …" (horários do banco) e "Em falta". O mentor nunca vê formulário.


- [ ] **Step 1: Testes**

`src/features/journal/JournalForm.test.tsx`:
```tsx
import { act, fireEvent, render, screen } from '@testing-library/react'
import { asyncMutationOf, entryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import { JournalForm } from './JournalForm'
import * as api from './hooks'

const saveAsync = vi.fn()

function setup(date: string, initial = undefined as ReturnType<typeof entryOf> | undefined, saved?: ReturnType<typeof entryOf>) {
  saveAsync.mockResolvedValue(saved ?? entryOf({ date }))
  vi.mocked(api.useSaveJournalEntry).mockReturnValue({ ...(asyncMutationOf(saveAsync) as object), data: saved } as never)
  return render(<JournalForm date={date} initial={initial} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-29T15:00:00Z')) // 12:00 em SP
})
afterEach(() => vi.useRealTimers())

test('três campos com contador de 15 caracteres e o dia pendente (RF-50)', () => {
  setup('2026-09-29')
  expect(screen.getByLabelText('Uma coisa que aprendi')).toBeInTheDocument()
  expect(screen.getByLabelText('Uma coisa que pratiquei')).toBeInTheDocument()
  expect(screen.getByLabelText('Uma coisa para amanhã')).toBeInTheDocument()
  expect(screen.getByText('Pendente')).toBeInTheDocument()
  expect(screen.getByText(/3 campos de pelo menos 15 caracteres/)).toBeInTheDocument()
})

test('digitar salva sozinho depois de 1 s e mostra "Salvo" (RF-54)', async () => {
  setup('2026-09-29')
  fireEvent.change(screen.getByLabelText('Uma coisa que aprendi'), { target: { value: 'aprendi a ouvir o cliente' } })
  expect(saveAsync).not.toHaveBeenCalled()
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveAsync).toHaveBeenCalledWith({ date: '2026-09-29', learned: 'aprendi a ouvir o cliente', practiced: '', tomorrow: '' })
  expect(screen.getByText('Salvo')).toBeInTheDocument()
})

test('a marca "Completo" vem do banco, não do navegador', () => {
  setup('2026-09-29', entryOf({ date: '2026-09-29', complete: false }), entryOf({ date: '2026-09-29', complete: true }))
  expect(screen.getByText('Completo')).toBeInTheDocument()
})

test('ontem antes do meio-dia ainda dá para preencher e vira "com atraso" (RF-50)', () => {
  vi.setSystemTime(new Date('2026-09-30T14:59:00Z')) // 11:59 em SP
  setup('2026-09-29')
  expect(screen.getByText(/ainda pode preencher este dia até 12:00/)).toBeInTheDocument()
  expect(screen.getByLabelText('Uma coisa que aprendi')).toBeEnabled()
})

test('a entrada preenchida com atraso mostra a marca depois de fechar', () => {
  vi.setSystemTime(new Date('2026-10-02T15:00:00Z'))
  setup('2026-09-29', entryOf({ date: '2026-09-29', complete: true, late: true }))
  expect(screen.getByText('Preenchido com atraso')).toBeInTheDocument()
})

test('meio-dia em ponto: o dia fecha e nada é editável nem salvo (Review Focus 1)', async () => {
  vi.setSystemTime(new Date('2026-09-30T15:00:00Z')) // 12:00 em SP
  setup('2026-09-29')
  expect(screen.getByText(/Este dia está fechado/)).toBeInTheDocument()
  expect(screen.getByText('Em falta')).toBeInTheDocument()
  expect(screen.getByLabelText('Uma coisa que aprendi')).toBeDisabled()
  await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
  expect(saveAsync).not.toHaveBeenCalled()
})

test('erro ao salvar aparece como alerta', async () => {
  setup('2026-09-29')
  saveAsync.mockRejectedValue(new Error('O prazo deste dia já passou'))
  fireEvent.change(screen.getByLabelText('Uma coisa que aprendi'), { target: { value: 'aprendi algo novo hoje' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(screen.getByRole('alert')).toHaveTextContent('O prazo deste dia já passou')
})
```

`src/features/journal/JournalScreen.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { asyncMutationOf, entryOf, queryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')

import { useAuth } from '@/features/auth/AuthProvider'
import * as api from './hooks'
import { JournalScreen } from './JournalScreen'

function setup(role: 'aluna' | 'mentor', path = '/caderno', entries = [entryOf({ date: '2026-09-28' })]) {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role, name: 'X' } } as never)
  vi.mocked(api.useJournalEntries).mockReturnValue(queryOf(entries))
  vi.mocked(api.useSaveJournalEntry).mockReturnValue(asyncMutationOf())
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/caderno" element={<JournalScreen />} />
        <Route path="/caderno/dia/:date" element={<JournalScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-29T15:00:00Z')) // terça, 12:00 em SP
})
afterEach(() => vi.useRealTimers())

test('aluna abre o dia de hoje e vê os últimos 14 dias com a situação de cada um', () => {
  setup('aluna')
  expect(screen.getByRole('heading', { name: /terça-feira, 29 de setembro/i })).toBeInTheDocument()
  const days = within(screen.getByRole('list')).getAllByRole('listitem')
  expect(days).toHaveLength(14)
  expect(days[0]).toHaveTextContent('29/09')
  expect(days[0]).toHaveTextContent('Pendente')
  expect(days[1]).toHaveTextContent('28/09')
  expect(days[1]).toHaveTextContent('Completo')
  expect(days[2]).toHaveTextContent('Em falta')
})

test('link de um dia anterior abre aquele dia', () => {
  setup('aluna', '/caderno/dia/2026-09-28')
  expect(screen.getByRole('heading', { name: /segunda-feira, 28 de setembro/i })).toBeInTheDocument()
  expect(screen.getByDisplayValue('aprendi a ouvir o cliente')).toBeInTheDocument()
})

test('data inválida ou futura volta para hoje', () => {
  setup('aluna', '/caderno/dia/2026-10-05')
  expect(screen.getByRole('heading', { name: /29 de setembro/i })).toBeInTheDocument()
})

test('mentor vê o caderno da aluna, com os horários do banco e os dias em falta (RF-50/52)', () => {
  setup('mentor')
  expect(screen.queryByLabelText('Uma coisa que aprendi')).not.toBeInTheDocument()
  const cards = screen.getAllByRole('listitem')
  expect(cards).toHaveLength(30)
  const day28 = cards[1]
  expect(day28).toHaveTextContent('aprendi a ouvir o cliente')
  expect(day28).toHaveTextContent('Criado 29/09, 19:10')
  expect(day28).toHaveTextContent('atualizado 29/09, 20:02')
  expect(cards[2]).toHaveTextContent('Em falta')
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/journal 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import` do componente ainda inexistente.

- [ ] **Step 3: Implementar**

`src/features/journal/JournalForm.tsx`:
```tsx
import { useState } from 'react'
import { Badge, Card, TextArea } from '@/design/ui'
import { fieldOk, MIN_FIELD, writeWindow } from '@/domain/journal'
import { DAY_STATUS_LABEL, journalDayStatus, type DayStatus } from '@/domain/journalDays'
import { useAutosave } from '@/lib/useAutosave'
import { useSaveJournalEntry } from './hooks'
import type { JournalEntry } from './types'

const TONE: Record<DayStatus, 'brand' | 'success' | 'streak' | 'muted'> = {
  done: 'success', done_late: 'streak', open: 'brand', late_window: 'streak', missing: 'muted', future: 'muted',
}
const longDate = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
const SAVE_TEXT = { idle: '', saving: 'Salvando…', saved: 'Salvo', error: '' } as const

/** Um dia do caderno (RF-50/54): 3 campos de pelo menos 15 caracteres, salvamento automático e marca de atraso. */
export function JournalForm({ date, initial }: { date: string; initial: JournalEntry | undefined }) {
  const [now] = useState(() => new Date())
  const save = useSaveJournalEntry()
  const [fields, setFields] = useState({ learned: initial?.learned ?? '', practiced: initial?.practiced ?? '', tomorrow: initial?.tomorrow ?? '' })
  const closed = writeWindow(date, now) === 'closed'
  const autosave = useAutosave({ value: fields, save: (v) => save.mutateAsync({ date, ...v }), enabled: !closed })

  // O banco decide `complete` e `late`; enquanto nada foi salvo, vale o que já existia.
  const server = save.data ?? initial
  const status = journalDayStatus(date, now, server ? { complete: server.complete, late: server.late } : undefined)
  const set = (k: keyof typeof fields) => (v: string) => setFields((f) => ({ ...f, [k]: v }))
  const shortFields = Object.values(fields).some((v) => !fieldOk(v))

  return (
    <Card className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl leading-tight font-black first-letter:uppercase">{longDate.format(new Date(`${date}T12:00:00Z`))}</h2>
        <Badge tone={TONE[status]}>{DAY_STATUS_LABEL[status]}</Badge>
      </header>

      {closed && <p role="status" className="font-bold text-muted">Este dia está fechado: o prazo era até 12:00 do dia seguinte (horário de São Paulo).</p>}
      {status === 'late_window' && <p role="status" className="text-streak">Você ainda pode preencher este dia até 12:00. Ele vai constar como preenchido com atraso.</p>}

      <TextArea label="Uma coisa que aprendi" value={fields.learned} onChange={set('learned')} minChars={MIN_FIELD} disabled={closed} />
      <TextArea label="Uma coisa que pratiquei" value={fields.practiced} onChange={set('practiced')} minChars={MIN_FIELD} disabled={closed} />
      <TextArea label="Uma coisa para amanhã" value={fields.tomorrow} onChange={set('tomorrow')} minChars={MIN_FIELD} disabled={closed} />

      {!closed && shortFields && <p className="text-sm text-muted">O dia só conta como completo com os 3 campos de pelo menos {MIN_FIELD} caracteres.</p>}
      <p aria-live="polite" className="text-sm text-success">{SAVE_TEXT[autosave.status]}</p>
      {autosave.error && <p role="alert" className="text-danger">{autosave.error}</p>}
    </Card>
  )
}
```

`src/features/journal/MentorJournal.tsx`:
```tsx
import { useState } from 'react'
import { Badge, Card } from '@/design/ui'
import { DAY_STATUS_LABEL, journalDayStatus, lastDays } from '@/domain/journalDays'
import { formatWhen } from '@/features/simulations/format'
import { spDate } from '@/lib/dates'
import type { JournalEntry } from './types'

/** Visão do mentor (RF-50/52): o caderno da aluna, sempre visível, com os horários gravados pelo banco e os dias em falta. */
export function MentorJournal({ entries }: { entries: JournalEntry[] }) {
  const [now] = useState(() => new Date())
  const byDate = new Map(entries.map((e) => [e.date, e]))
  return (
    <ul className="flex flex-col gap-3">
      {lastDays(spDate(now), 30).map((date) => {
        const e = byDate.get(date)
        const status = journalDayStatus(date, now, e ? { complete: e.complete, late: e.late } : undefined)
        return (
          <li key={date}>
            <Card className="flex flex-col gap-2">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold tabular-nums">{date.split('-').reverse().join('/')}</h2>
                <Badge tone={status === 'done' ? 'success' : status === 'missing' ? 'muted' : 'streak'}>{DAY_STATUS_LABEL[status]}</Badge>
              </header>
              {e ? (
                <>
                  <p><span className="font-bold text-muted">Aprendi:</span> {e.learned || '—'}</p>
                  <p><span className="font-bold text-muted">Pratiquei:</span> {e.practiced || '—'}</p>
                  <p><span className="font-bold text-muted">Amanhã:</span> {e.tomorrow || '—'}</p>
                  <p className="text-sm text-muted">Criado {formatWhen(e.createdAt)} · atualizado {formatWhen(e.updatedAt)}</p>
                </>
              ) : (
                status !== 'open' && <p className="text-sm text-muted">Sem entrada neste dia.</p>
              )}
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
```

`src/features/journal/JournalScreen.tsx`:
```tsx
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Badge } from '@/design/ui'
import { DAY_STATUS_LABEL, journalDayStatus, lastDays } from '@/domain/journalDays'
import { useAuth } from '@/features/auth/AuthProvider'
import { spDate } from '@/lib/dates'
import { useJournalEntries } from './hooks'
import { JournalForm } from './JournalForm'
import { MentorJournal } from './MentorJournal'

const ISO = /^\d{4}-\d{2}-\d{2}$/

/** `/caderno` e `/caderno/dia/:date`: a aluna escreve o dia; o mentor lê o caderno dela. */
export function JournalScreen() {
  const { date: param } = useParams()
  const { profile } = useAuth()
  const entries = useJournalEntries()
  const [now] = useState(() => new Date())
  const today = spDate(now)

  if (entries.isLoading) return <p role="status" className="p-2 text-muted">Carregando o caderno…</p>
  if (!entries.data) return <p role="alert" className="p-2 text-danger">Não foi possível carregar o caderno.</p>

  if (profile?.role === 'mentor') return <MentorJournal entries={entries.data} />

  if (param !== undefined && (!ISO.test(param) || param > today)) return <Navigate to="/caderno" replace />
  const date = param ?? today
  const byDate = new Map(entries.data.map((e) => [e.date, e]))

  return (
    <div className="flex flex-col gap-6">
      <JournalForm key={date} date={date} initial={byDate.get(date)} />
      <section aria-labelledby="dias" className="flex flex-col gap-2">
        <h2 id="dias" className="font-display text-2xl font-black">Últimos dias</h2>
        <ul className="flex flex-col gap-1">
          {lastDays(today, 14).map((d) => {
            const e = byDate.get(d)
            const status = journalDayStatus(d, now, e ? { complete: e.complete, late: e.late } : undefined)
            return (
              <li key={d}>
                <Link to={d === today ? '/caderno' : `/caderno/dia/${d}`} aria-current={d === date ? 'date' : undefined}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-control border border-edge bg-surface px-3">
                  <span className="tabular-nums">{d.split('-').reverse().join('/')}</span>
                  <Badge tone={status === 'done' ? 'success' : status === 'open' ? 'brand' : status === 'missing' ? 'muted' : 'streak'}>{DAY_STATUS_LABEL[status]}</Badge>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/journal 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/journal/JournalForm.tsx src/features/journal/MentorJournal.tsx src/features/journal/JournalScreen.tsx src/features/journal/JournalForm.test.tsx src/features/journal/JournalScreen.test.tsx
git commit -m "feat(journal): daily journal form with autosave, deadline states and mentor view"
```

---

### Task 42: NotesScreen e NoteEditor — **[W4]**

**Files:**

- Create: `src/features/notes/NotesScreen.tsx`
- Create: `src/features/notes/NoteEditor.tsx`
- Test: `src/features/notes/NotesScreen.test.tsx`, `src/features/notes/NoteEditor.test.tsx`

**Interfaces:**
- Consumes: `useNotes`, `useNote`, `useSaveNote`, `useDeleteNote` (mockados a partir da Task 33); `useAutosave`, `useDebounced`, `Markdown` (Task 35); `noteLinkFromParams`, `noteLinkLabel`, `noteLinkPath`, `snippet` (Task 33); `formatWhen` de `@/features/simulations/format` (E5); `useAuth`; `Badge`, `Button`, `Card`, `Checkbox`, `TextArea`.
- Produces: `NotesScreen()` (`/caderno/notas`, RF-51/53): lista com busca que só consulta 300 ms depois da última tecla, selo Privada/Compartilhada e vínculo; o mentor vê as compartilhadas como "Compartilhada pela aluna". `NoteEditor()` (`/caderno/notas/nova` e `/caderno/notas/:id`, RF-51/52/54): título, texto em Markdown simples com "Visualizar", "Compartilhar com o mentor" desligado por padrão (o mentor não tem essa opção: as notas dele são só dele), vínculo vindo da rota (`?semana=w05`), salvamento automático com o mesmo id da nota (sem duplicar), apagar com confirmação, nota alheia em somente leitura. A nota nova só é gravada depois da primeira alteração.


- [ ] **Step 1: Testes**

`src/features/notes/NotesScreen.test.tsx`:
```tsx
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { noteOf, queryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('./hooks')

import * as api from './hooks'
import { NotesScreen } from './NotesScreen'

function setup(notes = [noteOf()]) {
  vi.mocked(api.useNotes).mockReturnValue(queryOf(notes))
  return render(<MemoryRouter><NotesScreen /></MemoryRouter>)
}

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ shouldAdvanceTime: true }) })
afterEach(() => vi.useRealTimers())

test('lista notas com selo de privacidade, vínculo e resumo sem marcação', () => {
  setup([noteOf({ link: { type: 'week', id: 'w05' } }), noteOf({ id: 'n2', title: '', body: '', private: false })])
  expect(screen.getByText('Privada')).toBeInTheDocument()
  expect(screen.getByText('Compartilhada')).toBeInTheDocument()
  expect(screen.getByText('Semana 5')).toBeInTheDocument()
  expect(screen.getByText('Começar pelo porquê.')).toBeInTheDocument()
  expect(screen.getByText('Sem título')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Ideias de abertura/ })).toHaveAttribute('href', '/caderno/notas/n1')
})

test('nota da aluna vista pelo mentor vem marcada como compartilhada por ela (RF-52)', () => {
  setup([noteOf({ mine: false, private: false })])
  expect(screen.getByText('Compartilhada pela aluna')).toBeInTheDocument()
})

test('a busca só consulta depois de 300 ms parada (RF-53)', async () => {
  setup()
  expect(api.useNotes).toHaveBeenLastCalledWith('')
  fireEvent.change(screen.getByLabelText('Buscar nas notas'), { target: { value: 'vendas' } })
  expect(api.useNotes).toHaveBeenLastCalledWith('')
  await act(async () => { await vi.advanceTimersByTimeAsync(350) })
  expect(api.useNotes).toHaveBeenLastCalledWith('vendas')
})

test('mensagens de lista vazia e de busca sem resultado; atalho para nova nota', async () => {
  setup([])
  expect(screen.getByText('Nenhuma nota ainda.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Nova nota' })).toHaveAttribute('href', '/caderno/notas/nova')
  fireEvent.change(screen.getByLabelText('Buscar nas notas'), { target: { value: 'xyz' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(350) })
  expect(screen.getByText('Nenhuma nota encontrada.')).toBeInTheDocument()
})
```

`src/features/notes/NoteEditor.test.tsx`:
```tsx
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { asyncMutationOf, noteOf, queryOf } from '@/test/e6Mocks'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks')

import { useAuth } from '@/features/auth/AuthProvider'
import * as api from './hooks'
import { NoteEditor } from './NoteEditor'
import type { Note } from './types'

const saveAsync = vi.fn()
const remove = vi.fn()

function setup(path: string, opts: { role?: 'aluna' | 'mentor'; note?: Note | null } = {}) {
  vi.mocked(useAuth).mockReturnValue({ profile: { id: 'u', role: opts.role ?? 'aluna', name: 'X' } } as never)
  vi.mocked(api.useNote).mockReturnValue(queryOf(opts.note === undefined ? noteOf() : opts.note))
  vi.mocked(api.useSaveNote).mockReturnValue(asyncMutationOf(saveAsync))
  vi.mocked(api.useDeleteNote).mockReturnValue({ ...(asyncMutationOf() as object), mutate: remove } as never)
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/caderno/notas/nova" element={<NoteEditor />} />
        <Route path="/caderno/notas/:id" element={<NoteEditor />} />
        <Route path="/caderno/notas" element={<p>lista de notas</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => { vi.clearAllMocks(); saveAsync.mockResolvedValue(undefined); vi.useFakeTimers({ shouldAdvanceTime: true }) })
afterEach(() => vi.useRealTimers())

test('nota nova nasce privada e só salva depois que a aluna escreve (RF-52/54)', async () => {
  setup('/caderno/notas/nova')
  expect(screen.getByRole('checkbox', { name: 'Compartilhar com o mentor' })).not.toBeChecked()
  await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
  expect(saveAsync).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Ideias' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveAsync).toHaveBeenCalledTimes(1)
  expect(saveAsync.mock.calls[0][0]).toMatchObject({ title: 'Ideias', body: '', private: true, link: null })
  expect(saveAsync.mock.calls[0][0].id).toEqual(expect.any(String))
  expect(screen.getByText('Salvo')).toBeInTheDocument()
})

test('as próximas gravações da mesma nota usam o mesmo id (sem duplicar)', async () => {
  setup('/caderno/notas/nova')
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'A' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'AB' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveAsync).toHaveBeenCalledTimes(2)
  expect(saveAsync.mock.calls[0][0].id).toBe(saveAsync.mock.calls[1][0].id)
})

test('vínculo vem da rota (semana) e é gravado com a nota', async () => {
  setup('/caderno/notas/nova?semana=w05')
  expect(screen.getByRole('link', { name: 'Semana 5' })).toHaveAttribute('href', '/trilha/w05')
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Sobre a semana' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveAsync.mock.calls[0][0].link).toEqual({ type: 'week', id: 'w05' })
})

test('compartilhar com o mentor troca private para false', async () => {
  setup('/caderno/notas/nova')
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('checkbox', { name: 'Compartilhar com o mentor' }))
  await act(async () => { await vi.advanceTimersByTimeAsync(1100) })
  expect(saveAsync.mock.calls[0][0].private).toBe(false)
})

test('abre uma nota existente e a visualização renderiza o Markdown', async () => {
  setup('/caderno/notas/n1')
  expect(screen.getByLabelText('Título')).toHaveValue('Ideias de abertura')
  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name: 'Visualizar' }))
  expect(screen.getByText('porquê').tagName).toBe('STRONG')
})

test('nota do outro (mentor lendo nota compartilhada) é só leitura', () => {
  setup('/caderno/notas/n1', { role: 'mentor', note: noteOf({ mine: false, private: false, title: 'Da aluna' }) })
  expect(screen.getByRole('heading', { name: 'Da aluna' })).toBeInTheDocument()
  expect(screen.queryByLabelText('Título')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Apagar nota' })).not.toBeInTheDocument()
})

test('o mentor não tem a opção de compartilhar: as notas dele são só dele', () => {
  setup('/caderno/notas/nova', { role: 'mentor' })
  expect(screen.queryByRole('checkbox', { name: 'Compartilhar com o mentor' })).not.toBeInTheDocument()
  expect(screen.getByText('Só você vê esta nota.')).toBeInTheDocument()
})

test('apagar pede confirmação e volta para a lista', async () => {
  remove.mockImplementation((_id: string, o: { onSuccess: () => void }) => o.onSuccess())
  setup('/caderno/notas/n1')
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  await user.click(screen.getByRole('button', { name: 'Apagar nota' }))
  expect(remove).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))
  expect(remove).toHaveBeenCalledWith('n1', expect.anything())
  expect(await screen.findByText('lista de notas')).toBeInTheDocument()
})

test('nota inexistente', () => {
  setup('/caderno/notas/sumiu', { note: null })
  expect(screen.getByRole('alert')).toHaveTextContent('Nota não encontrada')
})
```


- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/notes/NotesScreen.test.tsx src/features/notes/NoteEditor.test.tsx 2>&1 | tail -10`
Expected: FAIL — `Failed to resolve import` do componente ainda inexistente.

- [ ] **Step 3: Implementar**

`src/features/notes/NotesScreen.tsx`:
```tsx
import { useState } from 'react'
import { Link } from 'react-router'
import { Badge, Card } from '@/design/ui'
import { noteLinkLabel, snippet } from '@/domain/notes'
import { formatWhen } from '@/features/simulations/format'
import { useDebounced } from '@/lib/useDebounced'
import { useNotes } from './hooks'

/** `/caderno/notas` (RF-51/53): notas com busca. O mentor só vê as que a aluna compartilhou. */
export function NotesScreen() {
  const [search, setSearch] = useState('')
  const term = useDebounced(search, 300)
  const notes = useNotes(term)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1 font-bold">Buscar nas notas
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-12 rounded-control border-2 border-line bg-surface px-3 font-normal focus:border-brand focus:outline-none" />
        </label>
        <Link to="/caderno/notas/nova" className="inline-flex h-12 items-center rounded-control bg-brand px-5 font-bold text-on-brand">Nova nota</Link>
      </div>

      {notes.isLoading && <p role="status" className="text-muted">Carregando as notas…</p>}
      {notes.error && <p role="alert" className="text-danger">Não foi possível carregar as notas.</p>}
      {notes.data?.length === 0 && <p className="text-muted">{term ? 'Nenhuma nota encontrada.' : 'Nenhuma nota ainda.'}</p>}

      <ul className="flex flex-col gap-3">
        {notes.data?.map((n) => (
          <li key={n.id}>
            <Link to={`/caderno/notas/${n.id}`} className="block">
              <Card className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{n.title || 'Sem título'}</h2>
                  {n.mine
                    ? <Badge tone={n.private ? 'muted' : 'success'}>{n.private ? 'Privada' : 'Compartilhada'}</Badge>
                    : <Badge tone="brand">Compartilhada pela aluna</Badge>}
                  {n.link && <Badge tone="streak">{noteLinkLabel(n.link)}</Badge>}
                </div>
                {n.body && <p className="text-sm text-muted">{snippet(n.body)}</p>}
                <p className="text-xs text-muted">Atualizada {formatWhen(n.updatedAt)}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

`src/features/notes/NoteEditor.tsx`:
```tsx
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Badge, Button, Card, Checkbox, TextArea } from '@/design/ui'
import { noteLinkFromParams, noteLinkLabel, noteLinkPath, type NoteLink } from '@/domain/notes'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAutosave } from '@/lib/useAutosave'
import { useDeleteNote, useNote, useSaveNote } from './hooks'
import { Markdown } from './Markdown'
import type { Note } from './types'

const SAVE_TEXT = { idle: '', saving: 'Salvando…', saved: 'Salvo', error: '' } as const

function NoteForm({ id, initial, link }: { id: string; initial: Note | null; link: NoteLink | null }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const save = useSaveNote()
  const remove = useDeleteNote()
  const editable = initial === null || initial.mine
  const [draft, setDraft] = useState({ title: initial?.title ?? '', body: initial?.body ?? '', private: initial?.private ?? true, link: initial?.link ?? link })
  const [preview, setPreview] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const autosave = useAutosave({ value: draft, save: (v) => save.mutateAsync({ id, ...v }), enabled: editable })
  const isMentor = profile?.role === 'mentor'

  return (
    <Card className="flex flex-col gap-4">
      <Link to="/caderno/notas" className="font-bold text-brand underline underline-offset-4">Voltar às notas</Link>
      {!editable && <Badge tone="brand">Compartilhada pela aluna</Badge>}
      {draft.link && (
        <Link to={noteLinkPath(draft.link)} className="w-fit"><Badge tone="streak">{noteLinkLabel(draft.link)}</Badge></Link>
      )}

      {editable ? (
        <>
          <label className="flex flex-col gap-1 font-bold">Título
            <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} maxLength={200}
              className="h-12 rounded-control border-2 border-line bg-surface px-3 font-normal focus:border-brand focus:outline-none" />
          </label>
          {preview
            ? <section aria-label="Pré-visualização"><Markdown source={draft.body} /></section>
            : <TextArea label="Texto (Markdown simples)" value={draft.body} onChange={(body) => setDraft((d) => ({ ...d, body }))} />}
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" onClick={() => setPreview((p) => !p)}>{preview ? 'Editar' : 'Visualizar'}</Button>
            {isMentor
              ? <p className="text-sm text-muted">Só você vê esta nota.</p>
              : <Checkbox checked={!draft.private} label="Compartilhar com o mentor" onChange={(shared) => setDraft((d) => ({ ...d, private: !shared }))} />}
          </div>
          <p aria-live="polite" className="text-sm text-success">{SAVE_TEXT[autosave.status]}</p>
          {autosave.error && <p role="alert" className="text-danger">{autosave.error}</p>}
          {initial && (
            <div className="flex gap-2">
              {confirming
                ? <Button size="sm" variant="danger" loading={remove.isPending} onClick={() => remove.mutate(id, { onSuccess: () => navigate('/caderno/notas') })}>Confirmar exclusão</Button>
                : <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>Apagar nota</Button>}
            </div>
          )}
          {remove.error && <p role="alert" className="text-danger">{remove.error.message}</p>}
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl font-black">{initial?.title || 'Sem título'}</h1>
          <Markdown source={initial?.body ?? ''} />
        </>
      )}
    </Card>
  )
}

/** `/caderno/notas/nova` e `/caderno/notas/:id` (RF-51/52/54): título, Markdown simples, privada por padrão e salvamento automático. */
export function NoteEditor() {
  const { id: param } = useParams()
  const [search] = useSearchParams()
  const [newId] = useState(() => crypto.randomUUID())
  const note = useNote(param)

  if (param !== undefined) {
    if (note.isLoading) return <p role="status" className="text-muted">Carregando a nota…</p>
    if (!note.data) return <p role="alert" className="text-danger">Nota não encontrada.</p>
    return <NoteForm key={param} id={param} initial={note.data} link={null} />
  }
  return <NoteForm id={newId} initial={null} link={noteLinkFromParams(search)} />
}
```


- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/notes/NotesScreen.test.tsx src/features/notes/NoteEditor.test.tsx 2>&1 | tail -8 && npx tsc -b 2>&1 | tail -5`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/notes/NotesScreen.tsx src/features/notes/NoteEditor.tsx src/features/notes/NotesScreen.test.tsx src/features/notes/NoteEditor.test.tsx
git commit -m "feat(notes): notes list with search and editor with autosave and privacy toggle"
```

---

### Task 43: Rotas, aba "Caderno", aviso da tela Hoje e E2E — **[W4]**

**Files:**
- Create: `src/features/journal/CadernoLayout.tsx`, `e2e/journal.spec.ts`
- Modify: `src/features/shell/AppShell.tsx`, `src/features/shell/AppShell.test.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/features/today/TodayScreen.tsx`, `src/features/today/TodayScreen.test.tsx`, `e2e/support.ts`
- Test: `src/features/journal/CadernoLayout.test.tsx`

**Interfaces:**
- Consumes: todas as telas das Tasks 38–42; `yesterdayNotice` (Task 33); migration (Task 34) e hooks (Tasks 36 e 37) já aplicados; helpers do E2E da Parte 3 (`signIn`, `studentEmail`, `mentorEmail`).
- Produces: `CadernoLayout` (moldura com as abas Dia, Notas, Listas e o atalho Biblioteca); rotas `/caderno`, `/caderno/dia/:date`, `/caderno/notas`, `/caderno/notas/nova`, `/caderno/notas/:id`, `/caderno/checklists`, `/biblioteca`, `/biblioteca/:bookId` (esta com `lazy`); aba "Caderno" na `BottomNav`; aviso na tela Hoje quando o caderno de ontem está em falta (RF-50); `resetJournal()` em `e2e/support.ts`.

- [ ] **Step 1: Testes unitários da moldura, das rotas, da aba e do aviso**


`src/features/journal/CadernoLayout.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { CadernoLayout } from './CadernoLayout'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/caderno" element={<CadernoLayout />}>
          <Route index element={<p>tela do dia</p>} />
          <Route path="dia/:date" element={<p>tela de outro dia</p>} />
          <Route path="notas" element={<p>tela de notas</p>} />
          <Route path="notas/:id" element={<p>tela de uma nota</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

test('abas com a atual destacada', () => {
  renderAt('/caderno')
  expect(screen.getByRole('heading', { level: 1, name: 'Caderno' })).toBeInTheDocument()
  expect(screen.getByText('tela do dia')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Dia' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Notas' })).not.toHaveAttribute('aria-current')
  expect(screen.getByRole('link', { name: 'Biblioteca' })).toHaveAttribute('href', '/biblioteca')
})

test('a aba Notas continua ativa dentro de uma nota; Dia não', () => {
  renderAt('/caderno/notas/n1')
  expect(screen.getByText('tela de uma nota')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Notas' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Dia' })).not.toHaveAttribute('aria-current')
})

test('um dia de outra data continua na aba Dia', () => {
  renderAt('/caderno/dia/2026-09-28')
  expect(screen.getByText('tela de outro dia')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Dia' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Notas' })).not.toHaveAttribute('aria-current')
})
```


Em `src/features/shell/AppShell.test.tsx`, acrescentar a rota `<Route path="caderno/notas" element={<h1>Tela notas</h1>} />` ao lado das outras dentro de `renderAt` e o caso:
```tsx
test('aba Caderno continua ativa dentro das notas', () => {
  renderAt('/caderno/notas')
  expect(screen.getByRole('link', { name: 'Caderno' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Simulados' })).not.toHaveAttribute('aria-current')
})
```

Em `src/App.test.tsx`, acrescentar no fim (o mock de `@/lib/supabase` do arquivo já devolve sessão vazia):
```tsx
test('rotas do caderno e da biblioteca exigem login', async () => {
  for (const path of ['/caderno', '/caderno/notas/nova', '/caderno/checklists', '/biblioteca', '/biblioteca/carnegie']) {
    const { unmount } = render(<MemoryRouter initialEntries={[path]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    unmount()
  }
})
```

Em `src/features/today/TodayScreen.test.tsx` (o relógio do arquivo é terça, 12:00 em SP), acrescentar no fim:
```tsx
test('caderno de ontem em falta gera aviso com link para o dia (RF-50)', () => {
  setup({ journal: ['2026-09-27'] })
  expect(screen.getByRole('status')).toHaveTextContent('O caderno de ontem ficou em falta.')
  expect(screen.getByRole('link', { name: 'Ver o dia' })).toHaveAttribute('href', '/caderno/dia/2026-09-28')
})

test('antes do meio-dia o aviso convida a preencher ontem', () => {
  vi.setSystemTime(new Date('2026-09-29T14:59:00Z')) // 11:59 em SP
  setup({ journal: ['2026-09-27'] })
  expect(screen.getByRole('status')).toHaveTextContent('ainda pode ser preenchido até 12:00')
  expect(screen.getByRole('link', { name: 'Preencher agora' })).toBeInTheDocument()
})

test('caderno de ontem completo: sem aviso', () => {
  setup({ journal: ['2026-09-28'] })
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: E2E — apoio e teste**

Em `e2e/support.ts`, acrescentar antes de `signIn`:
```ts
/** Apaga todas as entradas do caderno do banco local. */
export async function resetJournal(): Promise<void> {
  const r = await admin.from('journal_entries').delete().not('id', 'is', null)
  if (r.error) throw r.error
}
```

> **Atenção:** `resetJournal` apaga todo o caderno do banco **local**; `e2e/support.ts` continua se recusando a rodar contra qualquer URL que não seja `localhost`/`127.0.0.1`.


`e2e/journal.spec.ts`:
```ts
import { devices, expect, test, type Browser, type Page } from '@playwright/test'
import { mentorEmail, resetJournal, signIn, studentEmail } from './support'

/** Cada pessoa em um contexto próprio (sessões separadas), no mesmo formato de celular do projeto. */
async function pageFor(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL: 'http://localhost:5173' })
  const page = await context.newPage()
  await signIn(page, email)
  return page
}

test.beforeEach(async () => { await resetJournal() })

test('caderno do dia enviado pela aluna aparece para o mentor, com os horários', async ({ browser }) => {
  const student = await pageFor(browser, await studentEmail())
  await student.getByRole('link', { name: 'Caderno', exact: true }).click()
  await expect(student.getByText('Pendente').first()).toBeVisible() // selo do dia e linha de hoje na lista

  await student.getByLabel('Uma coisa que aprendi').fill('Aprendi a ouvir mais do que falar')
  await student.getByLabel('Uma coisa que pratiquei').fill('Pratiquei o pitch de 30 segundos')
  await student.getByLabel('Uma coisa para amanhã').fill('Ligar para três empresas amanhã')
  await expect(student.getByText('Salvo')).toBeVisible()
  await expect(student.getByText('Completo').first()).toBeVisible() // a marca vem do banco

  await student.reload()
  await expect(student.getByLabel('Uma coisa que aprendi')).toHaveValue('Aprendi a ouvir mais do que falar')

  const mentor = await pageFor(browser, await mentorEmail())
  await mentor.getByRole('link', { name: 'Caderno', exact: true }).click()
  await expect(mentor.getByText('Aprendi a ouvir mais do que falar')).toBeVisible()
  await expect(mentor.getByText(/Criado .* atualizado /).first()).toBeVisible()
  await expect(mentor.getByLabel('Uma coisa que aprendi')).toHaveCount(0) // o mentor lê, não escreve
})
```


- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test 2>&1 | tail -8 && set -a; eval "$(npx supabase status -o env)"; set +a; npx playwright test e2e/journal.spec.ts 2>&1 | tail -12`
Expected: os testes novos do Vitest FAIL (aba, rotas e aviso inexistentes); o E2E FAIL em `getByRole('link', { name: 'Caderno', exact: true })` (a aba ainda não existe).

- [ ] **Step 4: Implementar a moldura, a aba, as rotas e o aviso**


`src/features/journal/CadernoLayout.tsx`:
```tsx
import { Link, Outlet, useLocation } from 'react-router'

const TABS = [
  { to: '/caderno', label: 'Dia', active: (p: string) => p === '/caderno' || p.startsWith('/caderno/dia/') },
  { to: '/caderno/notas', label: 'Notas', active: (p: string) => p.startsWith('/caderno/notas') },
  { to: '/caderno/checklists', label: 'Listas', active: (p: string) => p.startsWith('/caderno/checklists') },
  { to: '/biblioteca', label: 'Biblioteca', active: () => false },
]

/** Moldura das telas do Caderno: título, abas (Dia, Notas, Listas e o atalho para a Biblioteca) e a tela da aba. */
export function CadernoLayout() {
  const { pathname } = useLocation()
  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-6 pb-8">
      <h1 className="font-display text-6xl leading-none font-black text-brand text-glow">Caderno</h1>
      <nav aria-label="Caderno" className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const on = t.active(pathname)
          return (
            <Link key={t.to} to={t.to} aria-current={on ? 'page' : undefined}
              className={`inline-flex h-10 items-center rounded-control border-2 px-3 text-sm font-bold ${on ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-ink'}`}>
              {t.label}
            </Link>
          )
        })}
      </nav>
      <Outlet />
    </main>
  )
}
```


Em `src/features/shell/AppShell.tsx`: acrescentar em `NAV`, depois de Simulados, `{ to: '/caderno', label: 'Caderno', icon: <PixelIcon name="notes" /> }` e remover o comentário `// E6 acrescenta "Caderno".`

Em `src/App.tsx`: acrescentar os imports
```tsx
import { ChecklistsScreen } from './features/checklists/ChecklistsScreen'
import { CadernoLayout } from './features/journal/CadernoLayout'
import { JournalScreen } from './features/journal/JournalScreen'
import { LibraryScreen } from './features/library/LibraryScreen'
import { NoteEditor } from './features/notes/NoteEditor'
import { NotesScreen } from './features/notes/NotesScreen'
```
o carregamento sob demanda do leitor (junto de `UiPreview`; o PDF.js pesa mais de 600 kB):
```tsx
// O leitor de PDF (PDF.js) é pesado: só carrega quando alguém abre um livro.
const BookScreen = lazy(() => import('./features/library/BookScreen').then((m) => ({ default: m.BookScreen })))
```
e, dentro do `<Route element={<RequireAuth><AppShell /></RequireAuth>}>`, antes de `cenarios`:
```tsx
<Route path="caderno" element={<CadernoLayout />}>
  <Route index element={<JournalScreen />} />
  <Route path="dia/:date" element={<JournalScreen />} />
  <Route path="notas" element={<NotesScreen />} />
  <Route path="notas/nova" element={<NoteEditor />} />
  <Route path="notas/:id" element={<NoteEditor />} />
  <Route path="checklists" element={<ChecklistsScreen />} />
</Route>
<Route path="biblioteca" element={<LibraryScreen />} />
<Route path="biblioteca/:bookId" element={<Suspense fallback={<p role="status" className="p-6 text-muted">Carregando…</p>}><BookScreen /></Suspense>} />
```

Em `src/features/today/TodayScreen.tsx`: acrescentar o import `import { yesterdayNotice } from '@/domain/journalDays'`, calcular depois de `const streak = currentStreak(journalDays, today)`:
```tsx
const notice = yesterdayNotice(journalDays, now)
```
e renderizar logo depois de `</header>`:
```tsx
{notice && (
  <p role="status" className="rounded-card border-2 border-streak p-3 font-bold text-streak">
    {notice.kind === 'missing' ? 'O caderno de ontem ficou em falta.' : 'O caderno de ontem ainda pode ser preenchido até 12:00.'}{' '}
    <Link to={`/caderno/dia/${notice.date}`} className="underline underline-offset-4">{notice.kind === 'missing' ? 'Ver o dia' : 'Preencher agora'}</Link>
  </p>
)}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test 2>&1 | tail -8 && set -a; eval "$(npx supabase status -o env)"; set +a; npx playwright test 2>&1 | tail -8`
Expected: Vitest verde; Playwright verde (`journal.spec.ts` mais os E2E da trilha e dos simulados). O E2E do caderno leva ~5 s por causa do salvamento automático.

- [ ] **Step 6: Conferência manual do leitor de PDF (o único trecho que os testes simulam)**

Run: `npm run dev` e, no navegador, com o Supabase local no ar: entre como mentor, abra `/biblioteca/carnegie`, envie um PDF pequeno de 2 páginas ou mais (campo "Enviar o PDF") e confirme que o leitor abre; entre como aluna (outra janela anônima), abra o livro, vá para a página 2 e espere 2 s; recarregue a página.
Expected: a aluna reabre na página 2 ("de N" correto); o mentor vê o mesmo PDF e a página que ele vira não é gravada; trocar o PDF pelo mentor faz a aluna reabrir na página salva (ajustada se o novo for menor). Anote qualquer diferença no PR.

- [ ] **Step 7: Verificação final da etapa**

Run: `npm test 2>&1 | tail -6 && npx supabase test db 2>&1 | tail -5 && npm run build 2>&1 | tail -6 && npm run lint 2>&1 | tail -4`
Expected: tudo verde; o `build` gera um arquivo `pdf.worker.min-*.mjs` e o bundle principal fica abaixo de ~700 kB (o leitor vai num chunk à parte). Avisos antigos do `oxlint` em `AuthProvider` e `TodayScreen` não são desta etapa.

- [ ] **Step 8: Commit**

```bash
git add src/features/journal/CadernoLayout.tsx src/features/journal/CadernoLayout.test.tsx src/features/shell/AppShell.tsx src/features/shell/AppShell.test.tsx src/App.tsx src/App.test.tsx src/features/today/TodayScreen.tsx src/features/today/TodayScreen.test.tsx e2e/journal.spec.ts e2e/support.ts
git commit -m "feat(e6): caderno routes, nav tab, yesterday notice and journal e2e"
```

---

## Cobertura dos RFs da E6

| RF | Onde |
|---|---|
| RF-42 (checklists manuais: título, itens, semana e data opcionais) | Tasks 33 (`validateChecklistDraft`), 36 (hooks), 38 (telas); RLS da Task 5 provada na Task 34 |
| RF-50 (caderno: 3 campos, ≥ 15 caracteres, prazo 12:00, atraso, horários do banco, aviso de ontem) | Task 5 (banco), Tasks 33 (`journalDayStatus`, `yesterdayNotice`), 36, 41 e 43; E2E na Task 43 |
| RF-51 (notas em Markdown simples com vínculo) | Tasks 33 (`markdown`, `noteLinkFromParams`), 35 (`Markdown`), 42 |
| RF-52 (caderno sempre visível ao mentor; notas privadas por padrão, no banco) | Task 5 (RLS) + Task 34 (prova) + Tasks 41 e 42 |
| RF-53 (busca nas notas) | Task 5 (`tsvector`) + Tasks 34 (prova), 36 (`textSearch` em português) e 42 |
| RF-54 (salvamento automático ~1 s com "salvo") | Task 35 + Tasks 41 e 42 |
| RF-60 (12 materiais na ordem, tipo e fase) | Task 4 (seed) + Tasks 37 e 40 |
| RF-61 (só o mentor sobe e remove; até 50 MB) | Task 5 + Task 34 (pasta e tipo) + Tasks 33, 37 e 40 |
| RF-62 (livro sem PDF: aviso e link externo) | Tasks 33 (`normalizeExternalUrl`), 34, 37 e 40 |
| RF-63 (leitor que abre na última página e salva a atual) | Tasks 37 (`useSaveBookProgress`), 39 e 40; conferência manual na Task 43 |
| RF-64 (cursos por link externo) | Task 40 |
| RF-65 (bucket privado, URL assinada de 1 h) | Task 5 (bucket) + Task 37 (`useBookUrl`) |

## Após a Parte 5

Com as Tasks 33–43 verdes, a E6 está concluída. Ficam fora e registrados: E2E do upload e da retomada do PDF (hoje só a conferência manual da Task 43 e os testes com o `react-pdf` simulado); busca por prefixo (a busca `websearch` em português casa palavras inteiras, com radical); revisão das notas por data. Próximo passo: detalhar **E7 — Painéis** (nova "Parte 6"), reaproveitando `journalCompliance` e `currentStreak` (`src/domain/streak.ts`), `officialScore` e o padrão de hooks isolados.
