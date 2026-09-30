import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { LoginScreen } from './features/auth/LoginScreen'
import { RequireAuth } from './features/auth/RequireAuth'
import { AppShell } from './features/shell/AppShell'

/** Cada tela vira um chunk próprio (RNF-05): a primeira carga leva só o shell, o login e as bibliotecas base.
 *  Recharts (painel) e PDF.js (leitor) continuam só nas telas que os usam. */
function lazyScreen<K extends string, M extends Record<K, ComponentType>>(load: () => Promise<M>, name: K) {
  return lazy(() => load().then((m) => ({ default: m[name] })))
}

const TodayScreen = lazyScreen(() => import('./features/today/TodayScreen'), 'TodayScreen')
const TrailMap = lazyScreen(() => import('./features/trail/TrailMap'), 'TrailMap')
const WeekScreen = lazyScreen(() => import('./features/trail/WeekScreen'), 'WeekScreen')
const SimulationsPage = lazyScreen(() => import('./features/simulations/SimulationsPage'), 'SimulationsPage')
const SimulationPage = lazyScreen(() => import('./features/simulations/SimulationPage'), 'SimulationPage')
const ScenarioBankEditor = lazyScreen(() => import('./features/simulations/ScenarioBankEditor'), 'ScenarioBankEditor')
const CadernoLayout = lazyScreen(() => import('./features/journal/CadernoLayout'), 'CadernoLayout')
const JournalScreen = lazyScreen(() => import('./features/journal/JournalScreen'), 'JournalScreen')
const NotesScreen = lazyScreen(() => import('./features/notes/NotesScreen'), 'NotesScreen')
const NoteEditor = lazyScreen(() => import('./features/notes/NoteEditor'), 'NoteEditor')
const ChecklistsScreen = lazyScreen(() => import('./features/checklists/ChecklistsScreen'), 'ChecklistsScreen')
const LibraryScreen = lazyScreen(() => import('./features/library/LibraryScreen'), 'LibraryScreen')
const BookScreen = lazyScreen(() => import('./features/library/BookScreen'), 'BookScreen')
const DashboardScreen = lazyScreen(() => import('./features/dashboard/DashboardScreen'), 'DashboardScreen')
const UiPreview = lazy(() => import('./design/UiPreview'))

const page = (node: ReactNode) => (
  <Suspense fallback={<p role="status" className="p-6 text-muted">Carregando…</p>}>{node}</Suspense>
)

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      {import.meta.env.DEV && <Route path="/ui" element={page(<UiPreview />)} />}
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={page(<TodayScreen />)} />
        <Route path="trilha" element={page(<TrailMap />)} />
        <Route path="trilha/:nodeId" element={page(<WeekScreen />)} />
        <Route path="simulados" element={page(<SimulationsPage />)} />
        <Route path="simulados/:id" element={page(<SimulationPage />)} />
        <Route path="caderno" element={page(<CadernoLayout />)}>
          <Route index element={page(<JournalScreen />)} />
          <Route path="dia/:date" element={page(<JournalScreen />)} />
          <Route path="notas" element={page(<NotesScreen />)} />
          <Route path="notas/nova" element={page(<NoteEditor />)} />
          <Route path="notas/:id" element={page(<NoteEditor />)} />
          <Route path="checklists" element={page(<ChecklistsScreen />)} />
        </Route>
        <Route path="biblioteca" element={page(<LibraryScreen />)} />
        <Route path="biblioteca/:bookId" element={page(<BookScreen />)} />
        <Route path="painel" element={page(<DashboardScreen />)} />
        <Route path="cenarios" element={page(<RequireAuth role="mentor"><ScenarioBankEditor /></RequireAuth>)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
