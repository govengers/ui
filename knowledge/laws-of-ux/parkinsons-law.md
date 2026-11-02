---
name: Parkinson's Law
category: principle
summary: Work fills the time it is given, so let the tool cut tasks down to what users expect
applies: [LoginForm, RangePicker, ColumnsPicker, SearchTable, DetailForm]
---

# Parkinson's Law

> Any task will inflate until all of the available time is spent.
> (Jon Yablonski, Laws of UX)

Business tasks are routine. A form that takes five minutes instead of one wastes the difference
every day for every user. Defaults, autofill and remembered state cap the time a task can grow
into, and finishing sooner than expected is what users notice.

## In this collection

- LoginForm sets `autocomplete` (`username`, `current-password`, `one-time-code`) so the browser
  and password managers fill it.
- RangePicker's quick ranges cover the common periods in one click.
- ColumnsPicker remembers the choice under `storageKey`; SearchTable with `syncQuery` keeps sort,
  page and search in the URL, so a list opens the way the user left it.
- DetailForm saves only the touched fields and gives focus back after the save: changing one
  value is one edit and one Save.
- For the team building the app: `ui-start --quick` writes the design contract from defaults in
  one step (D19).

## Review questions

- How many steps does the most frequent task on this page take, and which could a default or
  autofill remove?
- Does the page remember what the user set last time?

## Source

https://lawsofux.com/parkinsons-law/
