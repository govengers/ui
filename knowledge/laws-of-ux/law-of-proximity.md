---
name: Law of Proximity
category: gestalt
summary: Things placed close together read as related
applies: [Field, Page, DetailForm, Checkbox, PageHeader]
---

# Law of Proximity

> Objects that are near, or proximate to each other, tend to be grouped together.
> (Jon Yablonski, Laws of UX)

Spacing is the cheapest grouping tool there is. In dense business forms, a label that sits as
close to the next control as to its own is the classic cause of a value typed into the wrong
field.

## In this collection

- Field puts label, control and hint `--ui-space-1` apart (`ui/Field/Field.vue`), and DetailForm
  stacks Fields `--ui-space-4` apart: a label is always nearer its own control than the next one.
- Spacing comes only from the `--ui-space-*` scale in `ui/tokens.css` (D6); compact density
  changes the control and spacing tokens for every piece at once (D38).
- Page owns the vertical rhythm between its children.
- Checkbox keeps its description right under its label; PageHeader keeps the page's actions
  together on the right.

## Review questions

- Is each label closer to its own control than to any other?
- Does every difference in spacing on this page mean something?

## Source

https://lawsofux.com/law-of-proximity/
