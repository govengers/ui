---
name: Toast
tier: primitive
intent: [toast, snackbar, notification, flash message, saved message, undo, transient feedback]
uses: [Button, Icon]
livewire: false
status: ready
---

# Toast

Short feedback after an action ("Saved", "Invoice sent", "Could not delete"). `toast()` in
`toast.ts` queues a message from anywhere; `Toast.vue` is the host that shows it. **Mount the host
exactly once, in the app shell** (next to the `RouterView`); a second host shows every toast twice.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `preview` | `ToastOptions[]` | none | renders these in the page flow instead of the queue, without timers; docs and previews only |

## toast.ts

| Export | Signature | Notes |
|--------|-----------|-------|
| `toast` | `(options: ToastOptions) => number` | queues a toast, returns its id |
| `dismiss` | `(id: number) => void` | closes it early (e.g. when the thing it reports is gone) |
| `toasts` | `ToastItem[]` (shallow reactive) | the queue, oldest first; read it, do not push to it |

`ToastOptions`: `message` (required), `variant` (`neutral | success | danger`, default `neutral`),
`duration` (ms, default 5000, danger 8000, `Infinity` until closed), `action` (`{ label, run }`,
one follow-up such as Undo; running it closes the toast).

Three are visible at a time, newest at the bottom; later ones wait. Hovering or focusing any
toast pauses every timer. Fixed bottom right, bottom centre on phones.

## Slots

None.

## Events

None; actions run their own `run`.

## Agent

Toasts are announced: neutral and success through a polite `role="status"` region, danger through
an assertive `role="alert"` region. The driver reads the outcome of an action there. An action
button in a toast is a convenience; never make it the only way to do something.

## Gotchas

- Danger toasts sit in their own region below the others, so a danger toast is always the lowest,
  whatever its age.
- A toast fired while a modal `Dialog` or `Sheet` is open sits behind it and is inert: close the
  dialog, then toast.
- Field errors belong in the form (`Field` `error`), live connection trouble in the shell banner;
  a toast is for the result of an action, not for validation.
- The message comes from the page's `messages.ts` (`t('customers.saved')`); `toast.ts` translates
  nothing.
