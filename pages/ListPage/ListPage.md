---
name: ListPage
tier: page
intent: [list page, entity list, customers list, table page, search and filter page, overview page, browse records, counted tabs, bulk actions, export list]
uses: [Page, PageHeader, Tabs, Badge, Banner, Button, Dialog, Field, Icon, Input, Select, Skeleton, Table, Toast, agent, format, SearchTable, FacetFilter, RangePicker, ColumnsPicker, DetailDrawer]
livewire: true
status: ready
laws: []
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
| the cards of `Page`, `PageHeader`, `Tabs`, `Badge`, `Banner`, `Button`, `Dialog`, `Field`, `Icon`, `Input`, `Select`, `Skeleton`, `Table`, `Toast`, `agent`, `format`, `SearchTable`, `FacetFilter`, `RangePicker`, `ColumnsPicker`, `DetailDrawer` | when their props show up here | what the composed pieces do |
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

Loading rows, a refused read as a danger Banner with Retry, the stale line, the empty state with
"Clear search" are SearchTable's. Tab counts and the subtitle stay empty until their read
answers. The drawer shows a skeleton while its record loads and the refusal (a deleted record)
as a Banner.

## Agent

`data-page="customers.list"`. "New customer" and the dialog's submit carry
`data-action="createCustomer"`; the row menu's Delete, "Delete selected" and the confirm button
carry `data-action="deleteCustomer"`. The filter button is `data-action="filter"`, chips carry
`data-facet`. Form controls are named after the API fields. `actions.ts` declares both calls; the
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
  closed), "Delete selected" and the confirm button; `createCustomer` sits on the opener and the
  dialog's submit. `selectorOf` resolves the first match in the DOM, so a drive plan names the
  visible one with a selector (`{ selector: 'dialog[open] [data-action="deleteCustomer"]' }`).
- The create Dialog's form is outside the Dialog's footer, so the submit button names it with
  `form="customer-create"`.
- The drawer's "Open" and the row menu's "Edit" need the `customers.detail` route; without it
  the router throws while resolving the link.
