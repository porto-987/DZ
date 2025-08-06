// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
import { VitePWA } from "file:///home/project/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode }) => ({
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
    format: "es"
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
    global: "globalThis",
    __WS_TOKEN__: JSON.stringify(""),
    // Fix for Vite env.mjs known issue - use proper object
    __DEFINES__: JSON.stringify({})
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Only enable PWA in production to avoid development navigation issues
    ...mode === "production" ? [VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Dalil.dz - Plateforme Juridique Alg\xE9rienne",
        short_name: "Dalil.dz",
        description: "Plateforme alg\xE9rienne de veille juridique et r\xE9glementaire avec support RTL",
        theme_color: "#40915d",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "fr",
        categories: ["legal", "government", "reference"],
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json,woff2}"],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        // 20MB limit
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "external-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 604800 }
            }
          }
        ]
      }
    })] : []
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react"
    ],
    // Force re-optimisation pour éviter les identifiants corrompus
    force: true,
    // Optimiser le cache
    esbuildOptions: {
      target: "es2020",
      // Fix for unexpected identifier errors
      keepNames: true,
      minifyIdentifiers: false
    }
  },
  // Configuration cache pour réduire la taille
  cacheDir: "node_modules/.vite",
  esbuild: {
    target: "es2020"
  },
  build: {
    target: "es2020",
    minify: mode === "production" ? "terser" : false,
    sourcemap: mode === "development",
    // Fix for env.mjs known issue with Function()
    rollupOptions: {
      output: {
        manualChunks: void 0,
        // Fix for unexpected identifier errors
        format: "es",
        entryFileNames: "[name]-[hash].js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: "[name]-[hash].[ext]"
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjsvLyBDb25maWd1cmF0aW9uIFZpdGUgcG91ciBsJ2FwcGxpY2F0aW9uIGFsZ1x1MDBFOXJpZW5uZSBEYWxpbC5kelxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogXCI6OlwiLFxuICAgIHBvcnQ6IDgwODAsXG4gICAgaG1yOiB7XG4gICAgICBwb3J0OiA4MDgwLFxuICAgICAgY2xpZW50UG9ydDogODA4MFxuICAgIH1cbiAgfSxcbiAgLy8gRml4IGZvciBWaXRlIGVudi5tanMgRnVuY3Rpb24oKSBDU1AgaXNzdWVcbiAgd29ya2VyOiB7XG4gICAgZm9ybWF0OiAnZXMnXG4gIH0sXG4gIGRlZmluZToge1xuICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgIF9fV1NfVE9LRU5fXzogSlNPTi5zdHJpbmdpZnkoJycpLFxuICAgIC8vIEZpeCBmb3IgVml0ZSBlbnYubWpzIGtub3duIGlzc3VlIC0gdXNlIHByb3BlciBvYmplY3RcbiAgICBfX0RFRklORVNfXzogSlNPTi5zdHJpbmdpZnkoe30pXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gICAgLy8gT25seSBlbmFibGUgUFdBIGluIHByb2R1Y3Rpb24gdG8gYXZvaWQgZGV2ZWxvcG1lbnQgbmF2aWdhdGlvbiBpc3N1ZXNcbiAgICAuLi4obW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8gW1ZpdGVQV0Eoe1xuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiAnRGFsaWwuZHogLSBQbGF0ZWZvcm1lIEp1cmlkaXF1ZSBBbGdcdTAwRTlyaWVubmUnLFxuICAgICAgICBzaG9ydF9uYW1lOiAnRGFsaWwuZHonLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1BsYXRlZm9ybWUgYWxnXHUwMEU5cmllbm5lIGRlIHZlaWxsZSBqdXJpZGlxdWUgZXQgclx1MDBFOWdsZW1lbnRhaXJlIGF2ZWMgc3VwcG9ydCBSVEwnLFxuICAgICAgICB0aGVtZV9jb2xvcjogJyM0MDkxNWQnLFxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI2ZmZmZmZicsXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdCcsXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxuICAgICAgICBzY29wZTogJy8nLFxuICAgICAgICBsYW5nOiAnZnInLFxuICAgICAgICBjYXRlZ29yaWVzOiBbJ2xlZ2FsJywgJ2dvdmVybm1lbnQnLCAncmVmZXJlbmNlJ10sXG4gICAgICAgIGljb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2ljb24tMTkyLnBuZycsXG4gICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2ljb24tNTEyLnBuZycsXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJ1xuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLHBuZyxzdmcsaWNvLGpzb24sd29mZjJ9J10sXG4gICAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiAyMCAqIDEwMjQgKiAxMDI0LCAvLyAyME1CIGxpbWl0XG4gICAgICAgIHNraXBXYWl0aW5nOiB0cnVlLFxuICAgICAgICBjbGllbnRzQ2xhaW06IHRydWUsXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC8vLFxuICAgICAgICAgICAgaGFuZGxlcjogJ05ldHdvcmtGaXJzdCcsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2V4dGVybmFsLWNhY2hlJyxcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjogeyBtYXhFbnRyaWVzOiA1MCwgbWF4QWdlU2Vjb25kczogODY0MDAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXJsUGF0dGVybjogL1xcLihwbmd8anBnfGpwZWd8c3ZnfGdpZikkLyxcbiAgICAgICAgICAgIGhhbmRsZXI6ICdDYWNoZUZpcnN0JyxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnaW1hZ2VzLWNhY2hlJyxcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjogeyBtYXhFbnRyaWVzOiAxMDAsIG1heEFnZVNlY29uZHM6IDYwNDgwMCB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfSldIDogW10pXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdyZWFjdCcsXG4gICAgICAncmVhY3QtZG9tJyxcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICdsdWNpZGUtcmVhY3QnLFxuICAgIF0sXG4gICAgLy8gRm9yY2UgcmUtb3B0aW1pc2F0aW9uIHBvdXIgXHUwMEU5dml0ZXIgbGVzIGlkZW50aWZpYW50cyBjb3Jyb21wdXNcbiAgICBmb3JjZTogdHJ1ZSxcbiAgICAvLyBPcHRpbWlzZXIgbGUgY2FjaGVcbiAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgICAgIC8vIEZpeCBmb3IgdW5leHBlY3RlZCBpZGVudGlmaWVyIGVycm9yc1xuICAgICAga2VlcE5hbWVzOiB0cnVlLFxuICAgICAgbWluaWZ5SWRlbnRpZmllcnM6IGZhbHNlXG4gICAgfVxuICB9LFxuICAvLyBDb25maWd1cmF0aW9uIGNhY2hlIHBvdXIgclx1MDBFOWR1aXJlIGxhIHRhaWxsZVxuICBjYWNoZURpcjogJ25vZGVfbW9kdWxlcy8udml0ZScsXG4gIGVzYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICB9LFxuICBidWlsZDoge1xuICAgIHRhcmdldDogJ2VzMjAyMCcsXG4gICAgbWluaWZ5OiBtb2RlID09PSAncHJvZHVjdGlvbicgPyAndGVyc2VyJyA6IGZhbHNlLFxuICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gJ2RldmVsb3BtZW50JyxcbiAgICAvLyBGaXggZm9yIGVudi5tanMga25vd24gaXNzdWUgd2l0aCBGdW5jdGlvbigpXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczogdW5kZWZpbmVkLFxuICAgICAgICAvLyBGaXggZm9yIHVuZXhwZWN0ZWQgaWRlbnRpZmllciBlcnJvcnNcbiAgICAgICAgZm9ybWF0OiAnZXMnLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ1tuYW1lXS1baGFzaF0uW2V4dF0nXG4gICAgICB9XG4gICAgfVxuICB9XG59KSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxlQUFlO0FBTHhCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNOLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTix3QkFBd0IsS0FBSyxVQUFVLElBQUk7QUFBQSxJQUMzQyxRQUFRO0FBQUEsSUFDUixjQUFjLEtB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
