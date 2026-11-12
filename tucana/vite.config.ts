import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so it works at https://<user>.github.io/toucanadeck/
export default defineConfig({
  base: './',
  plugins: [react()],
})
