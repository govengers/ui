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

- The page owns one `filter` ref: `toFilterDocument(clauses, tabFilter, search)` from
  `FacetFilter`'s `facets.ts`, with `rangeToConditions('createdAt', range)` ANDed in.
- `SearchTable` gets `target = live.customers` and that `filter`; it owns sort, page and search.
- `FacetFilter` gets `distinct = live['customers.distinct']` (one subscription per facet with
  the filter minus that facet's own clauses) or `facetsRead` when the backend offers a combined
  read.
- `syncQuery` on the three blocks puts everything in the URL: a link to a filtered view is a
  link.

## States the page must show

Loading skeleton (`!error && loading`), a refused subscription as a Banner with Retry (never the
skeleton), stale data with the quiet stale notice, an empty list with "Clear search" when a
search or filter is active, the first page after a filter change.

## Agent

The primary action carries `data-action="createCustomer"`; row menu items carry the call name;
the filter button is `data-action="filter"`. The page's `actions.ts` declares `createCustomer`
and `deleteCustomer` (D48).
