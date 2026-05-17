import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Desabilita service worker em dev para evitar conflitos com proxy
      devOptions: { enabled: false },
      manifest: {
        name: 'Pix GO — Caça Pix Real',
        short_name: 'Pix GO',
        description: 'Ande pela cidade, aponte a câmera e capture moedas Pix em realidade aumentada!',
        theme_color: '#0a0a14',
        background_color: '#0a0a14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        categories: ['games', 'finance', 'entertainment'],
        icons: [
          { src: '/favicon-32.png',       sizes: '32x32',   type: 'image/png' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
          { src: '/icon-192.png',         sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png',         sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Não propaga erros de conexão como crash do Vite
        configure: (proxy) => {
          proxy.on('error', () => {});
        },
      },
    },
  },
});
