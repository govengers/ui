---
name: DetailForm
tier: block
intent: [detail form, edit form, edit record, record form, form card, save and cancel, unsaved changes, live edit form]
uses: [Card, ActionBar, Banner, Button, Icon, Skeleton, LiveForm]
livewire: false
status: ready
---

# DetailForm

The card of an edit form over a `useLiveForm` result. While the record loads it shows a skeleton,
and a failed read shows a Banner with Retry. The page's Fields go in the default slot, a save
failure no field explains shows under them, and the ActionBar with Cancel and Save follows.
Enter submits through a real `<form>`.

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
  moves it to the first refused field (`aria-invalid`). Leave `disabled` unbound and the user
  can keep typing: an edit during the save stays touched and goes with the next one.
- A refusal with field errors shows only at the fields (`saveError` stays empty). A field the
  page did not render never shows its error, so render every field the call validates.
