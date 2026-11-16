# Stage 02: foundation

## Input
The block from `01-preflight`.

## Process
1. Dependencies: `vue`, `vue-router`, `vue-i18n`, `date-fns` present (`bun add` the missing).
   Nothing else (D3). `vite.config.ts` after `templates/project/vite.config.ts`: `@` to `src`,
   the dev proxy for `/api` (with `ws`) and `/auth` to the Go backend (`BACKEND_URL`).
2. Copy into `src/ui/`: `ui/tokens.css`, `ui/base.css`, `ui/presets/neutral.css` (full mode:
   the preset the direction picks, later), `ui/messages.ts`, `ui/format.ts`, `ui/theme.ts`,
   `ui/agent/` and, when a livewire client exists, `ui/session.ts` and `ui/changelog.ts` (D11,
   D48, D56, D62). Header line on every file.
3. The shell closure through `workbooks/copy-piece/` (stages 01-03, one run): `AppShell`,
   `Page`, `PageHeader`, `Banner`, `Button`, `Icon`, `Menu`, `Popover`, `Toast`, `Dialog`,
   `Field`, `Input`; with a livewire client also `ConnectionBanner`, `ImpersonationBanner`,
   `DevLogin` and the `LoginPage` recipe (its closure brings `LoginForm`), and the product
   pieces the starter shell mounts (D74): `WhatsNew`, `UpdateHint`, `NotificationInbox`,
   `FeedbackCapture`, `CommandPalette`. Each needs its server side, so ask which the backend
   declares and drop the others' blocks from `App.vue` (and `installFeedbackBuffer()` from
   `main.ts` with FeedbackCapture): NotificationInbox `live.notifications`,
   `live.notificationCount`, `calls.markNotificationRead`, `calls.markAllNotificationsRead`;
   FeedbackCapture `calls.createFeedback`; UpdateHint a version endpoint (`/version` answering
   `{ version }`) or a live read; WhatsNew `changelog/<major>.<minor>.md` files; CommandPalette
   nothing (search groups are added per list read).
4. `src/session.ts` after `templates/project/session.ts` (the pair and the redirect providers the
   server mounts), `src/router.ts` after `templates/project/router.ts` (routes with `page`,
   `title`, `intent`, `public` meta, lazy components, the sign-in guard), `src/LoginRoute.vue`
   from `templates/project/LoginRoute.vue` (LoginPage wired, DevLogin in dev builds), the first page
   `src/pages/Home/Home.vue` from `templates/project/Home.vue`; `src/main.ts` after
   `templates/project/main.ts` (tokens, base, preset, messages, the feedback buffer,
   `session.resume()` before the router, `livePlugin(session.pair)`); `src/App.vue` after
   `templates/project/App.vue` (public routes bare, else `AppShell`, banners, the top-bar actions,
   the product pieces, `Toast` once, the dock slot commented); `src/changelog.ts` and
   `changelog/0.1.md` from `templates/project/` (rename the line to the project's version).
   Without a livewire client: drop `session.ts`, the guard, the banners and the product pieces,
   keep the routes.

## Output
```
copied: <n> files from <source> @ <commit>
shell: <pieces>   product pieces kept: <names>, dropped: <names: why>
main.ts, router.ts, session.ts, vite.config.ts: wired (livewire: yes|no)
```

## Completion
Full mode: run `workbooks/design-direction/` now, then proceed to `03-contract` with its
outcome. Quick mode: proceed to `03-contract`.
