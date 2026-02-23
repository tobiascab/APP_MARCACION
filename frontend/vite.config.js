import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  define: {
    global: 'window',
  },
  build: {
    // No generar source maps en producción (seguridad)
    sourcemap: false,
    // Minificación con esbuild (incluido en Vite)
    minify: 'esbuild',
    // Eliminar console.log y debugger en producción
    esbuild: undefined,
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    https: false,
    proxy: {
      '/api': {
        target: 'https://asistoreducto.arizar-ia.cloud',
        changeOrigin: true,
        secure: false
      },
      '/ws-notifications': {
        target: 'https://asistoreducto.arizar-ia.cloud',
        ws: true,
        secure: false,
        changeOrigin: true
      }
    }
  }
})
