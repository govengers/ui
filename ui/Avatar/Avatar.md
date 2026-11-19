---
name: Avatar
tier: primitive
intent: [avatar, user picture, profile picture, initials, presence, online status, unknown person]
uses: [Icon]
livewire: false
status: ready
laws: [law-of-pragnanz]
---

# Avatar

A person's picture, or their initials when there is no picture or it fails to load (a person icon
when there is no name either), in three sizes, with an optional presence mark that shape tells
apart, not only colour. To assistive technology the whole avatar is one image named after the
person and their status.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Avatar.vue` | to use it: skim; to change it: read | the behaviour |
| the card of `Icon` | when changing the no-name fallback | the person icon |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Avatar.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `name` | `string` | required | initials are the first letters of the first two words, uppercased; blank: the `user` icon |
| `src` | `string` | none | the picture; on a load error the initials show instead |
| `alt` | `string` | `name` | the accessible name; blank falls back to `name`, both blank to `ui.unknownPerson` |
| `size` | `sm \| md \| lg` | `md` | `1.75rem`, `2.5rem`, `3.5rem` |
| `status` | `online \| offline \| busy \| none` | `none` | a mark bottom-right, ringed in `--ui-surface`: online a filled dot (`--ui-success`), busy a filled dot with a bar (`--ui-danger`), offline a hollow ring (`--ui-muted`); its word joins the accessible name |

## Agent

The root is `role="img"` with `aria-label` "<alt>, <status>", e.g. "Ada Lovelace, Online", or
"Unknown person, Busy" without a name; the inner picture is decorative (`alt=""`). The agent finds
a person's avatar by that name.

## Gotchas

- The status words come from `ui.online`, `ui.offline` and `ui.busy` in `ui/messages.ts`, the
  no-name label from `ui.unknownPerson`.
- The three statuses differ by shape, so they read without colour (WCAG 2.2 SC 1.4.1, a greyscale
  render tells them apart); the word is in the accessible name only, never shown. A new status
  needs its own shape.
- The status ring is `--ui-surface`; on another background (a `--ui-bg` page, the chrome) the ring
  shows as a gap of that surface colour.
- Not a button. An avatar that opens the user menu goes inside a `Button` with a `label`.
- A new `src` resets the error state, so a list that reuses the component retries the picture.
