// Configuration Vite pour l'application algérienne Dalil.dz
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      port: 8080,
      clientPort: 8080
    }
  },
  // Fix for Vite env.mjs Function() CSP issue
  worker: {
    format: 'es'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    global: 'globalThis',
    __WS_TOKEN__: JSON.stringify(''),
    // Fix for Vite env.mjs known issue
    __DEFINES__: '{}'
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Only enable PWA in production to avoid development navigation issues
    ...(mode === 'production' ? [VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Dalil.dz - Plateforme Juridique Algérienne',
        short_name: 'Dalil.dz',
        description: 'Plateforme algérienne de veille juridique et réglementaire avec support RTL',
        theme_color: '#40915d',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        categories: ['legal', 'government', 'reference'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json,woff2}'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20MB limit
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'external-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 604800 }
            }
          }
        ]
      }
    })] : [])
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
    ],
    // Force re-optimisation uniquement si nécessaire
    force: false,
    // Optimiser le cache
    esbuildOptions: {
      target: 'es2020'
    }
  },
  // Configuration cache pour réduire la taille
  cacheDir: 'node_modules/.vite',
  esbuild: {
    target: 'es2020',
  },
  build: {
    target: 'es2020',
    minify: mode === 'production' ? 'esbuild' : false,
    sourcemap: mode === 'development',
    // Fix for env.mjs known issue with Function()
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
}));