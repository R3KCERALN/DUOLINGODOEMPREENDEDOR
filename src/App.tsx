import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'

const UiPreview = lazy(() => import('./design/UiPreview'))

function LoginPlaceholder() {
  return <h1>Entrar</h1>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPlaceholder />} />
      {import.meta.env.DEV && <Route path="/ui" element={<Suspense><UiPreview /></Suspense>} />}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
