import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/upload': {
        target: 'http://localhost:3000',
        bypass(req) {
          // Browser navigation sends Accept: text/html → serve the React SPA
          // Axios/fetch API calls send Accept: application/json → proxy to backend
          const accept = req.headers?.['accept'] ?? '';
          if (accept.includes('text/html')) return req.url;
        },
      },
    },
  },
})
