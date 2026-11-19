---
name: ActionBar
tier: layout
intent: [form actions, save bar, sticky bottom bar, cancel and save]
uses: []
livewire: false
status: ready
laws: [fittss-law, law-of-common-region]
---

# ActionBar

The row of a form's actions, sticky at the bottom of the viewport while the form scrolls. On
phones the buttons stretch to full width.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `ActionBar.vue` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `ActionBar.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


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

- Put the ActionBar after the form fields in DOM order. `position: sticky` only engages with
  preceding scrollable content in the same container; a bar rendered before the fields never
  sticks.
- A sticky bar stops at `--ui-sticky-bottom`: 0 outside a shell, the phone bar's height inside
  `AppShell` on phones, so the two stack instead of the ActionBar covering the tabs. A scroll box
  that is not the page (a `Sheet` body) sets the token again on itself.
- While a sticky bar is on the page, the page's `scroll-padding-bottom` is the bar's height plus
  what it stands on, so a field focused by the browser (a refused `required`), by script
  (`DetailForm` after a refused save, `Stepper` after `blocked`) or by Tab scrolls clear of it
  (WCAG 2.2 SC 2.4.11). A bar in the body of a `Dialog` or a `Sheet` pads that body instead, and a
  bar in a popover pads nothing. A bar in another scroll box of the page's own pads the page, not
  its box: that box sets `scroll-padding-bottom` itself. A bar that wraps to a second row is taller
  than the padding.
- The submit `Button` carries `type="submit"` and `data-action`; `ui-lint` checks the latter.
