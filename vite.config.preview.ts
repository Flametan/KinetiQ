import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Eigenständiger Single-File-Build (Artifact-Vorschau / lokales Testen per Doppelklick,
// kein PWA/Service-Worker). __STANDALONE_FILE__ steuert in App.tsx, ob HashRouter statt
// BrowserRouter verwendet wird – über file:// wirft die History-API bei BrowserRouter
// sonst einen SecurityError (unterschiedlicher Origin-Handling für lokale Dateien).
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  define: {
    __STANDALONE_FILE__: 'true',
  },
  build: {
    outDir: 'dist-preview',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
})
