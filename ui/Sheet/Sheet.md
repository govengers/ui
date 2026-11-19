---
name: Sheet
tier: primitive
intent: [sheet, side panel, drawer, slide-over, bottom sheet, detail panel, edit panel, filter panel]
uses: [Button, Icon]
livewire: false
status: ready
laws: []
---

# Sheet

A panel that slides in from the right (or left) edge on desktop and up from the bottom on phones.
The native `<dialog>` with `showModal()`, like `Dialog`: focus trap, Escape and focus return come
from the platform. Use it for content too long for a dialog: an edit form, a detail view, filters.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Sheet.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Button`, `Icon` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Sheet.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `boolean` | `false` | open state; Escape, the X and a backdrop click set it back to `false` |
| `title` | `string` | required | the heading and the accessible name; stays the name when the `header` slot replaces the heading |
| `side` | `right \| left` | `right` | desktop only; phones (up to 48rem) always get a bottom sheet |
| `width` | `string` | `28rem` | any CSS length, desktop only; never wider than the viewport |
| `persistent` | `boolean` | `false` | removes the X and ignores Escape and backdrop clicks |
| `inline` | `boolean` | `false` | open in the page flow without `showModal()`, no backdrop, no slide; docs and previews only |

## Slots

| Slot | Content |
|------|---------|
| default | the body; scrolls between the header and the footer |
| `header` | replaces the heading (a title with a subtitle or a status chip); the X stays |
| `actions` | the footer buttons, right-aligned, always visible |

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:modelValue` | `false` | the sheet closed itself (Escape, X, backdrop) |
| `close` | none | every close, including `v-model` set to `false` |

## Agent

The saving button in `actions` carries the `data-action` of its call (D23). The sheet is a
`dialog` named by `title`; the driver finds it by role and name.

## Gotchas

- Sheet or Dialog: a decision or a short form is a `Dialog`; anything the user reads or scrolls
  through, or a form longer than about four fields, is a `Sheet`.
- The slide-out on close needs `transition-behavior: allow-discrete` on `overlay`; Firefox closes
  without the slide. Reduced motion skips both.
- A toast fired while the sheet is open sits behind it and is inert. Close first, then toast.
- `width` is set as the local custom property `--ui-sheet-w` on the element; override it there,
  not with `width` in a parent's CSS.
