---
name: Select
tier: primitive
intent: [select, dropdown, choose one, picker, page size select, enum field]
uses: [Icon, Field]
livewire: false
status: ready
laws: []
---

# Select

The native `<select>` with a drawn chevron, no custom listbox. Options carry their own value type:
a number option emits a number. Put it inside a `Field` for label, hint and error.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Select.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Icon`, `Field` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Select.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `string \| number \| null` | `null` | `null` shows the placeholder |
| `options` | `{ value: string \| number; label: string; disabled?: boolean }[]` | required | labels are already translated |
| `placeholder` | `string` | none | a disabled empty first option, selected while `modelValue` is `null` |
| `name` | `string` | none | the agent's handle for the field (D23); always set it in forms |
| `disabled` | `boolean` | `false` | |
| `size` | `sm \| md \| lg` | `md` | |

## Slots

None.

## Events

| Event | Payload |
|-------|---------|
| `update:modelValue` | `string \| number`: the chosen option's `value`, in its original type |

## Agent

The driver selects by option label or by value; both are the native `<select>`. `data-action`
and other attributes land on the wrapper, the control is `.ui-select__control` inside it.

## Gotchas

- Without a `placeholder`, a `null` model shows the browser's first option while the model stays
  `null`. Give a placeholder or an initial value.
- The placeholder cannot be chosen again once a value is set; clearing is the caller's job.
- With `required` from the Field, native validation treats the placeholder as empty.
