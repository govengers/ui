---
name: ActionBar
tier: layout
intent: [form actions, save bar, sticky bottom bar, cancel and save]
uses: []
livewire: false
status: ready
---

# ActionBar

The row of a form's actions, sticky at the bottom of the viewport while the form scrolls. On
phones the buttons stretch to full width.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `sticky` | `boolean` | `true` | |
| `align` | `start \| end \| between` | `end` | |

## Slots

| Slot | Content |
|------|---------|
| default | the `Button`s, submit last |
| `lead` | a muted sentence on the left ("3 unsaved changes") |

## Gotchas

- Put the ActionBar after the form fields in DOM order. `position: sticky; bottom: 0` only
  engages with preceding scrollable content in the same container; a bar rendered before the
  fields never sticks (Paloma One platform shard, 07.09.2026).
- The submit `Button` carries `type="submit"` and `data-action`; `ui-lint` checks the latter.
