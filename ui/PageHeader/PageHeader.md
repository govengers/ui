---
name: PageHeader
tier: layout
intent: [page title, page header, heading, page actions, back link, counted tabs row]
uses: [Button, Icon]
livewire: false
status: ready
---

# PageHeader

The first child of every `Page`: the h1, an optional subtitle and back link, the page's actions
on the right, and a row for `Tabs` underneath. One primary action per page lives here.

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
