import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    // Three.js is intentionally large (~940 kB) and already isolated in its own chunk.
    // It only loads for users who visit the Landing Page — never impacts dashboard load time.
    chunkSizeWarningLimit: 1000,

    // Split CSS per chunk so each lazy route only loads the CSS it needs
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Three.js ecosystem (large, landing page only)
            if (id.includes('three') || id.includes('@react-three') || id.includes('ogl')) {
              return 'vendor-three';
            }
            // Chart libraries
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // UI component libraries
            if (id.includes('lucide-react') || id.includes('radix-ui') || id.includes('sonner')) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },
})