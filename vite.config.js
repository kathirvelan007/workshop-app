import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/workshop-app/',

  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Workshop Manager',
        short_name: 'Workshop',
        description: 'Vehicle repair management application',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/workshop-app/',

        icons: [
          {
            src: '/workshop-app/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/workshop-app/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})