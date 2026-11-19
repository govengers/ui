---
name: Table
tier: primitive
intent: [table, data table, list, sortable columns, row selection, bulk actions, row actions, responsive table, cards on phone, loading rows, empty state, sticky header]
uses: [Button, Icon, Skeleton]
livewire: false
status: ready
laws: [fittss-law, law-of-common-region, law-of-similarity, occams-razor]
---

# Table

The one data table: a semantic `<table>` with controlled sorting, a checkbox column with a bulk
bar, custom cells, a row-actions column, Skeleton rows while loading and an empty state. Below
48rem of its own width every row becomes a card that shows each value under its column label.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Table.phone.css`, `Table.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Button`, `Icon`, `Skeleton` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Table.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `columns` | `TableColumn[]` | required | `{ key, label, sortable?, align?: 'start' \| 'end', width?, hideOnPhone? }`; `width` is any CSS length, set inline on the header cell |
| `rows` | `Row[]` | required | the visible page; the table never sorts, filters or pages itself |
| `rowKey` | `keyof Row \| (row) => string \| number` | required | the identity used for `selected` and the `v-for` key |
| `sort` | `TableSort \| null` | `null` | `{ key, direction: 'asc' \| 'desc' }`; use `v-model:sort` |
| `selectable` | `boolean` | `false` | adds the checkbox column |
| `selected` | `(string \| number)[]` | `[]` | row keys; use `v-model:selected`; keys of rows on other pages are kept |
| `loading` | `boolean` | `false` | `loadingRows` Skeleton rows instead of the rows, `aria-busy` on the table |
| `loadingRows` | `number` | `5` | placeholder rows while loading; a list passes its page size, so the space the rows will take is held |
| `caption` | `string` | none | visually hidden caption, read by assistive technology |
| `stickyHeader` | `boolean` | `false` | the header sticks to the nearest scrolling ancestor (the page), at `--ui-sticky-top`: below the shell's top bar |
| `frameless` | `boolean` | `false` | no border and radius of its own, for a Table inside `<Card flush>` |

`TableColumn`, `TableSort` and `TableKey` are exported from `Table.vue`; a list config imports
them with `import type { TableColumn } from '@/ui/Table/Table.vue'`.

## Slots

| Slot | Scope | Content |
|------|-------|---------|
| `cell-<key>` | `{ row, value }` | a custom cell for the column `<key>`, e.g. `#cell-status`; default is the value as text |
| `actions` | `{ row }` | the last column, for a row menu; its header is "Actions" for assistive technology |
| `bulk` | `{ selected }` | bulk action buttons in the bar above the table; the bar shows only while `selected` is not empty |
| `empty` | | replaces the muted, centred "No results" |

The bulk bar always shows the "{n} selected" count and a Clear button; the `bulk` slot adds the
actions at its end.

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:sort` | `TableSort` | a sortable header is clicked: a new column starts `asc`, the sorted one flips `asc` and `desc` |
| `update:selected` | `(string \| number)[]` | a row checkbox, the header checkbox (all visible rows) or Clear |
| `row-click` | `Row` | a row is clicked, or focused and Enter is pressed |

`row-click` is declared as the `onRowClick` prop, so binding `@row-click` is what makes rows show
a pointer, become focusable and answer Enter. Without a listener rows are plain. Enter on a row
is consumed (its default is prevented), so the same key press does not go on to what the handler
opens: a drawer whose first button is Close would otherwise close again at once. A held Enter
opens the row once (its repeats are ignored); Enter on a control inside the row stays the control's.

Exposed through a template ref: `toggleAll()`, `allChosen` and `someChosen`, what the header
checkbox runs on, for a Select all of the page's own in card mode.

## Agent

Every header is a column header with `aria-sort` on the sorted one; sortable headers are buttons
named by their label. Row checkboxes are named "Select <first column value>", so the first column
should identify the row (name, number). Bulk action buttons in the `bulk` slot carry
`data-action` like any mutating Button (D23).

## Gotchas

- The phone layout is a container query on the table's own width, not a media query: a Table in
  a drawer or a narrow column becomes cards too. Its rules live in `Table.phone.css`, copied along.
- Inside a flex row the Table needs a width (`flex: 1` or `width: 100%`): container queries make
  its content not size it.
- `stickyHeader` and the table's own sideways scrolling exclude each other: a scroll box would
  capture the sticky header, so with `stickyHeader` a table wider than its box overflows it and
  the page scrolls sideways instead. Hide columns rather than combine the two.
- In card mode the header row is hidden, from assistive technology too: each cell names its column
  as generated text (`td[data-label]::before`), which the header would announce a second time, and
  its sort buttons and checkbox would be invisible tab stops. So in card mode sort and select-all
  come from outside: `SearchTable` shows a sort row; a Table used without it gets a sort control
  and a Select all (from the exposed `toggleAll`, `allChosen`, `someChosen`) from its page.
- Header cells, sort buttons and checkbox cells keep 44 px on every pointer, so compact density
  does not shrink a selectable table's rows.
- A sticky header stops at `--ui-sticky-top`: 0 outside a shell, the top bar's height inside
  `AppShell`, so it sits below the shell's top bar instead of under it. The token inherits: a
  scroll box that is not the page sets it on itself, `0px` or minus its top padding (`Dialog`,
  `Sheet` and so `DetailDrawer` do), else the header sticks the bar's height below the box's top,
  or stops at its padding edge, with rows showing in the band above it.
- Clicks on controls inside a row (links, buttons, inputs, the checkbox and actions cells) do not
  fire `row-click`; this uses a target check, not `stopPropagation`.
- The rows carry explicit ARIA table roles because `display: grid` on table parts drops the table
  semantics in Safari.
- From a livewire read pass `!error && loading`, so a failed read shows its error instead of
  shimmering forever.
- The placeholder rows, their row lines (table) or card frames (cards) and the Skeletons in them
  show after `--ui-loading-delay`, their space held from the start: a faster read shows the
  header over an empty framed box, or empty space in card mode, then the rows in it. The row lines
  wait through their colour, because collapsed borders are painted by the table, not the cells. A placeholder row has a data row's cells, the select cell 44 px and
  the actions cell a control's height, so it is as tall as a data row of plain text; a custom cell
  taller than a line (a Badge) makes the data row a few pixels taller.
