---
name: Textarea
tier: primitive
intent: [textarea, multi-line text, comment box, notes, description input, autosize textarea]
uses: [Field]
livewire: false
status: ready
laws: []
---

# Textarea

Multi-line text that grows with its content through CSS `field-sizing: content`, from `rows`
lines up to a max height, then scrolls. No JavaScript sizing. Put it inside a `Field` for label,
hint and error; it looks like `Input`.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Textarea.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Field` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Textarea.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `string` | `''` | |
| `name` | `string` | none | the agent's handle for the field (D23); always set it in forms |
| `rows` | `number` | `3` | the minimum height in lines |
| `placeholder`, `disabled`, `readonly`, `maxlength` | native | | passed through |

## Slots

None.

## Events

| Event | Payload |
|-------|---------|
| `update:modelValue` | `string`, on every input |

## Exposes

`focus()`.

## Agent

The root is the native `<textarea>`, so `name`, `aria-label` and `data-action` land on the
control itself. The driver fills it like any text field.

## Gotchas

- Autosize needs `field-sizing: content` (Chromium today). Browsers without it (Firefox, Safari
  versions without support) show a fixed `rows` height with a vertical resize handle; content
  beyond that scrolls. Do not add a JavaScript autosizer to close the gap.
- The max height is `--ui-control-h` times 8, so it follows density. A preset that needs another
  value needs a token, not an override.
- `maxlength` is the native limit; no counter is shown.
