---
name: Stepper
tier: block
intent: [stepper, wizard, multi-step form, steps, onboarding flow, checkout steps, save then watch]
uses: [ActionBar, Button, Icon]
livewire: false
status: ready
laws: [chunking, goal-gradient-effect, law-of-uniform-connectedness, zeigarnik-effect]
---

# Stepper

A multi-step form frame: the step list (numbers, a check on done steps, the current one
highlighted; a compact vertical list in a narrow container), the current step's content, and a
Back / Continue / Finish bar. The page owns the current step and decides when it may be left.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Stepper.vue`, `stepper.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `ActionBar`, `Button`, `Icon` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `Stepper.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `steps` | `StepItem[]` | required | `{ key, title, description?, optional?, action? }`, from `stepper.ts` |
| `modelValue` | `string` | required | the current step's key, `v-model` |
| `canContinue` | `boolean` | `true` | the page's verdict on the current step; Continue, Finish and forward jumps wait for it (the one boolean defaulting to true: the page validates, the frame trusts) |
| `busy` | `boolean` | `false` | a save runs: Continue and Finish spin, Back and the list are inert |
| `finishLabel` | `string` | `ui.finish` | the last step's button |
| `finishAction` | `string` | none | `data-action` of Finish: the livewire call the finish runs |
| `linear` | `boolean` | `false` | `false`: every step reached before is clickable; `true`: the list only goes back |

A step's `action` is the `data-action` Continue carries while that step is current (default
`continue`); set it to the call Continue runs on that step, e.g. `startJob`.

## Slots

| Slot | Props | Content |
|------|-------|---------|
| default | `{ step, index }` | the current step's fields |

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:modelValue` | `key` | Continue, Back, or a click in the list |
| `finish` | none | Continue on the last step (Enter in a field included) |
| `enter` | `key` | a step became current, the first one on mount included |

## With livewire

The frame calls nothing; steps reach livewire through the page. **Save then watch** (D33) is a
pattern, not a step kind: the page binds `:model-value` and `@update:model-value` itself, and
when Continue leaves the saving step it sets `busy`, calls the mutation, and moves on only when
the call succeeded. The next step shows what the server does with it: a `JobProgress` on the
returned job id, or a live item. A refusal stays on the saving step with its message.

```vue
<Stepper :model-value="step" :steps="steps" :busy="busy" :can-continue="valid" @update:model-value="move">
  <template #default="{ step }">...<JobProgress v-if="step.key === 'run'" :target="live['jobs.item']" :id="jobId" @done="..." /></template>
</Stepper>
```

```ts
async function move(next: string) {
  if (step.value === 'review' && next === 'run') {
    busy.value = true
    try { jobId.value = (await connection.value.call(calls.startJob, {}, body)).id } catch (failure) { error.value = (failure as Error).message; return } finally { busy.value = false }
  }
  step.value = next
}
```

## Agent

Continue is `data-action="continue"`, or the step's `action` when Continue saves; Finish carries
`finishAction`. The current list item has `aria-current="step"`; the content panel is a region
named by the step's title and takes focus on every step change, so a screen reader hears the new
step and Tab reaches its first field. The frame is a `<form>`: Enter in a field continues.

## Messages

`ui.back`, `ui.continue`, `ui.finish`, `ui.step`, `ui.optional`, `ui.done`.

## Gotchas

- The page validates; `canContinue` only disables. Show why next to the field, not in a toast.
- Native constraint validation runs on Enter and Continue (`required`, `type="email"`), before
  `canContinue` is asked; a field that should not block needs no such attribute.
- Do not nest another `<form>` in a step: the frame is one.
- `furthest` is remembered by the frame: a stepper mounted on step 3 (a resumed draft) counts
  steps 1 and 2 as done.
- The narrow layout follows the container (`@container`), not the viewport: a stepper in a
  drawer goes vertical on a desktop too.
