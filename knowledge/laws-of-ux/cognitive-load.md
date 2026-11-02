---
name: Cognitive Load
category: heuristic
summary: Every element costs mental effort; spend it on the task, not on the interface
applies: [DetailDrawer, Banner, SearchTable, EmptyState, Button]
---

# Cognitive Load

> The amount of mental resources needed to understand and interact with an interface.
> (Jon Yablonski, Laws of UX)

Our users run several tools at once and get interrupted all day. The task's own load is theirs to
carry; the load the interface adds (decoration, inconsistency, guessing what a control does) is
ours to remove. When the sum exceeds what a person can hold, details get missed.

## In this collection

- One way per job (P2, D22): one Button, one Table, one pager, one way to show an error; each is
  learned once and recognised everywhere.
- DetailDrawer opens a record in a Sheet over the list, so the list, its filters and the position
  stay where they were.
- One failure and one retry per screen: a refused read is one danger Banner with Retry instead of
  the table (SearchTable gotchas, checked by the `ui-review` skill).
- No decorative accent fills or gradients (D36): colour carries state and nothing else.
- An empty result says why and offers the way out: EmptyState with "Clear search" while searching.

## Review questions

- What on this page could go without the task getting harder?
- How many notices, errors and highlights can be on screen at the same time?

## Source

https://lawsofux.com/cognitive-load/
