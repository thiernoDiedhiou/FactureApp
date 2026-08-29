import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      // Utilise le manifest.json existant dans /public
      manifest: false,
      workbox: {
        // Précache tous les assets statiques de l'app shell
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // S'assure que les chunks dans assets/ sont bien inclus
        globDirectory: 'dist',
        // Cache les routes API : NetworkFirst (réseau prioritaire, cache en fallback)
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cfacture-api-v1',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 // 1 heure
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          // Cache les uploads (logos, images)
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/uploads/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cfacture-uploads-v1',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 jours
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
