---
name: Toast
tier: primitive
intent: [toast, snackbar, notification, flash message, saved message, undo, transient feedback]
uses: [Button, Icon]
livewire: false
status: ready
laws: [peak-end-rule, selective-attention]
---

# Toast

Short feedback after an action ("Saved", "Invoice sent", "Could not delete"). `toast()` in
`toast.ts` queues a message from anywhere; `Toast.vue` is the host that shows it. **Mount the host
exactly once, in the app shell** (next to the `RouterView`); a second host shows every toast twice.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Toast.vue`, `toast.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Button`, `Icon` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Toast.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `preview` | `ToastOptions[]` | none | renders all of these in the page flow instead of the queue, without timers and without focus moves; docs and previews only |

## toast.ts

| Export | Signature | Notes |
|--------|-----------|-------|
| `toast` | `(options: ToastOptions) => number` | queues a toast, returns its id |
| `dismiss` | `(id: number) => void` | closes it early (e.g. when the thing it reports is gone) |
| `toasts` | `ToastItem[]` (shallow reactive) | the queue, oldest first; read it, do not push to it |

`ToastOptions`: `message` (required), `variant` (`neutral | success | danger`, default `neutral`),
`duration` (ms; 5000 by default, a danger toast or one with an `action` stays until closed, any
number overrides, `Infinity` included), `action` (`{ label, run }`, one follow-up such as Undo;
running it closes the toast). The rule (D93):
`duration ?? (action || variant === 'danger' ? Infinity : 5000)`, because an error or a follow-up
must not time out before it is read (WCAG 2.2 SC 2.2.1).

Each live region shows three at a time, newest at the bottom; later ones of that region wait, so
an error never waits behind follow-ups. Hovering or focusing any toast pauses every timer;
hovering only where the pointer can hover (`(hover: hover)`), because a touch screen keeps
`:hover` on the last element tapped and a tap on a toast's text would hold it.
Fixed bottom right, bottom centre on phones. A toast fades in, fades out in `--ui-duration-fast`
while the others slide into its place; reduced motion cuts both (`base.css`). A leaving toast is
inert: a second press on Undo does nothing. Closing the toast that holds focus by keyboard moves
focus to the next toast itself (a group named by its message, so a second press closes nothing),
else back to where focus was before it entered the toasts, scrolled into view. An Enter held
through the close repeats nothing: repeats are dropped until the key comes up or another key is
pressed. A pointer close only gives focus back, without scrolling the page, so the paused timers
run again.

## Which surface

| The message is | Use |
|----------------|-----|
| the result of the user's own action | `Toast` |
| about one field | `Field` `error` |
| an ongoing state (offline, maintenance, impersonation) | a shell `Banner` |
| a decision needed before going on | `Dialog` |
| something that waits for the user | `NotificationInbox` or a `Badge` count |

After NN/g, "Indicators, Validations, and Notifications: Pick the Correct Communication Option".

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
- Three toasts that stay hold their region's queue: three with an action hold later neutral and
  success toasts, three danger toasts hold later errors; that is intended. Close a danger toast
  with `dismiss(id)` once its cause is gone.
- Name the object and the outcome (`Invoice 2026-0042 sent`), not `Done`; an error says what
  failed and what to do.
- The message comes from the page's `messages.ts` (`t('customers.saved')`); `toast.ts` translates
  nothing.
