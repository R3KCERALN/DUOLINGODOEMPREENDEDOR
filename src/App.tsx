import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { LoginScreen } from './features/auth/LoginScreen'
import { RequireAuth } from './features/auth/RequireAuth'
import { ChecklistsScreen } from './features/checklists/ChecklistsScreen'
import { CadernoLayout } from './features/journal/CadernoLayout'
import { JournalScreen } from './features/journal/JournalScreen'
import { LibraryScreen } from './features/library/LibraryScreen'
import { NoteEditor } from './features/notes/NoteEditor'
import { NotesScreen } from './features/notes/NotesScreen'
import { AppShell } from './features/shell/AppShell'
import { ScenarioBankEditor } from './features/simulations/ScenarioBankEditor'
import { SimulationPage } from './features/simulations/SimulationPage'
import { SimulationsPage } from './features/simulations/SimulationsPage'
import { TodayScreen } from './features/today/TodayScreen'
import { TrailMap } from './features/trail/TrailMap'
import { WeekScreen } from './features/trail/WeekScreen'

const UiPreview = lazy(() => import('./design/UiPreview'))
// O leitor de PDF (PDF.js) é pesado: só carrega quando alguém abre um livro.
const BookScreen = lazy(() => import('./features/library/BookScreen').then((m) => ({ default: m.BookScreen })))

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      {import.meta.env.DEV && <Route path="/ui" element={<Suspense><UiPreview /></Suspense>} />}
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<TodayScreen />} />
        <Route path="trilha" element={<TrailMap />} />
        <Route path="trilha/:nodeId" element={<WeekScreen />} />
        <Route path="simulados" element={<SimulationsPage />} />
        <Route path="simulados/:id" element={<SimulationPage />} />
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
        <Route path="cenarios" element={<RequireAuth role="mentor"><ScenarioBankEditor /></RequireAuth>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
