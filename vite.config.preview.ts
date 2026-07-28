import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Eigenständiger Single-File-Build, nur für die Artifact-Vorschau (kein PWA/Service-Worker).
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: 'dist-preview',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
})
