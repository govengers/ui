---
name: Button
tier: primitive
intent: [button, action, submit, primary action, icon button, link button, loading button, busy button]
uses: [Icon, Tooltip]
livewire: false
status: ready
laws: [aesthetic-usability-effect, cognitive-load, doherty-threshold, fittss-law, hicks-law, law-of-similarity, occams-razor, von-restorff-effect]
---

# Button

The one button. Four variants, three sizes, a loading state that keeps the focus, and it becomes
a router link or an anchor when given `to` or `href`. An icon-only button shows its `label` as a
tooltip on hover and keyboard focus.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Button.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Icon`, `Tooltip` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Button.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `primary \| secondary \| ghost \| danger` | `secondary` | one `primary` per view, `danger` only for destructive actions |
| `size` | `sm \| md \| lg` | `md` | |
| `type` | `button \| submit \| reset` | `button` | only on the `<button>` form |
| `disabled` | `boolean` | `false` | native `disabled` on a `<button>`, `aria-disabled` on a link; `loading` wins while both are set; a Button that turns disabled while it has the focus keeps it until the focus leaves (below) |
| `loading` | `boolean` | `false` | keeps focus, sets `aria-busy` and `aria-disabled`, ignores clicks and Enter; the spinner shows after `--ui-loading-delay`; `data-state="loading"` |
| `block` | `boolean` | `false` | full width |
| `label` | `string` | none | required for an icon-only button: its accessible name, shown as a tooltip on hover and keyboard focus |
| `to` | `RouteLocationRaw` | none | renders a `RouterLink` |
| `href` | `string` | none | renders an `<a>` |

## Slots

| Slot | Content |
|------|---------|
| default | the label |
| `icon` | a leading `Icon` |

## Custom properties

What a surrounding may set on an ancestor; nothing else of Button's look is meant to be changed
from outside.

| Property | Default | Notes |
|----------|---------|-------|
| `--ui-button-ghost-ink` | `--ui-ink-2` | the ghost variant's text at rest, for a ground that is not a surface (AppShell's top bar sets `--ui-on-chrome`); hover keeps `--ui-ink` on `--ui-surface-2`, a press on `--ui-surface-3`; a panel inside that ground (a popover, a dialog) resets it with `initial` (D102) |

## Pressed

While pressed it paints one colour step past hover (`--ui-accent-active`, `--ui-danger-active`,
`--ui-surface-3` with `--ui-ink`), from the first frame, and nothing moves (D104). Not while
disabled, loading or held. Space held shows it, Enter does not (it clicks on key down). Chromium on a
touch screen shows it after a short hold and for about 150 ms after a tap; Safari on iOS sets
`:active` only where a touch listener sits on the element or an ancestor (MDN, `:active`; not
verified). Forced colours show no press.

## Loading

The content stays where it is and stays the accessible name, so the width never changes and
nothing moves between a press and its release. After `--ui-loading-delay` the content turns
invisible and a spinner shows in its place, both at once: an answer faster than the delay shows
nothing. It turns invisible by opacity, which Windows contrast themes (forced colours) keep; a
transparent colour they would override. While loading, every press on the Button is swallowed: a
second press, a double click, a held key, a middle or modified click on a link, a scripted
`click()` and Enter in a field of its form (the browser submits a form by clicking its first
submit button). Screen readers announce it busy and dimmed, and it keeps its place in the tab
order.

Script can still get past it: two `click()` calls in one task both pass (the prop arrives with
the next render), a dispatched click that is not cancelable still submits the form, Enter submits
through an enabled submit button that comes earlier in the same form, and `requestSubmit()` passes
no button at all. A loading or disabled link keeps its `href`, so the context menu still opens it.

When `loading` ends with `disabled` set, or `disabled` turns on, while the Button has the focus,
it is held: disabled in every way but focus (`aria-disabled`, the disabled look, no press, no
submit through it) until the focus leaves, then natively disabled. Its focus ring stays at full
strength: the fill, border and content dim, not the element (a focused disabled link too). A blur
from a window switch keeps it held; `disabled` turning false ends it. The hold ends with a blur
event: where the browser sends none, as when the focused Button is taken out of the page and put
back (a KeepAlive), it stays a dimmed, guarded tab stop until it is visited and left once. A
Button disabled without the focus is natively disabled at once.

## Agent

Every button that mutates data carries `data-action="<livewire call name>"` (D23); the attribute
falls through to the root element. Navigation buttons use `to`, which the driver follows by href.
A loading Button carries `aria-busy="true"` and `data-state="loading"`, and a press on it does
nothing: a driver that has to press it again waits until both are gone. A held Button is
`aria-disabled="true"` without the `disabled` attribute: a driver or test that asks whether a
Button is available reads `aria-disabled` (or the accessibility tree), not `disabled`.

## Gotchas

- An icon-only button without `label` has no accessible name; `ui-lint` fails it (UL-013). The
  tooltip only shows the label: touch shows nothing, so the icon must be clear on its own.
- `label` on a button with text replaces the text as its name and shows no tooltip.
- `disabled` on a link is `aria-disabled`, not the attribute: links cannot be disabled natively.
- Native `disabled` leaves the tab order, drops the focus to the page and cannot say why. Prefer a
  submit that stays enabled and a server that refuses with a field error
  (`patterns/building-a-form.md`); after a refused save the form moves the focus to the first
  refused field (`DetailForm` does).
- `disabled` together with `loading` (`:disabled="!dirty" :loading="saving"`): the pressed Button
  keeps the focus through the load and after it, held as above. A Button the page removes or
  replaces when the action ends (another state's buttons) loses the focus all the same: the page
  moves it.
- The Button stops presses only (see Loading for what script can do): a submit handler that must
  never run twice returns while its own busy flag is set, as the demo's `save()` does.
