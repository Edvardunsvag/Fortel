import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore - path is a Node.js built-in
import path from 'path'
// @ts-ignore - url is a Node.js built-in
import { fileURLToPath } from 'url'

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

