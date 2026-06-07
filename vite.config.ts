// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    crx({ manifest }),
  ],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },
  build: {
    rollupOptions: {
      input: {
        app: 'index.html',
        popup: 'popup.html',
      },
      output: {
        assetFileNames: (info) => {
          if (info.name === 'hero.css') return 'assets/hero.css';
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
  },
})