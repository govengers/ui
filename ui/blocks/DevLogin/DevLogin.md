---
name: DevLogin
tier: block
intent: [dev login, development login, one click login, log in as user, switch test user, local login, seed users]
uses: [Avatar, Badge, Banner, Button, Card, Skeleton, session]
livewire: false
status: ready
laws: [fittss-law, doherty-threshold]
---

# DevLogin

The development users of govengers/auth's dev login provider (`GET /auth/dev/users`), one click
each signs in (`POST /auth/dev/login`) (D58). A hint line says it is for development. It
renders nothing when the server lists no users (no dev login: the session module answers `[]`
for the 404). Put it under `LoginForm` on the login page, behind the production guard below.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `DevLogin.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Avatar`, `Badge`, `Banner`, `Button`, `Card`, `Skeleton` | when their props show up here | what the composed pieces do |
| `ui/session.md` | wiring `users` and `login` | where both come from |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `DevLogin.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `users` | `() => Promise<DevUser[]>` | required | `session.devUsers`; `DevUser` is `{ id, name, email?, roles? }` from `ui/session.ts` |
| `login` | `(id: string) => Promise<void>` | required | `session.devLogin(id)` then the navigation; its error's message shows |

## Keeping it out of production

Two guards, both needed:

1. Server: govengers/auth's dev login provider refuses to start unless it is enabled
   explicitly; when it is off, `/auth/dev/*` does not exist and this block renders nothing.
2. Bundle: import the block only in development builds, so Vite drops the module and its chunk
   from a production build (`import.meta.env.DEV` is the constant `false` there):

```ts
// LoginPage route props or the page: the chunk exists only in `vite` (dev) builds.
const DevLogin = import.meta.env.DEV ? defineAsyncComponent(() => import('@/ui/blocks/DevLogin/DevLogin.vue')) : undefined
```

```vue
<component :is="DevLogin" v-if="DevLogin" :users="session.devUsers" :login="devLogin" />
```

A shared development deployment built with `vite build` sets `VITE_DEV_LOGIN=true` and guards
with `import.meta.env.DEV || import.meta.env.VITE_DEV_LOGIN === 'true'`; production builds never
set it. Check after `vite build`: `grep -rl ui-dev-login dist/` finds nothing (the `ui.devLogin`
message keys stay in the bundle; they are only text).

## Agent

Each user is a button `data-action="devLogin"` with `data-user="<id>"`, named "Sign in as <name>".
Like `login`, it is never bound: drive mode pauses on it (D52).

## Gotchas

- The list loads once on mount; a failed load shows a Banner with Retry.
- While one login runs, every button is disabled; the clicked one is `aria-busy`.
- The response shape of `GET /auth/dev/users` is an array of `DevUser`; a server that answers
  another shape is mapped in the session module, not here.
