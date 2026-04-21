import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tailwind runs as a Vite plugin (v4) so styles stay fast in dev and prod builds.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
