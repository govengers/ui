---
name: Dialog
tier: primitive
intent: [dialog, modal, confirm, confirmation, delete confirm, popup, alert dialog, form dialog]
uses: [Button, Icon]
livewire: false
status: ready
---

# Dialog

A modal dialog on the native `<dialog>` with `showModal()`: the platform traps focus, closes on
Escape and returns focus to the opener. Title, optional description, a body and a right-aligned
actions footer; on phones it sits at the bottom, full width, and the footer stays visible.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `boolean` | `false` | open state; Escape, the X and a backdrop click set it back to `false` |
| `title` | `string` | required | an `h2`, the dialog's accessible name (`aria-labelledby`) |
| `description` | `string` | none | a line under the title, `aria-describedby` |
| `size` | `sm \| md \| lg` | `md` | max width 24rem, 32rem, 48rem |
| `variant` | `default \| danger` | `default` | `danger` puts a red warning icon before the title; only for destructive confirms |
| `persistent` | `boolean` | `false` | removes the X and ignores Escape and backdrop clicks: the actions are the only way out |
| `inline` | `boolean` | `false` | open in the page flow without `showModal()`, no backdrop; docs and previews only |

## Slots

| Slot | Content |
|------|---------|
| default | the body; scrolls when it is taller than the viewport |
| `actions` | the footer buttons, right-aligned: secondary first, the primary (or `danger`) last |

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:modelValue` | `false` | the dialog closed itself (Escape, X, backdrop) |
| `close` | none | every close, including `v-model` set to `false` |

## Agent

The confirming button carries the `data-action` of the call it triggers (D23), e.g.
`<Button variant="danger" data-action="deleteCustomer">`. The opening button carries none: opening a
dialog mutates nothing. The dialog's name is its title, so the driver finds it by role `dialog`
and that name.

## Gotchas

- Close the dialog after the call succeeded, not before: keep it open with the button `loading`
  and show the error inside it.
- First focus goes to the first focusable element, which is the X. For a form, put `autofocus` on
  the first field; a destructive confirm should keep the default so Enter does not delete.
- A toast fired while the dialog is open sits behind it and is inert. Close first, then toast.
- `persistent` relies on `closedby="none"` where supported; elsewhere a second Escape without
  an interaction in between can still close the dialog (the browser's anti-trap rule), and
  `update:modelValue` reports it.
