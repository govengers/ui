---
name: Building a list page
tier: pattern
intent: [list page, table of records, search and filter, browse entities, overview page]
uses: [ListPage, SearchTable, FacetFilter, RangePicker, ColumnsPicker, DetailDrawer, PageHeader, Tabs]
livewire: true
status: ready
---

# Building a list page

The most common page of a business application: every record of one resource, searchable,
filterable, sortable, paged, with a detail drawer and row actions. The `ListPage` recipe is the
canonical composition (D32); this guide says what goes where and why.

## Shape, top to bottom

1. `Page` with `data-page="<area>.list"`, width `page`.
2. `PageHeader`: title, a subtitle with the live count, the one primary action (`createX`) and the
   secondary ones (export) in `actions`; the counted views as `Tabs` in the `tabs` slot. Each tab
   is a fixed filter (`status in [open]`), never a different page.
3. The toolbar inside `SearchTable`: the search box (built in), then `FacetFilter`,
   `RangePicker` and `ColumnsPicker` through the `toolbar` slot; the chip bar through `chips`.
4. `SearchTable` with the entity's `columns`, `rowKey`, `rowActions` and the `bulk` slot.
5. `DetailDrawer` opened by `row-click`, stepping through the visible ids.
6. `Dialog` for create, opened by the primary action.

## One config file per entity

`customers.list.ts` next to the page exports `columns`, `facets`, `tabs`, `rowActions(row)` and
`bulkActions`. The page is then the recipe plus this file; the next entity's list is a copy of the
file, not of the page.

## Data flow

- The page owns one `filter` ref: `toFilterDocument(clauses, { base, facets })` from
  `FacetFilter`'s `facets.ts`, `base` holding the tab's clause and
  `rangeToConditions('createdAt', range)`; SearchTable adds the search.
- `SearchTable` gets `target = live.customers` and that `filter`; it owns sort, page and search.
- `FacetFilter` gets `distinct = live['customers.distinct']` (one subscription per facet with
  the filter minus that facet's own clauses) or `facetsRead` when the backend offers a combined
  read.
- `syncQuery` on the three blocks puts everything in the URL: a link to a filtered view is a
  link.

## States the page must show

Loading skeleton (`!error && loading`), a refused subscription as a Banner with Retry (never the
skeleton), stale data with the quiet stale notice, the first page after a filter change, and an
empty list that says why it is empty:

- A search, a facet or a range narrows it: "No customers match" and Clear filters, which empties
  all three. The page writes only the URL keys of the blocks that follow the URL (facets, `t`) in
  one awaited write, then sets their models and empties the search last (`ListPage.md`).
- Nothing narrows, the default view and a total of 0 for the current query (a first run): what the
  entity is for in one sentence and the primary create action, so the empty page teaches its next
  step. While the list still shows the query before (SearchTable's `stale`), the empty state keeps
  what it showed: right after Clear filters the old total is still 0.
- Nothing narrows, another tab, or an empty page past the last one: the title only.

## Deleting

- Reversible (the backend soft-deletes and offers a restore call): delete at once and toast with
  an Undo action that calls restore. No confirm: the undo is the safety net.
- Irreversible: a `Dialog variant="danger"` that names the item ("Delete Acme?") or the count
  ("Delete 3 customers?"), with "Cancel" and the verb "Delete" naming the same item or count on
  the confirm button. The title keeps its text while the dialog leaves.
- Rare and very destructive (a workspace, an account): the dialog also asks for the typed name.
- Confirm only what cannot be undone: a dialog on every routine action trains the click-through
  (NN/g, "Confirmation Dialogs Can Prevent User Errors (If Not Overused)").

The `ListPage` recipe confirms, because its delete is final.

## Agent

The primary action carries `data-action="createCustomer"`; row menu items carry the call name;
the filter button is `data-action="filter"`. The page's `actions.ts` declares `createCustomer`
and `deleteCustomer` (D48).
