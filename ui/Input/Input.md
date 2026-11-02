---
name: Input
tier: primitive
intent: [text input, email, password, number input, search box, date input, time input]
uses: [Icon, Field]
livewire: false
status: ready
---

# Input

The one text-like input over the native types. A password gets a reveal toggle; a number emits a
number or `null`. Put it inside a `Field` for label, hint and error.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `string \| number \| null` | `''` | number for `type="number"` |
| `type` | `text \| email \| password \| number \| search \| url \| tel \| date \| time \| datetime-local` | `text` | native types only |
| `name` | `string` | none | the agent's handle for the field (D23); always set it in forms |
| `placeholder`, `disabled`, `readonly`, `autocomplete`, `min`, `max`, `step` | native | | passed through |
| `size` | `sm \| md \| lg` | `md` | |

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
