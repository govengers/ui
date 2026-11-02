---
name: Occam's Razor
category: principle
summary: Of two designs that work equally well, take the one with fewer parts and assumptions
applies: [Button, Table, Dialog, Select, Page]
---

# Occam's Razor

> Among competing hypotheses that predict equally well, the one with the fewest assumptions
> should be selected. (Jon Yablonski, Laws of UX)

Every extra control, mode or option in a business application is one more thing to learn, test
and keep working. The cheapest usability work is avoiding complexity in the first place, then
removing parts until nothing more can go without losing a task.

## In this collection

- One way per job (P2, D22): one Button, one Table, one pager, one way to show an error.
- Native before custom (P5, D9): the platform's dialog, popover, select and date input.
- Runtime dependencies are `vue`, `vue-router`, `vue-i18n`, `date-fns` and livewire; no form,
  component or CSS library (D3).
- A new page picks an existing recipe or writes down why not (`templates/project/DESIGN.md`
  rule 1).
- A look the tokens cannot reach gets a new token, never a forked component (P4).

## Review questions

- What on this page could be removed without losing a task?
- Did the page add a new pattern where an existing piece fits?

## Source

https://lawsofux.com/occams-razor/
