---
name: Checkbox
tier: primitive
intent: [checkbox, accept terms, opt in, multi select, checkbox group, select all, indeterminate]
uses: [Icon, Field]
livewire: false
status: ready
laws: [fittss-law, law-of-proximity, mental-model]
---

# Checkbox

The native checkbox, drawn with CSS, with its own label and an optional muted description. Binds a
boolean, or toggles `value` in an array like Vue's `v-model` on native checkboxes. The whole row
is the click target, at least 44 px tall.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Checkbox.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Icon`, `Field` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Checkbox.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `boolean \| (string \| number)[]` | `false` | an array model toggles `value` in it |
| `value` | `string \| number` | none | required with an array model; posted with the form |
| `label` | `string` | none | the default slot overrides it |
| `description` | `string` | none | second line, muted, wired as `aria-describedby` |
| `indeterminate` | `boolean` | `false` | set as the element property; shows a dash |
| `disabled` | `boolean` | `false` | |
| `name` | `string` | none | the agent's handle for the field (D23) |

## Slots

| Slot | Content |
|------|---------|
| default | the label, when it needs markup (a link to the terms) |

## Events

| Event | Payload |
|-------|---------|
| `update:modelValue` | `boolean`, or the new array for an array model |

## Agent

The accessible name is the label alone (`aria-labelledby`); the description is the description.
The driver checks it by that name. `data-action` lands on the row's `<label>`.

## Gotchas

- Inside a `Field` the checkbox takes the Field's hint and error (`aria-describedby`,
  `aria-invalid`), never its id: it has its own label. The Field's label is therefore not the
  group's accessible name; a group of checkboxes is a stack of Checkboxes in one Field.
- `required` from the Field is not applied: on a group it would require every box.
- A click on an indeterminate box clears the dash natively; the caller sets `indeterminate` from
  the model (select all is `some && !all`).
- Without `label` or slot there is no accessible name.
