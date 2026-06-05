import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' gives explicit control over SW registration timing.
      // 'autoUpdate' can silently fail on some Android builds of Vite 5.
      registerType: 'prompt',

      // injectRegister: 'auto' lets vite-plugin-pwa inject the registration
      // script automatically into index.html — required for offline to work.
      injectRegister: 'auto',

      // Include all static assets in the precache manifest
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],

      manifest: {
        name: 'Brasfoot Manager',
        short_name: 'Brasfoot',
        description: 'Manager de futebol brasileiro — offline-first',
        theme_color: '#0a0f1e',
        background_color: '#0a0f1e',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        // lang is required by some Android installability checks
        lang: 'pt-BR',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            // Maskable icon is required for Android adaptive icons
            src: '/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        // Precache all JS/CSS/HTML/assets — this is what makes the app open offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],

        // Skip waiting forces the new SW to activate immediately
        // Without this, Android can keep an old SW that doesn't have all assets cached
        skipWaiting: true,
        clientsClaim: true,

        // NavigateFallback handles SPA routing offline
        // Without this, refreshing any non-root URL returns a 404 offline
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],

        runtimeCaching: [
          // Google Fonts — cache-first, 1 year
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-css',
              expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-assets',
              expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      // devOptions — disable SW in dev to avoid cache confusion during development
      devOptions: {
        enabled: false,
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
