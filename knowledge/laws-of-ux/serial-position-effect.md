---
name: Serial Position Effect
category: cognitive-bias
summary: The first and last items of a series are remembered best; put the key items there
applies: [AppShell, PageHeader, Dialog, DetailForm, Menu, SettingsPage]
---

# Serial Position Effect

> Users have a propensity to best remember the first and last items in a series.
> (Jon Yablonski, Laws of UX)

Navigation, menus and button rows are series. Users remember where the first and last items are
and skim the middle. The ends belong to the important items; the rare ones go in between.

## In this collection

- AppShell's first five nav items become the phone's bottom tabs, so the order of `nav` is a
  priority decision.
- PageHeader opens the page with the h1 and ends its row with the page's actions on the right.
- Dialog's footer puts the secondary first and the primary (or `danger`) last; DetailForm's
  ActionBar is Cancel, then Save.
- The ListPage row menu ends with Delete after a separator; the SettingsPage puts the dangerous
  card last.
- The Table's row actions are its last column.

## Review questions

- Are the most used items first or last in every nav, menu and toolbar on this page?
- Is anything important buried in the middle of a long list?

## Source

https://lawsofux.com/serial-position-effect/
