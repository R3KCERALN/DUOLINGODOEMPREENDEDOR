import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from './App'
import { AuthProvider } from './features/auth/AuthProvider'
import { OfflineBanner } from './features/shell/OfflineBanner'
import { UpdatePrompt } from './features/shell/UpdatePrompt'
import './design/tokens.css'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <OfflineBanner />
          <AppRoutes />
          {/* Só no build de produção existe service worker para registrar. */}
          {import.meta.env.PROD && <UpdatePrompt />}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
