---
name: Login and session
tier: pattern
intent: [login, sign in, authentication, session, logout, two-factor, sso, oidc, github login, dev login, impersonation, api keys, redirect after login]
uses: [session, LoginPage, LoginForm, DevLogin, ImpersonationBanner, ApiKeyManager, AppShell]
livewire: false
status: ready
---

# Login and session

Authentication is the one thing outside livewire (D26): govengers/auth's routes set the session
cookie, and the livewire pair follows the identity. `ui/session.ts` is the only code that
changes who the app acts as (D56); `templates/project/session.ts`, `router.ts`, `main.ts` and
`App.vue` wire it.

## Flow

1. Start: `main.ts` calls `session.resume()` (`GET /auth/me`) and installs the router once it
   settled, so the guard's first run knows the identity. `livePlugin(session.pair)`.
2. Guard: a route without `meta.public` and no identity goes to
   `/login?redirect=<fullPath>`.
3. Password: `LoginPage` gets `login` = `session.login` plus
   `router.replace(safeRedirect(redirect))`. A `totp` challenge shows the code step (TOTP or
   backup code); `{ challenge: 'totp_setup' }` is for the app's enrolment screen.
4. OIDC, GitHub: the provider buttons are links to `<prefix>/login?return_to=<path>`
   (`session.loginHref`, sanitised); the callback redirects to the path, the app starts and
   resumes.
5. Development: `DevLogin` in `LoginPage`'s `after` slot, imported only in development builds
   (its card; `templates/project/LoginRoute.vue`).
6. Logout: `session.logout()` (by the provider that made the session: redirect providers leave
   for `<prefix>/logout`, dev login posts `/auth/dev/logout`, else
   `POST /auth/password/logout`), then the `auth.loggedOut` route.
7. Impersonation: an admin's row action calls `session.impersonate(subject)`;
   `ImpersonationBanner` in the shell shows it and stops it.
8. A 401 or a 4401 that leaves nobody: `onSignedOut` loads the login page with the way back.
   Changes without either (another tab, an impersonation auth ended): `session.check()` on tab
   focus and every minute while impersonating.
9. API keys for scripts and agents: `ApiKeyManager` on the settings page, over livewire.

## Rules

- Every identity change ends the pair before the request that changes the cookie and builds
  the next pair from `/auth/me` afterwards, also when the change failed (livewire D66). Only
  the session module does this; pages never touch the cookie routes themselves.
- Redirects after login go through `safeRedirect`: same-origin paths only.
- Never store a token in `localStorage`; the cookie is the session.
- Public routes (login, signed out) render without the app shell; `App.vue` checks
  `meta.public`.
- Show govengers/auth's closed codes as sentences (`LoginForm`); never the server's reason.
- Field names `identifier`, `password`, `code`; the submit is `data-action="login"`.

## Dev proxy

`vite.config.ts` proxies `/api` (with `ws` for the socket) and `/auth` to the backend, keeping
`changeOrigin` off so the socket's Origin equals the Host the backend sees. OIDC and GitHub need
the provider's `ExternalURL` set to the Vite origin in development.
