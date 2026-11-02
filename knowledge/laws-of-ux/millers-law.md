---
name: Miller's Law
category: heuristic
summary: Working memory holds only a handful of items; structure content instead of capping it
applies: [AppShell, ColumnsPicker, Dashboard, SettingsPage, Field]
---

# Miller's Law

> The average person can only keep 7 (plus or minus 2) items in their working memory.
> (Jon Yablonski, Laws of UX)

Seven is not a design limit, and the source warns against using it as one; capacity varies with
the person and what they already know. The useful lesson for business screens: nobody holds a
long unstructured list in their head, so group it and keep what is needed visible.

## In this collection

- AppShell shows the first five nav items as bottom tabs on phones; the order of `nav` is a
  priority decision (`ui/AppShell/AppShell.md`).
- ColumnsPicker starts from `defaultColumns`, five in `pages/ListPage/customers.list.ts`; more
  columns are opt-in.
- The Dashboard recipe opens with four StatusTiles, not a wall of numbers.
- SettingsPage splits settings into tabs and one Card per concern; Field `group` bundles related
  checkboxes under one legend.

## Review questions

- Does the user have to remember anything from one part of the page to use another?
- Is every long list on this page structured into named groups?

## Source

https://lawsofux.com/millers-law/
