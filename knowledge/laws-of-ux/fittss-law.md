---
name: Fitts's Law
category: heuristic
summary: Bigger and closer targets are faster and safer to hit
applies: [Button, Checkbox, PageHeader, Table, Dialog, ActionBar, NotificationInbox]
---

# Fitts's Law

> The time to acquire a target is a function of the distance to and size of the target.
> (Jon Yablonski, Laws of UX)

Business applications run on trackpads, on tablets in meeting rooms and on phones in the field.
Small, distant or tightly packed targets cost time and cause wrong clicks, and in a business tool
the neighbour of Save is sometimes Delete.

## In this collection

- 44 px targets on touch screens through the tokens, not per component: `@media (pointer:
  coarse)` sets `--ui-control-h` to `--ui-touch-min` in `ui/tokens.css` (D9, D49).
- Checkbox makes the whole row the click target, at least 44 px tall; FileUpload's dropzone is a
  `<label>` around the file input, so the whole area takes a click or a drop.
- The page's actions sit on the right of the PageHeader; the row menu is the Table's last
  column, on the row it acts on.
- Dialog's footer is right-aligned with the primary last; ActionBar sticks to the bottom while a
  form scrolls and stretches its buttons to full width on phones.
- The ListPage row menu keeps Delete apart from Open and Edit behind a separator
  (`pages/ListPage/customers.list.ts`).

## Review questions

- Can every control on this page be hit with a thumb on a tablet?
- Is each action next to the thing it acts on?
- Is a destructive action ever directly beside a frequent one?

## Source

https://lawsofux.com/fittss-law/
