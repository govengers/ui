---
date: 16.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 3 h
groomed: no
---

## Task
Session module, LoginForm against govengers/auth, DevLogin, ImpersonationBanner, ApiKeyManager,
and the start-project fixes (router, vite proxy, app-map, ui-screens) (D56-D61).

## What went wrong on first try
- `bun scripts/screenshots.ts --only=LoginForm` -> Playwright 1.64 wants chromium_headless_shell-1248, the cache had 1255 and no system Chrome -> `bunx playwright install chromium` fixed it.
- DevLogin hint as a `Badge` -> the badge does not wrap and overflowed the card -> a muted `<p>`.
- `Skeleton` inside a grid with `justify-items: start` -> zero width, invisible -> no `justify-items`.
- `font-family: var(--ui-font-mono)` in a block -> UL-003 -> `<code>` gets the mono font from `base.css`.

## Instructions that were wrong or missing
- `templates/project/main.ts` imported `./router`, which no template provided; `justfile` called a missing `scripts/ui-screens.ts`; no stage copied `app-map.ts` (fixed now: yes, D61).
- `patterns/login-and-session.md` described an `email` field, a remember-me box and `/auth/sso/start`, none of which govengers/auth has (fixed now: yes).
- `templates/project/main.ts` built the pair inline; a router installed before the session resumed runs its first guard without an identity (fixed now: yes, resume first).

## Questions I had to ask the human
- none (the auth dev login response shape is assumed and recorded in D58).

## Pieces that did not fit
- PageHeader: the prop is `subtitle`, not `description`; vue-tsc did not catch `:description` (fallthrough attr).
- LoginPage: requires `change` even when the app has no change-password route; the template passes a function that throws.

## Gate friction
- Templates were never type-checked, which is how they rotted; `scripts/template-check.ts` now scaffolds and checks them (2 s).

## Time sinks
- Verifying the dev proxy end to end: a fake auth backend plus Vite plus Playwright (Origin equals Host through the proxy, socket upgrades).

## Suggested improvements (for grooming)
- card: LoginPage `change` optional, hiding the change-password state when absent.
- script: ui-lint could flag unknown props on house components (the `:description` slip).
- fake engine: an empty-list and an error variant per resource so demos can show those states without a second target.
