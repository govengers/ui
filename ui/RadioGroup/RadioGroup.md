---
name: RadioGroup
tier: primitive
intent: [radio buttons, radio group, choose one, single choice, option list, theme choice]
uses: [Field]
livewire: false
status: ready
laws: [hicks-law, fittss-law, jakobs-law]
---

# RadioGroup

Native radios under one `name`, drawn with CSS like `Checkbox`, one labelled row per option with
an optional muted description. Emits the chosen option's own value, a number stays a number. The
one radio piece (D95): wrap it in `Field group`, which gives the legend, the hint and the error.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `RadioGroup.vue` | to use it: skim; to change it: read | the behaviour |
| the card of `Field` | when its props show up here | the legend, hint and error around the group |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `RadioGroup.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## When to use it

Up to about five short options, where seeing all of them at once helps the choice (a theme, a
plan, a delivery speed): prefer it over `Select`. More options, or long labels, take a `Select`.
A yes or no is a `Checkbox` (saved with the form) or a `Switch` (applies at once).

```vue
<Field :label="t('settings.profile.theme')" group>
  <RadioGroup v-model="theme" name="theme" :options="themes" />
</Field>
```

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `string \| number \| null` | `null` | the checked option's `value`; give it a default, never leave it `null` |
| `options` | `{ value: string \| number; label: string; description?: string; disabled?: boolean }[]` | required | labels are already translated; `description` is a second, muted line |
| `name` | `string` | a generated id | shared by every radio; the agent's handle (D23), always set it in forms |
| `disabled` | `boolean` | `false` | disables every option |

## Slots

None.

## Events

| Event | Payload |
|-------|---------|
| `update:modelValue` | `string \| number`: the chosen option's `value`, in its original type |

## Agent

Every radio carries the group's `name` and its option's `value`; its accessible name is the
option's label alone (`aria-labelledby`), the description is the description. The driver picks
an option with a click on `{ selector: '[name="theme"][value="dark"]' }` or on the label's text;
a `{ field: 'theme' }` target reaches the first radio only. Attributes land on the root `<div>`.

## Gotchas

- No role on the root: the `fieldset` and `legend` of `Field group` name the group (APG, Radio
  Group pattern). Without a Field, a radio group has no name.
- The arrow keys move the choice and select it at once, Tab enters at the checked radio and
  leaves the group: that is the browser's, not this piece's. A change therefore fires on every
  arrow press; a group that saves on change saves on each.
- Always a default selection: with `null` no radio is checked, Tab lands on the first one and the
  user cannot return to "nothing chosen".
- `Field group required` puts `required` on every radio: assistive technology says the choice is
  required, and a group left at `null` is refused on submit and paints its circles red through
  `:user-invalid` (D95). With a default selection it never fails.
- The DOM follows `modelValue`, not the click: a parent that does not take the emitted value gets
  the previous radio checked again after its turn (a refused or pending change).
- The Field's error marks every radio `aria-invalid` and paints the unchecked circles red; the
  sentence itself reaches assistive technology through the Field's alert and the fieldset's
  description.
- The rows are a control's height (`--ui-control-h`), 44 px on coarse pointers (D49); the options
  stack vertically, never side by side.
