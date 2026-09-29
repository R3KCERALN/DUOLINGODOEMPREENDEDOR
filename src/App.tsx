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
