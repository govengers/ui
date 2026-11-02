---
name: Law of Common Region
category: gestalt
summary: Things inside one boundary read as one group
applies: [Card, Table, FacetFilter, Dialog, ActionBar, SettingsPage]
---

# Law of Common Region

> Elements tend to be perceived into groups if they are sharing an area with a clearly defined
> boundary. (Jon Yablonski, Laws of UX)

Business screens show unrelated things side by side: a form, a status, a list of related
records. A border or a surface tells the user what belongs together, and above all what a Save
button saves.

## In this collection

- Card is the one surface: header, body, footer. On the SettingsPage every Card is its own form
  with its own Save, so the boundary is also the save scope (`patterns/building-a-settings-page.md`).
- A Table row holds one record; below 48rem of its own width every row becomes a card. Selected
  rows get `--ui-accent-soft` (D36).
- Every active facet is one chip in FacetFilter's bar: field, operator and values inside one
  boundary, with its own remove cross.
- Dialog and Sheet frame a sub-task over the page; ActionBar sets the form's actions apart from
  its fields.

## Review questions

- Does every Save on this page have a visible boundary around what it saves?
- Do unrelated items share one surface?

## Source

https://lawsofux.com/law-of-common-region/
