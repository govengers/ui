---
name: Popover
tier: primitive
intent: [popover, dropdown panel, anchored panel, flyout, popup, filter panel, picker panel, custom dropdown]
uses: []
livewire: false
status: ready
laws: []
---

# Popover

A panel anchored to its trigger on the native `popover` attribute: a click outside or Escape
closes it and focus returns to the trigger. It opens below the trigger, above when only that
fits, else on the roomier side with a scrolling panel, and follows the trigger while open. The
base of `Menu` and of every block with custom dropdown content (filters, pickers).

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Popover.vue` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Popover.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `boolean` | `false` | open state, `v-model`; works without it too |
| `placement` | `auto \| bottom \| top` | `auto` | `bottom` and `top` never flip; the panel scrolls when it does not fit |
| `align` | `start \| end` | `start` | which edge of the panel lines up with the trigger |
| `matchWidth` | `boolean` | `false` | the panel is at least as wide as the trigger |
| `role` | `dialog \| menu \| listbox` | `dialog` | the panel's role; also the trigger's `aria-haspopup` |
| `label` | `string` | none | the panel's `aria-label` |
| `autofocus` | `boolean` | `false` | focus the first focusable element in the panel on open |

## Slots

| Slot | Props | Content |
|------|-------|---------|
| `trigger` | `{ open, toggle, close, expanded }` | one element, the anchor: `<Button v-bind="expanded" @click="toggle">` |
| default | `{ close }` | the panel content; it brings its own padding |

`expanded` is the attribute set for the trigger: `aria-expanded`, `aria-haspopup` (the role) and
`aria-controls` (the panel id). Spread it with `v-bind`; do not bind it to `aria-expanded`.

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:modelValue` | `boolean` | every open and close, however it happened |
| `open` | none | after it opened |
| `close` | none | after it closed (click outside, Escape, `close()`, `v-model`) |

## Exposes

`open()`, `close()`, `toggle()`, and `panel` (the panel element).

## Agent

The trigger's accessible name names the popover; set `label` too, so the panel is found by role
and name. Buttons inside that mutate data carry their own `data-action` (D23).

## Gotchas

- The trigger slot must render one element: its box is the anchor. The wrapper is
  `display: contents`, so a full-width trigger stays full width.
- `top`, `left`, `max-height`, `min-width` (with `matchWidth`) and `data-placement` on the panel
  belong to the script; style the content, not the panel's position.
- Opening one popover closes any other open one that is not its ancestor (native `popover="auto"`).
  Nest a popover inside another's content to keep both open.
- Focus returns to the trigger on Escape and `close()` because the browser remembers what was
  focused at open; Safari does not focus a button on click, so there it returns only for keyboard
  users.
- Inside a modal `Dialog` or `Sheet`, put the popover in the dialog's content, never next to it:
  anything outside the open dialog is inert.
