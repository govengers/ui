---
name: DetailForm
tier: block
intent: [detail form, edit form, edit record, record form, form card, save and cancel, unsaved changes, live edit form]
uses: [Card, ActionBar, Banner, Button, Icon, Skeleton, LiveForm]
livewire: false
status: ready
laws: [flow, law-of-proximity, parkinsons-law, peak-end-rule, serial-position-effect, zeigarnik-effect]
---

# DetailForm

The card of an edit form over a `useLiveForm` result. While the record loads it shows a skeleton,
and a failed read shows a Banner with Retry. The page's Fields go in the default slot, a save
failure no field explains shows under them, and the ActionBar with Cancel and Save follows.
Enter submits through a real `<form>`.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `DetailForm.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Card`, `ActionBar`, `Banner`, `Button`, `Icon`, `Skeleton`, `LiveForm` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `DetailForm.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `form` | `LiveFormState<Item, Patch>` | required | what `useLiveForm` returned |
| `title` | `string` | required | the card's heading |
| `action` | `string` | required | the update call's name, the Save button's `data-action` |
| `cancelLabel` | `string \| undefined` | `ui.cancel` | |
| `saveLabel` | `string \| undefined` | `ui.save` | |

## Slots

| Slot | Scope | Content |
|------|-------|---------|
| default | `{ fields, errors, conflicts, disabled }` | one `Field` per field: `v-model="fields.name"`, `:error="errors.name"`; `disabled` is true while saving |

## Events

| Event | Payload | When |
|-------|---------|------|
| `saved` | none | `save()` succeeded; a submit with nothing touched sends nothing and emits nothing |
| `cancelled` | none | Cancel was clicked, after `reset()` |

## With livewire

It does not subscribe or call anything itself; the `form` prop does. That keeps the composable
usable without the card (a Sheet, a settings page with two cards over one record).

```vue
<DetailForm :form="form" :title="t('customer.title')" action="updateCustomer" @saved="toast(t('customer.saved'))">
  <template #default="{ fields, errors, disabled }">
    <Field :label="t('customer.name')" :error="errors.name" required>
      <Input v-model="fields.name" name="name" :disabled="disabled" />
    </Field>
  </template>
</DetailForm>
```

## Agent

Save is `type="submit"` with `data-action` = the call name: drive mode fills the fields by their
`name` and pauses on this button (D27). Cancel carries no `data-action`; it changes nothing. The
read error's Banner is `role="alert"`, and its Retry re-subscribes.

## Gotchas

- The ActionBar sits after the card, not inside it: a Card clips its content (`overflow:
  hidden`), so a sticky bar inside it would never stick.
- The action bar's hint names no field. "Changed elsewhere" means one of `conflicts`; put a
  per-field hint on the Field from the slot's `conflicts` when the form is long.
- A control disabled while saving loses the focus; after the save the form gives it back, or
  moves it to the first refused field in DOM order (`aria-invalid`). Leave `disabled` unbound
  and the user can keep typing: an edit during the save stays touched and goes with the next one.
- A refused field's error clears when the user leaves it (`focusout`) with another value than
  the refused one (`form.settle`), once the press that took the focus away has ended: the line
  going away must not move Save from under the pointer. The control's `name` must be the server's
  field name.
- The leave guard is `useLiveForm`'s, not this card's: the form state can outlive the card (a
  settings tab), and so does the guard. A query-only navigation does not ask, two dirty forms
  ask twice, the unload prompt is unreliable on iOS Safari; `leaveGuard: false` on `useLiveForm`
  for a form whose edits may be dropped.
- A refusal with field errors shows only at the fields (`saveError` stays empty). A field the
  page did not render never shows its error, so render every field the call validates.
