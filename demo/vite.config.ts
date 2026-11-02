import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'

/** GitHub Pages serves 404.html for unknown paths: a copy of index.html lets the router render deep links. */
const spaFallback: Plugin = {
  name: 'spa-fallback',
  closeBundle() {
    const dist = fileURLToPath(new URL('./dist/', import.meta.url))
    copyFileSync(dist + 'index.html', dist + '404.html')
  },
}

// The demonstrator (D14). `@` is demo/src so blocks resolve `@/api/*` here exactly as in a target.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: process.env['DEMO_BASE'] ?? '/',
  plugins: [vue(), spaFallback],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
  build: { outDir: 'dist', emptyOutDir: true },
})
