---
name: Switch
tier: primitive
intent: [switch, toggle, on off, enable setting, feature flag toggle]
uses: []
livewire: false
status: ready
laws: [mental-model]
---

# Switch

An on/off setting that applies at once: a `<button role="switch">` with a track, a thumb and a
label next to it. Space and Enter toggle natively. For a choice that is saved with a form later,
use a `Checkbox`.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Switch.vue` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Switch.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `boolean` | `false` | `aria-checked` |
| `label` | `string` | none | the default slot overrides it |
| `disabled` | `boolean` | `false` | |
| `size` | `sm \| md` | `md` | the track only; the target stays 44 px |
| `name` | `string` | none | renders a hidden input posting `true` or `false` |

## Slots

| Slot | Content |
|------|---------|
| default | the label, when it needs markup |

## Events

| Event | Payload |
|-------|---------|
| `update:modelValue` | `boolean`, the new state |

## Agent

The root is the button: `data-action` and `aria-label` land on it. A switch that saves at once
carries `data-action="<livewire call name>"` (D23). The driver clicks it by its name.

## Gotchas

- Without `label`, slot or `aria-label` the switch has no accessible name.
- The hidden input posts `false` too, unlike a checkbox, which posts nothing when off. A disabled
  switch posts nothing.
- The thumb moves with `translateX`; in a right-to-left layout it moves the wrong way.
