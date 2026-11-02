---
name: Field
tier: primitive
intent: [form field, label, hint, validation error, required]
uses: []
livewire: false
status: ready
laws: []
---

# Field

Label, hint and error around one control. The control inside gets its `id`, `aria-describedby`,
`aria-invalid` and `required` through `useField()` from `field.ts`, so a form is a stack of Fields
and nothing else.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Field.vue`, `field.ts` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Field.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `label` | `string` | required | |
| `hint` | `string` | none | shown under the control when there is no error |
| `error` | `string` | none | shown instead of the hint, `role="alert"`; marks the control invalid |
| `required` | `boolean` | `false` | asterisk on the label, `required` on the control |
| `hideLabel` | `boolean` | `false` | label for assistive technology only (search boxes) |
| `group` | `boolean` | `false` | a `fieldset` with the label as `legend`; for `Checkbox` groups and radios |

## Slots

| Slot | Content |
|------|---------|
| default | exactly one control: `Input`, `Textarea`, `Select`, `Checkbox`, `Switch` |

## With livewire

Map `ApiError.fields[name]` to `error`: `:error="errors.email"`. `useLiveForm` (block tier)
produces that map.

## Gotchas

- One control per Field, unless `group`: then the Field is a fieldset and each Checkbox inside
  carries its own label.
- Write the control yourself without a Field when it has a visible label elsewhere (a table
  filter row); then pass `aria-label` on the control.
