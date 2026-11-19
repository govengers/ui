---
name: Building a form
tier: pattern
intent: [edit form, create form, validation, save changes, inline edit, field errors]
uses: [DetailForm, LiveForm, Field, Input, Select, RadioGroup, Textarea, Checkbox, Switch, ActionBar, Dialog]
livewire: true
status: ready
---

# Building a form

Forms are a stack of `Field`s, one control each, with the actions after the fields. The server
validates; the form shows `ApiError.fields` next to the field that failed.

## Edit an existing record

`useLiveForm({ target: live['customers.item'], params: { id }, call: calls.updateCustomer })`
gives `fields` (the editable copy), `errors`, `dirty`, `save()`. `DetailForm` renders it: title,
the Fields in the slot, the `ActionBar` with Cancel and Save (`type="submit"`,
`data-action="updateCustomer"`). Save sends only touched fields; a push from another user refills
only untouched ones and lists touched fields whose server value changed in `conflicts`.

## Create a record

A `Dialog` with the same Fields and a local reactive object; on submit
`connection.call(calls.createCustomer, {}, body)`; map a thrown `ApiError`'s `fields` to the
Fields' `error` props; close on success. No local insert: the push renders the new row.

## Rules

- Every control has a `name` equal to the API field; the error map and the agent both key on it.
- Native validation first (`required`, `type="email"`, `min`, `max`); server errors second.
- One primary action per form; `danger` only for destructive ones, behind a confirm `Dialog`.
- The `ActionBar` comes after the fields in DOM order, or it does not stick.
- Never disable the submit button while invalid; let the user click and see the errors.
- One choice from up to about five short options is a `RadioGroup` in a `Field group`, with a
  default selected; more options, or long labels, a `Select`.
- A form with Save uses `Checkbox`; `Switch` only for a setting that applies at once (NN/g,
  toggle switch guidelines).
