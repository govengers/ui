---
name: Badge
tier: primitive
intent: [badge, status label, count, tag, chip, pill, status dot]
uses: []
livewire: false
status: ready
laws: [aesthetic-usability-effect, law-of-pragnanz, law-of-similarity, von-restorff-effect]
---

# Badge

An inline label for a status, a count or a tag. Five soft variants, two sizes, an optional
leading dot in the variant's strong colour, square or pill corners.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Badge.vue` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Badge.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `neutral \| accent \| success \| warning \| danger` | `neutral` | the soft token pair of the state; `accent` marks the selected or active thing |
| `size` | `sm \| md` | `md` | `sm` for counts inside a tab, a button or a table cell |
| `dot` | `boolean` | `false` | a leading dot in the strong state colour; decorative |
| `pill` | `boolean` | `false` | `--ui-radius-pill` instead of `--ui-radius-sm` |

## Slots

| Slot | Content |
|------|---------|
| default | the text or the number |

## Agent

A badge is text, not a control: the accessibility tree reads its words. A status badge says the
status in words ("Overdue"), so the agent and a screen reader get it without the colour.

## Gotchas

- Colour alone never carries the meaning: the dot and the variant repeat what the text says.
- `min-width` equals the height, so a one-digit count in a `pill` badge is a circle.
- Not clickable. A removable filter chip is a `Button` or the chip of `FacetFilter`, not a Badge
  with a click handler.
