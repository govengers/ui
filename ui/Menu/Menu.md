---
name: Menu
tier: primitive
intent: [menu, dropdown, dropdown menu, row actions, more actions, kebab menu, overflow menu, context menu, action menu]
uses: [Button, Icon]
livewire: false
status: ready
---

# Menu

A dropdown list of actions on the native `popover` attribute: a click outside or Escape closes it
and focus returns to the trigger. The default trigger is a ghost "more" button; bring your own
through the `trigger` slot. Items are buttons, or router links when they have `to`.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `items` | `MenuItem[]` | required | see below; an item with `label: '-'` is a separator |
| `align` | `start \| end` | `end` | which edge of the menu lines up with the trigger; `end` for row menus at the right |
| `label` | `string` | `ui.actions` | accessible name of the default trigger and of the menu |

`MenuItem` (exported from `Menu.vue`): `label` (string), `icon` (an `IconName`), `danger`
(red text, destructive), `disabled`, `action` (the livewire call name, rendered as
`data-action`), `to` (a `RouteLocationRaw`, renders a `RouterLink`), `run` (called on activation).

## Slots

| Slot | Props | Content |
|------|-------|---------|
| `trigger` | `{ open, toggle }` | your own button: call `toggle` on click, bind `open` to `aria-expanded`, set `aria-haspopup="menu"` |

## Events

None: each item runs its own `run` or follows its `to`. The menu closes after any activation.

## Exposes

`toggle()`, to open the menu from somewhere else (a keyboard shortcut, a demo).

## Agent

Every item that mutates data has `action`; it becomes `data-action` on the `menuitem` (D23), so
the driver can call it without opening the menu by hand. The menu is `role="menu"`, its items
`role="menuitem"`, separators `role="separator"`.

## Gotchas

- A destructive item does not act directly: its `run` opens a `Dialog` with `variant="danger"`.
  The menu closes and focus returns to the trigger first, so the dialog gives focus back there.
- Arrow keys, Home and End move between enabled items; disabled items are skipped. Tab closes
  the menu and moves on from the trigger.
- It opens below the trigger, above when only that fits, else on the roomier side with a
  scrolling list; it never covers its trigger. While open it re-places itself every frame, so it
  follows scrolling, resizing and a row that a live update moves. No CSS anchor positioning.
- Position, `top`, `left` and `max-height` are inline styles the script owns; do not style them.
