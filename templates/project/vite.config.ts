// Vite for a govengers app (ui-start step 2). Goes to vite.config.ts at the frontend root.
// `@` is src (D5). The dev server proxies the Go backend so the browser sees one origin: the
// session cookie, the auth redirects and the livewire socket's Origin check all work as in
// production. Keep changeOrigin off: the backend then sees Host = the Vite origin, which the
// socket's same-origin check compares Origin with.
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const backend = process.env['BACKEND_URL'] ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    proxy: {
      // REST and the livewire socket (/api/v1/socket): ws upgrades the socket.
      '/api': { target: backend, ws: true },
      // govengers/auth: password, TOTP, OIDC and GitHub redirects, dev login, impersonation, /auth/me.
      // OIDC and GitHub: set the provider's ExternalURL to this dev server's origin so the callback comes back here.
      '/auth': { target: backend },
    },
  },
})
