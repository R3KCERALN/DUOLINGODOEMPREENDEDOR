import { defineConfig, devices } from '@playwright/test'

const DEV_URL = 'http://localhost:5173'
const PREVIEW_URL = 'http://localhost:4273'
// E2E_PREVIEW=1: só as specs *.preview.spec.ts, contra o build de produção (service worker, manifesto, CSP).
const preview = process.env.E2E_PREVIEW === '1'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  // As specs usam as mesmas duas contas (magic link novo invalida o anterior) e apagam tabelas inteiras: rodam uma por vez.
  workers: 1,
  use: { trace: 'retain-on-failure' },
  projects: preview
    ? [{ name: 'preview', testMatch: /\.preview\.spec\.ts$/, use: { ...devices['Pixel 7'], baseURL: PREVIEW_URL } }]
    : [{ name: 'mobile', testIgnore: /\.preview\.spec\.ts$/, use: { ...devices['Pixel 7'], baseURL: DEV_URL } }],
  webServer: preview
    // reuseExistingServer: false — um preview antigo testaria um build velho
    ? { command: 'npm run build && npx vite preview --port 4273 --strictPort', url: PREVIEW_URL, reuseExistingServer: false, timeout: 240_000 }
    : { command: 'npm run dev', url: DEV_URL, reuseExistingServer: true },
})
