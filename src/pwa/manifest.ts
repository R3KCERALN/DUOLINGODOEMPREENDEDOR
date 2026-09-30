import type { ManifestOptions } from 'vite-plugin-pwa'

/** = --color-bg (src/design/tokens.css). O manifesto não lê CSS; o teste amarra os dois. */
export const THEME = '#0D100C'

export const MANIFEST: Partial<ManifestOptions> = {
  name: 'Trilha: de iniciante a empresária e grande vendedora',
  short_name: 'Trilha',
  description: 'Trilha de estudo de comunicação e vendas, com caderno, simulados e painel.',
  lang: 'pt-BR',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: THEME,
  theme_color: THEME,
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}
