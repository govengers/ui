---
name: DetailDrawer
tier: block
intent: [detail drawer, record drawer, detail panel, side panel for a row, previous next record, row detail, quick view]
uses: [Sheet, Button, Icon]
livewire: true
status: ready
---

# DetailDrawer

One record in a `Sheet`, with previous and next through the rows on screen (PDB's
AgentDetailDrawer, D34): the header shows the title, "3 of 25" and two arrow buttons, also bound
to ArrowLeft and ArrowRight. Given an item read as `target` it subscribes to the open record
while open; otherwise the page passes the record as `item`.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `string \| number \| null` | required | the open record's id, `null` is closed; use `v-model` |
| `ids` | `(string \| number)[]` | required | the rows on screen in order (SearchTable's `rows` event) |
| `title` | `string \| undefined` | `ui.details` | heading and accessible name |
| `target` | `LiveTarget<{ id: string }, Item> \| undefined` | none | the item read, e.g. `live['customers.item']`; read at mount |
| `item` | `Item \| undefined` | none | the record, when there is no `target` |
| `syncQuery` | `boolean` | `false` | opens from `?item=<id>` at mount and writes `item` while open |
| `inline` | `boolean` | `false` | always open in the page flow, no backdrop; docs and previews only |

## Slots

| Slot | Scope | Content |
|------|-------|---------|
| default | `{ item, loading, error }` | the record's fields; `error` is the refusal of the live read |
| `actions` | | the footer: Edit, Delete |

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:modelValue` | `string \| number \| null` | previous, next, the arrow keys, or `null` on close |
| `close` | none | the drawer closed (X, Escape, backdrop) |

## With livewire

Pass the item read as `target`; the drawer runs `useLive(target, { id })` in an effect scope
that starts when it opens and stops when it closes, so a closed drawer holds no subscription.
Stepping changes the parameters: `useLive` keeps the previous record, stale, until the next one
arrives, so the body never flashes. A record deleted while open answers `not_found` in `error`.

## Agent

The sheet is a `<dialog>` named by the title; the arrow buttons are named Previous and Next and
disabled at the ends. Put `data-action` on mutating buttons in the `actions` slot.

## Gotchas

- Without the plugin's pair and with a `target`, the drawer throws at mount (`useLiveConnection`).
- The arrow keys do nothing while focus is in a field, a select or a menu, or with a modifier.
- `ids` must hold the same type as `modelValue`; livewire ids are strings. With `syncQuery` an id
  from the URL is matched against `ids` by its string form.
- An id that left the screen (a live change moved it) keeps the drawer open; the position and
  the arrows hide or disable until the page passes `ids` that hold it again.
