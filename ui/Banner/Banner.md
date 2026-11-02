---
name: Banner
tier: layout
intent: [banner, notice, connection lost, maintenance notice, impersonation banner, error with retry, stale data]
uses: [Button, Icon]
livewire: false
status: ready
---

# Banner

A full-width notice: in the shell for connection, maintenance and impersonation (D34), at the
top of a page for an error with a retry. The livewire-aware `ConnectionBanner` block wraps it.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `info \| warning \| danger \| success` | `info` | `danger` announces as `role="alert"` |
| `icon` | `IconName` | per variant | |
| `dismissible` | `boolean` | `false` | close button, emits `dismiss` |

## Slots

| Slot | Content |
|------|---------|
| default | one sentence |
| `action` | a `Button` (Retry, Stop impersonating) |

## Events

`dismiss`.

## Gotchas

- Text on the soft colours is the matching `--ui-on-*-soft` token; do not put `--ui-ink` on a
  soft surface, the contrast script does not measure that pair.
