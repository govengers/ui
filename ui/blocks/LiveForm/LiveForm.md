---
name: LiveForm
tier: block
intent: [live form, edit form state, useLiveForm, touched fields, dirty form, unsaved changes, save only changed fields, patch form, edit conflict, form field errors]
uses: []
livewire: true
status: ready
laws: []
---

# LiveForm

`useLiveForm` in `liveForm.ts`, a composable, not a component: the state of an edit form over
one live record (D33). Save sends only the touched fields. A push refills only the untouched
ones; a touched field keeps the user's text. Field errors come from `ApiError.fields`, and a
retried save keeps its Idempotency-Key. Render it with `DetailForm` or with your own Field stack.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `liveForm.ts` | to use it: skim; to change it: read | the behaviour |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `LiveForm.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

None: a composable. Its options:

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `target` | `LiveTarget<Params, Item>` | required | the live read of the record, `live['customers.item']` |
| `params` | `MaybeRefOrGetter<Params>` | required | `{ id }`; a ref or getter is followed, another record refills every field |
| `call` | `MutationTarget<Params, Patch, unknown>` | required | the update (PATCH), `calls.updateCustomer`; same parameters as the read |
| `pick` | `(item: Item) => Patch` | every field | the fields the form edits; give it, so `id` and `createdAt` stay out of `fields` |
| `connection` | `MaybeRefOrGetter<LiveConnection>` | the provided pair's | |

## Returns (`LiveFormState<Item, Patch>`)

| Key | Type | Notes |
|-----|------|-------|
| `fields` | `Patch` (reactive) | the editable copy: `v-model="fields.name"` |
| `item` | `ShallowRef<Item \| undefined>` | the record as the server has it now |
| `loading` | `ComputedRef<boolean>` | no record and no read error: the skeleton condition |
| `error` | `ShallowRef<ApiError \| NetworkError \| undefined>` | the read's error; `retry()` |
| `saving` | `Ref<boolean>` | |
| `saveError` | `ShallowRef<ApiError \| NetworkError \| undefined>` | a failure no field explains |
| `errors` | `Record<string, string>` (reactive) | `ApiError.fields` by the server's field name: `:error="errors.email"` |
| `touched` | `ComputedRef<string[]>` | fields whose value differs from the server value they were filled with |
| `dirty` | `ComputedRef<boolean>` | `touched` is not empty |
| `conflicts` | `ComputedRef<string[]>` | touched fields the server changed since the user started editing them |
| `save()` | `Promise<boolean>` | sends `touched` only; with nothing touched it makes no call and answers true |
| `reset()` | `void` | every field takes the server's value, errors clear |
| `retry()` | `void` | subscribes the read again |

## Slots

None.

## Events

None; `save()` answers whether it saved.

## With livewire

```ts
const { fields, errors, saving, save } = useLiveForm({
  target: live['customers.item'], params: () => ({ id: route.params.id as string }), call: calls.updateCustomer,
  pick: (customer): UpdateCustomer => ({ name: customer.name, email: customer.email }),
})
```

- The read is `useLive`; the save is `connection.call(call, params, patch, { idempotencyKey })`
  with the patch made once by `prepareCall`. The same patch saved again, after a `NetworkError`,
  sends the same key, so the server runs it once. A new patch gets a new key.
- A refusal with `fields` lands in `errors`. When every refused field is a form field, `saveError`
  stays empty, because the fields already show the failure. A refusal naming a field the form
  does not have also goes to `saveError`, and so does any other failure.

## Agent

The composable has no DOM. The page names each control after its field (`name="email"`) and the
submit `data-action` after the call (`updateCustomer`); `DetailForm` does that for the button.

## Gotchas

- A conflict is a hint, never an overwrite. A touched field keeps the user's text when a push
  changes it, and `conflicts` names it; show a hint (`DetailForm` does in its action bar, or
  `:hint` on the Field). Saving then overwrites the server's value with the user's.
- Touched means "differs from the server value it was filled with", not "was typed in". Typing a
  field back to its old value untouches it, and a push that agrees with the user's text ends the
  edit.
- `fields` is filled from the record, so it is empty until `item` arrives. Render the controls
  under `v-if="item"` or behind `loading`, like `DetailForm`.
- `fields` is not watched: nothing rebuilds it except a push of an untouched field and
  `reset()`. Never assign the whole record into it; set fields one by one.
- Errors stay until the next `save()` or `reset()`; they do not clear while the user types.
