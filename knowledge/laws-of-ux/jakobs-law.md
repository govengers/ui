---
name: Jakob's Law
category: heuristic
summary: Users bring expectations from every other app they use; meet them instead of retraining them
applies: [Dialog, Select, Input, RangePicker, ListPage, WhatsNew, Changelog]
---

# Jakob's Law

> Users spend most of their time on other sites. This means that users prefer your site to work
> the same way as all the other sites they already know. (Jon Yablonski, Laws of UX)

Our users live in their operating system, their browser and a handful of enterprise tools. A
control that behaves differently from all of those costs attention on every use and makes every
training longer. Familiar patterns let them think about the work, not the interface.

## In this collection

- Native first (P5, D9): `<dialog>`, `popover`, a native `<select>` without a custom listbox,
  native date and number inputs; their behaviour is the one users already know.
- The ListPage recipe is the list kit of an earlier admin console made generic (D32) and
  FacetFilter follows that console's filter (D31): the users of our applications already work with them.
- RangePicker copies the Grafana time picker operations people know.
- Links look like links (`a` in `ui/base.css`: accent colour, underline); a Switch applies at
  once and a Checkbox saves with its form, as on every settings screen (`ui/Switch/Switch.md`).
- A new version announces itself once in WhatsNew, so a changed screen is not a silent surprise.

## Review questions

- Which control on this page behaves differently from the browser's or the system's own?
- Would a user of a typical admin console find the list, the filter and the row actions where they expect them?

## Source

https://lawsofux.com/jakobs-law/
