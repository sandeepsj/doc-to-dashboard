import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Absolute base so dynamic imports (Mermaid lazy chunks) always resolve
  // correctly on GitHub Pages, regardless of browser cache state.
  base: '/doc-to-dashboard/',
})
