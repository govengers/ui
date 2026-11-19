---
name: SearchTable
tier: block
intent: [search table, live list, live table, list page, searchable list, filtered list, paginated list, cursor pagination list, list with bulk actions, list with row menu, list toolbar]
uses: [Table, Pagination, Input, Select, Checkbox, Button, Icon, Menu, Banner, EmptyState]
livewire: true
status: ready
laws: [cognitive-load, doherty-threshold, flow, parkinsons-law, postels-law, selective-attention]
---

# SearchTable

The live list of the `ListPage` recipe (D32) over one livewire list read: a debounced search
box, a toolbar and a chip row for the page's filter kit, the `Table` with sort, selection, a
bulk bar and a row menu, and the pager in offset or cursor mode. Loading, refused, empty and
stale states are built in. Where the Table turns into cards, a sort row stands in for its hidden
header: Select all, a sort select and a direction button. The facet filter is a sibling block:
the page passes its document in as `filter`.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `SearchTable.vue`, `searchTable.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Table`, `Pagination`, `Input`, `Select`, `Checkbox`, `Button`, `Icon`, `Menu`, `Banner`, `EmptyState` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `SearchTable.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `target` | `LiveTarget<Query, ListResponse<Item>>` | required | the list read, e.g. `live.customers`; types `Item` and the filter |
| `filter` | `Query['filter'] \| undefined` | none | the page's filter document: FacetFilter's clauses through `toFilterDocument(clauses, { base, facets })` from `FacetFilter/facets.ts`, or a tab's; the search is added beside its `where` |
| `columns` | `TableColumn[]` | required | as on `Table` |
| `rowKey` | `keyof Item \| (row) => string \| number` | required | livewire items: `"id"` |
| `defaultSort` | `TableSort \| undefined` | none | `{ key, direction }`; none is the resource's default sort |
| `pageSize` | `number` | `25` | the read's `limit`, and the number of placeholder rows on a load; the rows-per-page select changes it in offset mode |
| `mode` | `offset \| cursor` | `offset` | must match the resource: cursor resources have no total; read once |
| `selectable` | `boolean` | `false` | checkbox column and bulk bar |
| `rowActions` | `(row) => MenuItem[]` | none | one `Menu` per row in the actions column, named "Actions for <first column>" |
| `searchable` | `boolean` | `false` | the search box; its text goes into the filter document's `search` 200 ms after the last key |
| `searchLabel` | `string \| undefined` | `ui.search` | name and placeholder of the search box; name the noun ("Search customers") |
| `syncQuery` | `boolean` | `false` | reads `sort`, `page`, `search` from the URL at mount, writes them back with `router.replace`; read once |
| `emptyTitle` | `string \| undefined` | `ui.noResults` | title of the empty state |
| `caption` | `string \| undefined` | none | the table's hidden caption |
| `hideStale` | `boolean` | `false` | drops the muted stale line, for a page that shows its own stale notice |

Models: `v-model:selected` (row keys, optional: unbound it is internal) and `v-model:search`
(optional: bind it to preset or read the search).

## Slots

| Slot | Scope | Content |
|------|-------|---------|
| `toolbar` | | beside the search box: `FacetFilter` (its button and chips wrap in one row), `RangePicker`, `ColumnsPicker`, tab-like toggles |
| `chips` | | a row under the toolbar, for chips that live apart from their button; FacetFilter needs none |
| `cell-<key>` | `{ row, value }` | passed through to `Table`: a custom cell for column `<key>` |
| `bulk` | `{ selected }` | bulk action buttons in the bar above the table, shown while rows are selected |
| `empty` | `{ search, stale }` | replaces the empty state (EmptyState with "Clear search" while searching); `stale` is true while the rows and total on screen are not known to be the current query's (a changed filter, search, sort or page whose first page has not arrived, or a socket that is not open; livewire D76), so an empty state that tells cases apart by the current query (a first run against a filtered list) keeps what it showed until `stale` is false |

Exposed through a template ref: `clearSearch()`, which empties the box and the search at once, a
text still in the 200 ms debounce included (a page's Clear filters calls it).

## Events

| Event | Payload | When |
|-------|---------|------|
| `row-click` | `Item` | a row is clicked or Enter is pressed on it; binding it makes rows clickable |
| `update:selected` | `(string \| number)[]` | the selection changed |
| `update:search` | `string` | the debounced search changed |
| `rows` | `Item[]` | the rows on screen changed (at mount too): hand their ids to `DetailDrawer` |
| `total` | `number \| null` | the total under filter and search changed; `null` until the first page (at mount); kept while a page loads; feeds a subtitle or tab count without a second read |

## With livewire

Takes the list read as `target` (D5); the block calls `useLiveList(target, { filter, sort,
limit, mode })` and `useLiveStatus()` on the provided pair. The page names the descriptor and
nothing else: `<SearchTable :target="live.customers" :filter="facetDocument" ... />`.
Mutations stay on the page (row actions, bulk actions); their pushes update the rows in place,
no local upsert. A filter, search or sort change keeps the last rows on screen until the new
first page arrives; the end of the connection (logout, 4401) or a new pair (account switch) never
keeps them. In offset mode a page whose rows all left (deletes, live changes) steps back to the
last page instead of standing empty past it, with placeholders until that page arrives, never an
empty state. A page that has rows never steps back: under a count cap the total is a lower bound.

## Agent

The search box is `<input type="search" name="search">` labelled by `searchLabel` ("Search" by
default); sort headers, row checkboxes and the pager are named by `Table` and `Pagination`. In
card mode the sort row has a "Select all" checkbox, `<select name="sort">` labelled "Sort by" and
a direction button named "Ascending" or "Descending". Row menu items carry `data-action` from
`MenuItem.action`; bulk buttons in the `bulk` slot carry their own. Sort, page and search in the
URL (`syncQuery`) let the agent link to a list state.

## Gotchas

- Skeleton rows, as many as the page size, show only while `!error && loading` and nothing was
  loaded yet, after `--ui-loading-delay` (a faster read shows none); a refused read shows the
  danger banner with Retry, never a skeleton. The table stays under the banner with the rows
  shown before: a refused new search, filter, sort or page keeps the rows and total of the query
  before (livewire D76, its first page never arrives). Only a refusal with no row shown replaces
  the table.
- Under 48rem of its own width (the edge where Table turns into cards, both boxes have the same
  width) a sort row replaces the hidden header: Select all when `selectable`, its box over the
  row boxes of the cards, then at the row's end a sort select over the sortable columns and a
  direction button when a column is sortable, with or without the search box and the `toolbar`
  slot. A new column in the select keeps the direction; the direction button is disabled while
  nothing is sorted. A sort on a column without an option (hidden through ColumnsPicker, or only
  in the URL) shows "Sort by" in the select, never another column. Wider, the header carries both.
- The block is a size container like Table: inside a flex row it needs a width (`flex: 1` or
  `width: 100%`).
- Live errors carry no HTTP status: the text branches on `error.code` (`not_found`,
  `forbidden` get `ui.notFound` and `ui.forbidden`), every other refusal shows its message.
- A dropped socket keeps the last rows on screen under the muted `ui.stale` line (`hideStale`
  drops it where the page has its own notice); the shell's `ConnectionBanner` says the rest.
- Cursor mode: livewire's `useLiveList` tiles pages for "load more"; previous and next step
  through the loaded tiles and load the next tile when stepping past them. Every visited page
  stays subscribed until the filter, search or sort changes.
- A non-empty search replaces a `search` the page's `filter` carries; the filter's `where` is
  kept untouched. Only resources with a searchable field accept a search.
- `syncQuery` owns the URL keys `sort`, `page` and `search`. DetailDrawer owns `item`,
  RangePicker `t`, FacetFilter one key per facet plus `<facet>.not`, so no facet may be named
  `search`, `sort`, `page`, `item` or `t`. Two syncing lists on one page would share their keys.
- `mode`, `syncQuery` and `target` are read at mount; key the component to swap them.
