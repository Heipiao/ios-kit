import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: () => {
          return {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['lucide-react', 'clsx', 'tailwind-merge'],
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
