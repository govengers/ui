---
name: Input
tier: primitive
intent: [text input, email, password, number input, search box, date input, time input]
uses: [Icon, Field]
livewire: false
status: ready
laws: [jakobs-law, postels-law]
---

# Input

The one text-like input over the native types. A password gets a reveal toggle; a number emits a
number or `null`. Put it inside a `Field` for label, hint and error.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Input.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Icon`, `Field` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Input.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `string \| number \| null` | `''` | number for `type="number"` |
| `type` | `text \| email \| password \| number \| search \| url \| tel \| date \| time \| datetime-local` | `text` | native types only |
| `name` | `string` | none | the agent's handle for the field (D23); always set it in forms |
| `placeholder`, `disabled`, `readonly`, `autocomplete`, `min`, `max`, `step` | native | | passed through |
| `size` | `sm \| md \| lg` | `md` | |
| `inputmode`, `enterkeyhint`, `pattern`, `minlength`, `maxlength`, `autocapitalize`, `spellcheck` | native attributes | | not props: they land on the `<input>` like every attribute (D49) |

A one-time code and a new password:

```vue
<Input v-model="code" name="code" inputmode="numeric" autocomplete="one-time-code" />
<Input v-model="password" type="password" name="password" autocomplete="new-password" />
```

## Slots

| Slot | Content |
|------|---------|
| `prefix` | an `Icon` before the text (search) |
| `suffix` | an `Icon` or unit after the text; not shown for passwords (the reveal toggle sits there) |

## Events

`update:modelValue` with a `string`, or a `number | null` for `type="number"`.

## Exposes

`focus()`.

## Gotchas

- Attributes you pass (`aria-label`, `data-action`, `autofocus`) land on the `<input>`; `class`
  and `style` on the wrapper.
- Dates are strings in the `<input type="date">` format (`2026-11-02`); convert with `date-fns`
  `parseISO` at the edge, never in the component.
- A number input emits `null` for an empty field, not `NaN`.
- Codes, postal codes and ids are `type="text"` with `inputmode="numeric"` (the phone shows
  digits, leading zeros stay); `type="number"` is for quantities only: it accepts `e`, emits
  `00123` as `123` and changes its value when the wheel turns over it while it has focus.
- On touch screens the text is at least 16 px (`--ui-field-text-min`, D84), whatever the `size`
  or density: phone browsers zoom the page when a focused field's text is smaller.
