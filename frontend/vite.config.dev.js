import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ==========================================
// 🔧 Config de Desarrollo Local (localhost)
// Comparte backend y DB de producción
// Sin afectar los servicios existentes
// ==========================================
export default defineConfig({
    plugins: [
        react(),
    ],
    define: {
        global: 'window',
    },
    // Cache agresivo para desarrollo rápido
    cacheDir: '.vite-cache',
    optimizeDeps: {
        // Pre-bundle agresivo para carga instantánea
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'axios',
            'recharts',
            'lucide-react',
            'leaflet',
            'react-leaflet',
            '@stomp/stompjs',
            'xlsx',
        ],
        // Forzar cache estable
        force: false,
    },
    server: {
        host: '0.0.0.0',
        port: 3000, // Puerto diferente al 5173 para no chocar
        strictPort: true,
        https: false,
        // HMR configurado para localhost
        hmr: {
            host: 'localhost',
            port: 3000,
        },
        // Proxy directo al backend Docker (sin salir a internet)
        proxy: {
            '/api': {
                target: 'http://localhost:8082',
                changeOrigin: true,
                secure: false,
                // Log de requests para debug
                configure: (proxy) => {
                    proxy.on('error', (err) => {
                        console.log('🔴 Proxy error:', err.message);
                    });
                    proxy.on('proxyReq', (proxyReq, req) => {
                        console.log(`🔵 ${req.method} ${req.url} → backend`);
                    });
                }
            },
            '/ws-notifications': {
                target: 'http://localhost:8082',
                ws: true,
                secure: false,
                changeOrigin: true
            }
        },
        // Watch optimizado - ignora archivos pesados
        watch: {
            ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
            usePolling: false,
        },
    },
    // Build optimizado para desarrollo
    build: {
        sourcemap: true,
        minify: false,
    },
    // NO eliminar console.log en desarrollo
    esbuild: {
        // Mantener console.log para debugging
    },
})
