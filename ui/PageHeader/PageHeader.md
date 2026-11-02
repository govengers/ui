---
name: PageHeader
tier: layout
intent: [page title, page header, heading, page actions, back link, counted tabs row]
uses: [Button, Icon]
livewire: false
status: ready
laws: [fittss-law, hicks-law, law-of-proximity, serial-position-effect, von-restorff-effect]
---

# PageHeader

The first child of every `Page`: the h1, an optional subtitle and back link, the page's actions
on the right, and a row for `Tabs` underneath. One primary action per page lives here.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `PageHeader.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Button`, `Icon` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `PageHeader.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `title` | `string` | required | the h1; the `title` slot overrides it |
| `subtitle` | `string` | none | muted line under the title |
| `back` | `RouteLocationRaw` | none | ghost arrow button before the title |
| `backLabel` | `string` | `Back` | accessible name of the back button; pass the translated word |

## Slots

| Slot | Content |
|------|---------|
| `title`, `subtitle` | rich versions of the props |
| `actions` | `Button`s and a `Menu`; at most one `variant="primary"` |
| `tabs` | a `Tabs` for the counted views of a list page (D32) |

## Agent

The primary action in `actions` carries `data-action`. The driver finds a page's main action
by `[data-page] .ui-page-header [data-action]`.
