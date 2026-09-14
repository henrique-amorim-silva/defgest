import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons.svg'],
      manifest: {
        name: 'DefGest - Controle Agronômico',
        short_name: 'DefGest',
        description: 'Sistema de Controle de Estoque e Receituário Agronômico',
        theme_color: '#059669',
        background_color: 'transparent', // Mantém o fundo transparente
        display: 'standalone',
        scope: '/defgest/',
        start_url: '/defgest/',
        icons: [
          {
            src: 'icons.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api-agrofit': {
        target: 'https://api.cnptia.embrapa.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-agrofit/, ''),
      },
    },
  },
  base: "/defgest/",
})