import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// The demonstrator (D14). `@` is demo/src so blocks resolve `@/api/*` here exactly as in a target.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: process.env['DEMO_BASE'] ?? '/',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
  build: { outDir: 'dist', emptyOutDir: true },
})
