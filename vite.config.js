import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Reo-Engine via submodule (sumber TS langsung, tanpa build).
    // Update: git submodule update --remote vendor/reo-engine
    alias: [
      { find: '@reo-engine/core', replacement: path.resolve(__dirname, 'vendor/reo-engine/packages/core/src/index.ts') },
      { find: '@reo-engine/parser-html', replacement: path.resolve(__dirname, 'vendor/reo-engine/packages/parser-html/src/index.ts') },
      { find: '@reo-engine/parser-markdown', replacement: path.resolve(__dirname, 'vendor/reo-engine/packages/parser-markdown/src/index.ts') },
      { find: '@reo-engine/parser-pdf', replacement: path.resolve(__dirname, 'vendor/reo-engine/packages/parser-pdf/src/index.ts') },
      { find: '@reo-engine/layout-engine', replacement: path.resolve(__dirname, 'vendor/reo-engine/packages/layout-engine/src/index.ts') },
      { find: '@reo-engine/style-adaptation', replacement: path.resolve(__dirname, 'vendor/reo-engine/packages/style-adaptation/src/index.ts') },
      { find: '@reo-engine/renderer-web', replacement: path.resolve(__dirname, 'vendor/reo-engine/packages/renderer-web/src/index.ts') },
    ],
  },
})
