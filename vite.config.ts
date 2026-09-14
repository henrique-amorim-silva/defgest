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
      includeAssets: ['favicon.ico', 'images/pwa-icon.png'],
      manifest: {
        name: 'DefGest - Controle Agronômico',
        short_name: 'DefGest',
        description: 'Sistema de Controle de Estoque e Receituário Agronômico',
        theme_color: '#059669',
        background_color: '#059669', // Cor de fundo do splash screen combinando com o tema
        display: 'standalone',
        scope: '/defgest/',
        start_url: '/defgest/',
        icons: [
          {
            src: 'images/pwa-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any' // Evita que o Android aplique zoom e corte as bordas
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