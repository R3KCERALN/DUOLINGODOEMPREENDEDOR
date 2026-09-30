import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'
import { MANIFEST } from './src/pwa/manifest.ts'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Nunca recarrega sozinho: uma atualização no meio do treino perderia a gravação (UpdatePrompt pergunta).
      registerType: 'prompt',
      // O registro é feito pelo UpdatePrompt (virtual:pwa-register/react); nenhum script inline no HTML (CSP).
      injectRegister: false,
      manifest: MANIFEST,
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon-32.png'],
      workbox: {
        // Shell e todas as telas (chunks da Task 57). O worker do PDF.js (.mjs, 1,2 MB) fica de fora:
        // ler um livro exige internet de qualquer jeito (URL assinada do Storage).
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // Sem runtimeCaching: nada do Supabase (dados privados, sessão) vai para o cache.
      },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rolldownOptions: {
      output: {
        // Vendor em grupos, cada um abaixo de 500 kB. Os de uso geral entram na primeira carga;
        // pdfjs só é baixado com o leitor de livros.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            { name: 'query', test: /node_modules[\\/]@tanstack[\\/]/ },
            { name: 'pdfjs', test: /node_modules[\\/]pdfjs-dist[\\/]build[\\/]/ },
            { name: 'pdfjs-viewer', test: /node_modules[\\/]pdfjs-dist[\\/]web[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
