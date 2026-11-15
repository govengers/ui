---
name: Dashboard
tier: page
intent: [dashboard, home page, start page, overview, kpi tiles, metrics, recent activity, landing page after login]
uses: [Page, PageHeader, Badge, Banner, Button, Card, EmptyState, Skeleton, Table, StatusTile, JobProgress, format]
livewire: true
status: ready
laws: [millers-law, pareto-principle]
---

# Dashboard

The start page after login: a greeting with today's date, four live tiles (active customers,
open orders, running jobs, revenue of the last 30 days), the five newest orders, the running
jobs and a billing card that shows the forbidden state. Everything is live; a push moves a tile
without a reload. The release notes (`WhatsNew`) belong to the shell, not to this page (D56).

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Dashboard.vue`, `actions.ts`, `messages.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Page`, `PageHeader`, `Badge`, `Banner`, `Button`, `Card`, `EmptyState`, `Skeleton`, `Table`, `StatusTile`, `JobProgress`, `format` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| the cards of its blocks, `patterns/` guide named below, the laws in `laws` | when composing | shape, reasons, review questions |

Do not load:

| Skip | Why |
|------|-----|
| `Dashboard.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## What it reads

| Piece | Read | Notes |
|-------|------|-------|
| Active customers tile | `useLiveList(live.customers, { filter: status eq active, limit: 1 })` | the `total`; links to `/customers` |
| Open orders tile | `useLiveList(live.orders, { filter: status eq open, limit: 1, mode: 'cursor' })` | links to `/orders` |
| Running jobs tile and Jobs card | `useLiveList(live.jobs, { filter: status in queued, running })` | one read for both; each row a `JobProgress` with `:job` and `variant="inline"` |
| Revenue tile | `useLiveList(live.orders, { filter: paid or shipped, EUR, createdAt gte -30d, limit: 100 })` | summed in the browser (see Gotchas) |
| Recent orders | `useLiveList(live.orders, { limit: 5, mode: 'cursor' })` | a plain `Table` in a Card (not `flush`: the Table draws its own frame), "All orders" to `/orders` |
| Billing | `useLive(live.billing)` | always 403 in the demo: an info Banner, no Retry |

## States

| State | Shown |
|-------|-------|
| loading | each tile its skeleton (`loading`), the Table its shimmer rows, the cards a `Skeleton` |
| failure | one danger Banner under the header with one Retry that resubscribes every failed read |
| forbidden | in the card that reads it: a sentence that says who may see it; not a failure, no Retry |
| stale | a warning Badge with `ui.stale` in the header's actions; the figures stay |
| empty | `EmptyState` in the Table and in the Jobs card |

A failed tile shows `-` instead of its number.

## Props

None.

## Agent

`data-page="home.dashboard"`. `actions.ts` exports an empty list: the page only reads. The tiles
and "All orders" are links the agent follows by name.

## Messages

`messages.ts` holds every string under `home.dashboard.*` in `en` and `de`. Mounted with
`useI18n({ useScope: 'global', messages })`, the convention of every page recipe: one `t` for
the page's keys and the `ui.*` keys (`ui.retry`, `ui.stale`).

## When copying

1. `ui-copy Dashboard` lands it in `src/pages/Dashboard/`; rename the folder to the area
   (`src/pages/Home/`).
2. Rewrite the descriptor line: `@/fake/api` becomes `@/api/api`.
3. Resolve every `// REPLACE:`: the first name from the session.
4. Swap the tiles' reads for the project's figures; keep a count as the `total` of a one-row page.
5. Point the links (`/customers`, `/orders`) at the project's routes.
6. Route: `{ path: '/', name: 'home.dashboard', component: Dashboard, meta: { page: 'home.dashboard', title: 'Dashboard', intent: 'See the figures of the day and what needs attention' } }`.

## Gotchas

- The revenue tile sums at most one page of 100 orders in one currency. A project with more
  orders, or several currencies, serves the sum as its own live read and shows that.
- The greeting picks morning, afternoon or evening from the hour when the page mounts.
- A relative time (`{ relative: '-30d' }`) counts from the clock of each read, so the window
  moves with every push.
