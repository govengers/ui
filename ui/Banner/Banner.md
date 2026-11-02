---
name: Banner
tier: layout
intent: [banner, notice, connection lost, maintenance notice, impersonation banner, error with retry, stale data]
uses: [Button, Icon]
livewire: false
status: ready
laws: [cognitive-load, peak-end-rule, selective-attention]
---

# Banner

A full-width notice: in the shell for connection, maintenance and impersonation (D34), at the
top of a page for an error with a retry. The livewire-aware `ConnectionBanner` block wraps it.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Banner.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Button`, `Icon` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Banner.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


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
