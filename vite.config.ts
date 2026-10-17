import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Für den Capacitor-/lokalen Build liegt die App im Domain-Root ('/'), für den
// GitHub-Pages-Build (eigenes Repo-Subpath) setzt die Deploy-Workflow VITE_BASE_PATH,
// z. B. '/KinetiQ/'. Alle Asset-/Router-Pfade richten sich danach.
const base = process.env.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  define: {
    __STANDALONE_FILE__: 'false',
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'KinetiQ',
        short_name: 'KinetiQ',
        description: 'Individuelle Trainingspläne & Fortschritts-Tracking',
        theme_color: '#fafaf8',
        background_color: '#fafaf8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
