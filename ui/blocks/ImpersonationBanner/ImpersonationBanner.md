---
name: ImpersonationBanner
tier: block
intent: [impersonation, impersonate, act as user, login as user, support mode, admin acting as, stop impersonating, view as]
uses: [Badge, Banner, Button, format, session]
livewire: false
status: ready
laws: [von-restorff-effect, selective-attention]
---

# ImpersonationBanner

The shell's notice while an admin acts as another user through govengers/auth's impersonation
(D59): "You are acting as Bob on behalf of Ada", the time left when the end is known, a Read-only
badge when the app forbids writes, and "Stop acting as Bob". Renders nothing while the identity
has no impersonator. Put it into `AppShell`'s `banners` slot next to `ConnectionBanner`.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `ImpersonationBanner.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Badge`, `Banner`, `Button`, `format` | when their props show up here | what the composed pieces do |
| `ui/session.md` | wiring `identity`, `stop`, starting one | where they come from |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `ImpersonationBanner.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `identity` | `SessionIdentity \| null` | required | `session.identity.value`; `impersonator` set means impersonating |
| `stop` | `() => Promise<void>` | required | `session.stopImpersonating`; its error's message shows in the banner |
| `endsAt` | `string \| Date \| undefined` | `identity.impersonationEndsAt` | overrides `/auth/me`'s end; no countdown when neither is known |
| `readOnly` | `boolean` | `false` | the app's own rule (e.g. `authorization.Real(...)` refusing writes) |

## Events

| Event | When |
|-------|------|
| `expired` | once the end passed: call `session.resume()`; the server already ended it |

## Starting and stopping

`session.impersonate(subject)` (`POST /auth/impersonation`) and `session.stopImpersonating()`
(`DELETE`) are identity changes like a login: the pair ends first, the next pair serves who
`/auth/me` answers. Start it from the app's user list (a row action `data-action="impersonate"`,
admins only); govengers/auth refuses admins as targets, self, nested impersonation and inactive
users with closed codes (`already_impersonating`, `self_impersonation`, ...).

## Agent

Stop is `data-action="stopImpersonation"`. Never bound: drive mode pauses on it (D52).

## Gotchas

- The end comes from `/auth/me`: govengers/auth's `IdentityHandler` answers
  `impersonationEndsAt` (RFC 3339 UTC) while the identity impersonates (auth D70). Against an
  older auth, or an app's own handler without it, pass `endsAt` (the start time plus the
  configured `MaximumDuration`) or live without the countdown.
- The countdown runs on the browser's clock. A clock ahead of the server's emits `expired` early:
  `session.resume()` then still reads the impersonation and the banner says it ended until the
  server ends it (the session's minute poll, or the next request).
- The countdown ticks every second inside an `aria-live="off"` span; the end is announced once.
- Warning, not danger: acting as someone is deliberate, not a failure (the pattern's earlier
  "danger" is replaced, D59).
