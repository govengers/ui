---
name: ListPage
tier: page
intent: [list page, entity list, customers list, table page, search and filter page, overview page, browse records, counted tabs, bulk actions, export list]
uses: [Page, PageHeader, Tabs, Badge, Banner, Button, Dialog, EmptyState, Field, Icon, Input, Select, Skeleton, Table, Toast, agent, format, SearchTable, FacetFilter, RangePicker, ColumnsPicker, DetailDrawer]
livewire: true
status: ready
laws: [choice-overload, cognitive-bias, jakobs-law, mental-model, pareto-principle, working-memory]
---

# ListPage

Every record of one resource (D32), written for customers: counted tabs, search, the facet
filter with live counts, a created-at range, a column picker, sort, paging, selection with bulk
export and delete, a row menu, the detail drawer with previous and next, and the create dialog.
Every part of the state is in the URL. The per-entity parts live in one config file.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `ListPage.vue`, `actions.ts`, `customers.list.ts`, `messages.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Page`, `PageHeader`, `Tabs`, `Badge`, `Banner`, `Button`, `Dialog`, `EmptyState`, `Field`, `Icon`, `Input`, `Select`, `Skeleton`, `Table`, `Toast`, `agent`, `format`, `SearchTable`, `FacetFilter`, `RangePicker`, `ColumnsPicker`, `DetailDrawer` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| the cards of its blocks, `patterns/` guide named below, the laws in `laws` | when composing | shape, reasons, review questions |

Do not load:

| Skip | Why |
|------|-----|
| `ListPage.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Files

| File | What | Edit per entity |
|------|------|-----------------|
| `ListPage.vue` | composes the blocks; owns the filter, the tab counts, export, create and delete | the descriptor import, the cells, the create form's fields |
| `customers.list.ts` | `columns`, `facets`, `tabs`, `rowActions`, `bulkActions`, `defaultColumns`, `defaultSort`, `detailRoute`, status labels and tones | everything |
| `actions.ts` | `createCustomer`, `deleteCustomer` as `AgentAction`s (D48) | names = the entity's call names |
| `messages.ts` | every string under `customers.list` (en, de), mounted by `useI18n({ useScope: 'global', messages })` | the texts |

## When copying

`ui-copy` puts the folder into `src/pages/<Area>/`. Then:

1. Rename `customers` to the entity everywhere: the file `customers.list.ts`, the message keys
   `customers.list.*`, `data-page="customers.list"`, the route names `customers.list` and
   `customers.detail`, the storage key `customers.list.columns`, the export file name.
2. Rewrite the one descriptor import in `ListPage.vue` and in `customers.list.ts`: the line under
   `// In a project:` replaces the `@/fake/api` line (`ui-copy` does it).
3. Edit `customers.list.ts`: columns of the resource, its facets (fields from the generated
   filters, `array` for list fields, `values` for those), the tab field, the row and bulk actions.
4. Edit the cells (`#cell-<key>`), the drawer's summary and the create form's Fields in
   `ListPage.vue`, and the call names in `actions.ts`.
5. One `messages.ts` and one `actions.ts` per folder (D21, D48): when `DetailPage` lands in the
   same area folder, merge its two files into these.
6. Add the route: `{ name: 'customers.list', path: '/customers', component: ListPage, meta: {
   page: 'customers.list', title, intent } }`.

## Data flow

- `filter` = `toFilterDocument(clauses, { base, facets })`: `base` holds the tab's status clause
  and `rangeToConditions('createdAt', range)`, the facet clauses go on top. `SearchTable` adds
  the search, sort and page itself.
- `FacetFilter` counts under `base` and the search through `distinct =
  live['customers.distinct']`, one subscription per facet. With an app-level combined read pass
  `facetsRead` (the demo's `live.customerFacets`) instead; it counts list fields too.
- The tab counts and the subtitle come from one more distinct read on `status` under everything
  but the tab; "All" is their sum.
- Export downloads `downloads.customers` through `pair.client.download` under the current filter
  and search; "Export selected" sends `id in [...]`.
- Create and delete call the connection and never insert or remove rows themselves: the push
  renders them. Field errors of the create call land at the Fields (`ApiError.fields`).
- Delete confirms in a danger Dialog because the delete is final (no restore call; see
  `patterns/building-a-list-page.md`, "Deleting"). Title and confirm button name the count
  ("Delete 2 customers?", "Delete 2 customers"); the doomed rows are kept after the close, so a
  leaving dialog never reads "Delete 0 customers?". A second press, or a press on the confirm of a
  dialog that is leaving, deletes nothing. The dialog returns the focus to its opener (a row's
  menu, the bulk bar), which the push removes, before or after the call answers. Once the deleted
  rows are gone the focus goes to the row that takes the first deleted row's place (the last one
  before it at the end of the page), else, when a live change took that row too, the row now at
  that place, else the list itself (`tabindex="-1"`, `role="group"` named like the page, passed to
  SearchTable's root); not when the user has moved the focus meanwhile.
- Clear filters writes only the keys of the blocks that follow the URL: it drops every facet key
  and `t` in one awaited `router.replace` (path and hash kept), then sets `clauses` and `range`,
  which now match the route and write nothing, and empties the search last through SearchTable's
  `clearSearch()` (a text still in its debounce goes too), so SearchTable is the only writer of
  `search` and `page`. `sort` and `tab` stay. Three model changes in one tick would let the last
  writer put the others' keys back; a second press while the first one's navigation runs does
  nothing, else it would cancel that navigation and a block would write its key back. A navigation
  that a guard refuses or another one supersedes leaves the models as they were (the URL kept its
  keys); a duplicated one (only a search was set) goes on.

## URL keys

| Key | Owner |
|-----|-------|
| `tab` | the page (the Tabs are router links; the active tab is read from the route) |
| `search`, `sort`, `page` | SearchTable |
| `status`, `country`, `owner`, `tags`, `<facet>.not` | FacetFilter |
| `t` | RangePicker |
| `item` | DetailDrawer |

No facet may be keyed `tab`, `search`, `sort`, `page`, `t` or `item`.

## States

Loading rows, a refused read as a danger Banner with Retry and the stale line are SearchTable's.
The page fills SearchTable's `empty` slot with one of three states:

| Case | Shows |
|------|-------|
| a search, a facet clause or a range narrows the list | "No customers match" and Clear filters, which empties all three |
| nothing narrows, the default tab, no customer at all (a first run) | "No customers yet", the icon `users`, one sentence on what a customer is for, and New customer (`data-action="createCustomer"`) opening the create dialog |
| nothing narrows, another tab | "No customers match", nothing else |

The first run is told by SearchTable's `total` (0) for the current query: while the list still
shows the query before (the `empty` slot's `stale`, right after Clear filters or an emptied search
box) the empty state keeps what it showed, and a page emptied by deletes or live changes past the
last page is no first run. The empty state's buttons leave with it once rows arrive, so
the focus moves on: Clear filters puts it on the filter button at once, a customer created from
the first run puts it on the header's New customer. Tab counts and the subtitle stay empty until their read answers. The
drawer shows a skeleton while its record loads and the refusal (a deleted record) as a Banner.

## Agent

`data-page="customers.list"`. "New customer" (in the header and in the first-run empty state) and
the dialog's submit carry `data-action="createCustomer"`; the row menu's Delete, "Delete selected"
and the confirm button carry `data-action="deleteCustomer"`; Clear filters carries none, it
mutates nothing. The search box is named "Search customers" (`customers.list.searchLabel`). The
filter button is `data-action="filter"`, chips carry `data-facet`. Form controls are named after
the API fields. `actions.ts` declares both calls; the
page binds them with `useAgentAction` (D48). The URL is the agent's shortcut: a link with
`?tab=active&country=DE` opens the filtered list.

## Gotchas

- `facets` are read once by FacetFilter: the facet labels follow a locale switch only after a
  remount.
- A tab and the status facet AND together: tab "Active" with the chip "Status is on hold" is
  empty, by design.
- The owner names come from a `users` list read; a project without one passes ids and drops
  `labelOf`.
- Several elements carry `data-action="deleteCustomer"`: every row's menu item (in the DOM while
  closed), "Delete selected" and the confirm button; `createCustomer` sits on the header's opener,
  the first-run empty state's opener and the dialog's submit. `selectorOf` resolves the first
  match in the DOM, so a drive plan names the visible one with a selector
  (`{ selector: 'dialog[open] [data-action="deleteCustomer"]' }`).
- A link with `page` and a facet, `t` or `search` opens on page 1: FacetFilter and RangePicker
  sit in SearchTable's toolbar and read the URL after SearchTable took the page, and the search
  from the URL reaches the read only once the page's `v-model:search` has passed it back; each of
  these changes the filter, which starts the list at page 1. `page` with `sort` or `tab` alone
  survives.
- The create Dialog's form is outside the Dialog's footer, so the submit button names it with
  `form="customer-create"`.
- The drawer's "Open" and the row menu's "Edit" need the `customers.detail` route; without it
  the router throws while resolving the link.
