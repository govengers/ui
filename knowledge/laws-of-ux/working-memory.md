---
name: Working Memory
category: heuristic
summary: Short-term memory is small and fades within seconds; keep what the task needs on screen
applies: [DetailDrawer, FacetFilter, ListPage, ColumnsPicker, Tabs]
---

# Working Memory

> A cognitive system that temporarily holds and manipulates information needed to complete
> tasks. (Jon Yablonski, Laws of UX)

Comparing records, carrying a value from one screen to the next, remembering which filters are
on: business tasks lean on short-term memory all day. People recognise far better than they
recall, so the screen should do the remembering.

## In this collection

- DetailDrawer opens a record over the list, shows "3 of 25" and steps with the arrow keys: the
  list and the position never leave the screen.
- Every active facet is a visible chip ("Status is active, on hold, or 2 more"), and the Filters
  button shows a count.
- The whole list state lives in the URL (ListPage): reload, back and a shared link restore it.
- ColumnsPicker with `storageKey` keeps the column choice across reloads.
- Counted Tabs show how many records each tab holds before the user switches.

## Review questions

- What must the user remember from one view to use the next?
- Can they see which filters, sort and selection are active without opening anything?

## Source

https://lawsofux.com/working-memory/
