// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import tailwindcss from '@tailwindcss/vite'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

// Auto-genera iconos PNG desde el SVG fuente
const svgPath = path.resolve('./src/assets/wow-logo.svg')
if (fs.existsSync(svgPath)) {
  const svgBuffer = fs.readFileSync(svgPath)
  const outDir = './public/icons'
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  for (const size of [16, 48, 128]) {
    sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 30, g: 41, b: 59, alpha: 1 } })
      .png()
      .toFile(`${outDir}/wow-logo-${size}.png`)
  }
}

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