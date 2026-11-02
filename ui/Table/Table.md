---
name: Table
tier: primitive
intent: [table, data table, list, sortable columns, row selection, bulk actions, row actions, responsive table, cards on phone, loading rows, empty state]
uses: [Button, Icon]
livewire: false
status: ready
---

# Table

The one data table: a semantic `<table>` with controlled sorting, a checkbox column with a bulk
bar, custom cells, a row-actions column, loading rows and an empty state. Below 48rem of its own
width every row becomes a card that shows each value under its column label.

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `columns` | `TableColumn[]` | required | `{ key, label, sortable?, align?: 'start' \| 'end', width?, hideOnPhone? }`; `width` is any CSS length, set inline on the header cell |
| `rows` | `Row[]` | required | the visible page; the table never sorts, filters or pages itself |
| `rowKey` | `keyof Row \| (row) => string \| number` | required | the identity used for `selected` and the `v-for` key |
| `sort` | `TableSort \| null` | `null` | `{ key, direction: 'asc' \| 'desc' }`; use `v-model:sort` |
| `selectable` | `boolean` | `false` | adds the checkbox column |
| `selected` | `(string \| number)[]` | `[]` | row keys; use `v-model:selected`; keys of rows on other pages are kept |
| `loading` | `boolean` | `false` | five shimmer rows instead of the rows, `aria-busy` on the table |
| `caption` | `string` | none | visually hidden caption, read by assistive technology |
| `stickyHeader` | `boolean` | `false` | the header sticks to the top of the nearest scrolling ancestor (the page) |
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
a pointer, become focusable and answer Enter. Without a listener rows are plain.

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
- On phones the header row is hidden visually, so sorting and select-all are not visible there;
  give the list toolbar a sort control if phones need one.
- Clicks on controls inside a row (links, buttons, inputs, the checkbox and actions cells) do not
  fire `row-click`; this uses a target check, not `stopPropagation`.
- The rows carry explicit ARIA table roles because `display: grid` on table parts drops the table
  semantics in Safari.
- From a livewire read pass `!error && loading`, so a failed read shows its error instead of
  shimmering forever.
