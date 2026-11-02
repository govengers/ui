---
name: Page
tier: layout
intent: [page, content column, page width, page root]
uses: []
livewire: false
status: ready
laws: [aesthetic-usability-effect, law-of-proximity, occams-razor]
---

# Page

The content column of every page: padding, max width and the vertical rhythm between its
children. Every page component's root is a `Page` carrying `data-page` (D23); `ui-lint` checks
both.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Page.vue` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Page.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `width` | `content \| page \| full` | `page` | `content` (48rem) for forms and settings, `page` (80rem) for lists and dashboards, `full` for monitors |

## Slots

| Slot | Content |
|------|---------|
| default | `PageHeader` first, then cards, tables, forms |

## Agent

`<Page data-page="customers.list">`: the value is `<area>.<page>` and is what `app-map.json`
lists (D24).

## Gotchas

- `Page` is not the shell. The `AppShell` renders navigation and banners; `Page` sits in its
  main slot (or under the router view).
