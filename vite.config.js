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
        name: 'Raja Two Wheeler Garage - Since 1985',
        short_name: 'Raja Garage',
        description: 'Two Wheeler Service, Modified & Lath Works since 1985',
        theme_color: '#dc2626',
        background_color: '#0c0d14',
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