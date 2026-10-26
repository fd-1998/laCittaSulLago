import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://fil-homeserver.tail827120.ts.net',
        changeOrigin: true,
      },
      '/health': {
        target: 'https://fil-homeserver.tail827120.ts.net',
        changeOrigin: true,
      },
    },
  },
})
