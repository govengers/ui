---
name: WorkflowStatus
tier: block
intent: [workflow, status, lifecycle, state machine, approval, transitions, order status, timeline, status history]
uses: [Badge, Banner, Button, Dialog, Icon, format]
livewire: true
status: ready
laws: [hicks-law, law-of-uniform-connectedness, mental-model, teslers-law]
---

# WorkflowStatus

The state of a business object and what may happen to it next (D33): the lifecycle as a track
(done, current as a Badge in its tone, upcoming), the transitions allowed now as buttons that
call livewire, confirmed in a dialog first where they say so, and an optional timeline.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `WorkflowStatus.vue`, `workflow.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Badge`, `Banner`, `Button`, `Dialog`, `Icon`, `format` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `WorkflowStatus.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `states` | `WorkflowState[]` | required | the ordered lifecycle: `{ key, label, tone? }`, tone `neutral \| accent \| success \| warning \| danger`, default `accent` |
| `current` | `string` | required | the record's state, from its live item |
| `transitions` | `WorkflowTransition[]` | required | the ones allowed now: `{ to, label, call, params?, body?, danger?, confirm? }` |
| `history` | `WorkflowEntry[]` | none | `{ state, at, by? }`, oldest first, the first state included; shown as a timeline and used to mark done |

The first non-danger transition is the primary button, the others secondary, danger ones
`danger`.

## Events

| Event | Payload | When |
|-------|---------|------|
| `transitioned` | the new state | the call succeeded; the live item's push moves `current` |

## With livewire

The page computes `transitions` from the record and its permissions; the block runs
`connection.call(call, params, body)` on the provided pair and shows `saving` on the button (or
in the dialog) and the `ApiError` message in a danger Banner: inline under the buttons, inside
the dialog for a confirmed one, which then stays open. The block keeps no state of its own:
`current` changes when the live item pushes.

```vue
<WorkflowStatus :states="states" :current="order.data.value.status" :transitions="allowed" :history="history" />
```
```ts
const allowed = computed(() => order.data.value?.status === 'open'
  ? [{ to: 'paid', label: 'Mark as paid', call: calls.payOrder, params: { id } },
     { to: 'cancelled', label: 'Cancel order', call: calls.cancelOrder, params: { id }, danger: true, confirm: 'The customer gets a cancellation mail.' }]
  : [])
```

## Agent

Every transition button carries `data-transition="<to>"`. A transition without `confirm` carries
`data-action="<call name>"` itself; one with `confirm` opens the dialog without mutating, and the
dialog's confirm button carries `data-action` and `data-transition` (as `Dialog` does). One call
per transition (`payOrder`, `cancelOrder`) keeps `data-action` unambiguous; a shared
`updateOrder` needs `data-transition` to tell them apart. The current state has
`aria-current="step"`, done states a check named `ui.done`.

## Messages

`ui.done`, `ui.cancel`, `ui.close` (through Dialog).

## Gotchas

- Without `history`, every state before `current` counts as done, which is wrong for a side
  exit (cancelled from open): pass the history, or leave the exit out of `states`.
- The block does not check that a transition is allowed: the server does, and the page only
  offers the allowed ones. A refusal (409 conflict) shows as the error.
- The confirm keeps its title, sentence, tone, error and running call (spinner, disabled Cancel, no
  X) while the dialog fades out (D94); a press on it then does nothing.
- The demo's `updateOrder` is answered by the demo itself (the fake engine has none, D50); a
  project passes its generated descriptors.
