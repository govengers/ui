---
name: Choice Overload
category: heuristic
summary: Too many options at once make people decide worse and like the task less
applies: [ColumnsPicker, FacetFilter, RangePicker, Pagination, ListPage]
---

# Choice Overload

> The tendency for people to get overwhelmed when they are presented with a large number of
> options, often used interchangeably with the term paradox of choice. (Jon Yablonski, Laws of UX)

Business data has dozens of fields and hundreds of values per field. Showing all of them at once
stalls the user and spoils the whole screen for them. Narrow first, offer the rest on demand, and
let people compare options before they pick one.

## In this collection

- ColumnsPicker starts from `defaultColumns` (five in `pages/ListPage/customers.list.ts`) and has
  a Reset item; every other column is one tick away, not on screen.
- FacetFilter's cascade shows the facets first and only the values of the active facet next, with
  a value search on long facets (`ui/blocks/FacetFilter/FacetCascade.vue`, D31).
- Every facet value shows its live count, so the user compares outcomes without trying each one.
- FacetPanel shows checkbox lists only for facets marked `short`; long enumerations stay in the
  cascade (D31).
- RangePicker offers a short set of quick ranges before the absolute form; Pagination keeps
  rows-per-page to one select.

## Review questions

- How many options does the user face at the first decision on this page?
- Can they narrow down (search, filter, a sensible default) before they have to choose?

## Source

https://lawsofux.com/choice-overload/
