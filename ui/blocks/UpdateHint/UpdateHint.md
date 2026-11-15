---
name: UpdateHint
tier: block
intent: [update available, new version deployed, reload to update, stale bundle, refresh the app, version check]
uses: [Banner, Button]
livewire: true
status: ready
laws: [doherty-threshold, selective-attention]
---

# UpdateHint

Tells the user that a newer build was deployed and offers a reload (D57). It compares the
bundle's version with the server's: a value pushed over livewire (`latest`), or a `check` it runs
every `interval`, when the tab becomes visible and when the socket reconnects (a deploy restarts
the server, so every client reconnects), at most once a minute. An info banner with Reload; a
dismissed hint stays away until the server reports yet another version. Never reloads by itself.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `UpdateHint.vue`, `updateHint.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Banner`, `Button` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the connection prop |

Do not load:

| Skip | Why |
|------|-----|
| `UpdateHint.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `version` | `string` | required | the bundle's version, `import.meta.env.VITE_APP_VERSION` |
| `latest` | `string \| null \| undefined` | none | the server's version as a live read pushes it |
| `check` | `() => Promise<string \| null \| undefined>` | none | asks the server; a failure is ignored until the next trigger |
| `interval` | `number` (ms) | `900000` (15 min) | how often `check` runs while the tab is visible |
| `reload` | `() => void` | `location.reload()` | |
| `connection` | `MaybeRefOrGetter<LiveConnection>` | the provided pair's | whose reconnects trigger `check` |
| `force` | `string \| undefined` | none | shows the hint as if the server ran this version; docs and previews only |

`updateHint.ts`: `outdated(bundle, server)` (a known version other than the bundle's, a rollback
included; `''`, `dev`, `development`, `local` never count) and `createVersionCheck(check, gap,
now?)` (one call in flight, at most one start per gap, failures answer `undefined`).

## Events

None; Reload calls `reload`.

## With livewire

Pushed: the server puts its version on a live object every client reads anyway, so a deploy's
reconnect snapshot carries it.

```vue
<UpdateHint :version="version" :latest="me.data.value?.serverVersion" />
```

Polled: a version endpoint outside livewire (`/version`, a health route that names the build) or a
non-live read.

```ts
const check = async () => (await fetch('/version', { cache: 'no-store' }).then((response) => response.json())).version
```
```vue
<UpdateHint :version="version" :check="check" />
```

Put it in `AppShell`'s banner slot, next to `ConnectionBanner`.

## Agent

The banner is `role="status"`; Reload carries `data-action="reload"`. A drive plan ignores it.

## Messages

`ui.updateAvailable`, `ui.reload`, `ui.close` (through Banner).

## Gotchas

- Serve `index.html` with `Cache-Control: no-cache` and only hashed assets as immutable, or the
  reload brings the old bundle back and the hint returns.
- A lazy route chunk of the old build may be gone after a deploy: reload on Vite's
  `vite:preloadError` event in `main.ts` as well; this block only covers the quiet case.
- It needs the live plugin (or `connection`) for the reconnect trigger, like `ConnectionBanner`.
