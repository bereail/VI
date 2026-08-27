import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En producción, nginx expone la API bajo /vi-api/ y le saca ese prefijo antes de
// reenviar al backend Node. Este proxy de dev replica eso apuntando a producción por
// default. VITE_API_PROXY_TARGET (usado en CI) apunta directo al backend local, que no
// tiene ese prefijo montado — ahí hay que sacarlo acá, como haría nginx.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET
const isLocalApiTarget = Boolean(apiProxyTarget)

export default defineConfig({
  plugins: [react()],
  base: '/vi/',
  server: {
    proxy: {
      '/vi-api': {
        target: apiProxyTarget || 'https://ailonline.com.ar',
        changeOrigin: true,
        secure: true,
        ...(isLocalApiTarget ? { rewrite: (path) => path.replace(/^\/vi-api/, '') } : {}),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
})
