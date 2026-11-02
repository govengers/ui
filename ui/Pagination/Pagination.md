---
name: Pagination
tier: primitive
intent: [pagination, pager, page size, rows per page, next page, previous page, cursor pagination, load more]
uses: [Button, Icon]
livewire: false
status: ready
laws: [choice-overload]
---

# Pagination

The one pager under a list. Offset mode shows the range, a rows-per-page select and first,
previous, next and last; cursor mode shows only previous and next, for lists without a total.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Pagination.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Button`, `Icon` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Pagination.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `mode` | `offset \| cursor` | `offset` | |
| `page` | `number` | `1` | offset: 1-based; use `v-model:page` |
| `pageSize` | `number` | `25` | offset: use `v-model:page-size` |
| `total` | `number` | `0` | offset: the number of rows in the whole list |
| `pageSizes` | `number[]` | `[25, 50, 100]` | offset: the select's options; a `pageSize` not in the list is added |
| `hasPrevious`, `hasNext` | `boolean` | `false` | cursor: disable the arrows at the ends |
| `label` | `string` | none | cursor: text on the left, e.g. "25 of many" |

## Slots

None.

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:page` | `number` | offset: a page button, or after a page size change |
| `update:pageSize` | `number` | offset: the rows-per-page select changed |
| `previous`, `next` | none | cursor: the arrows |

A page size change emits `update:pageSize` and then `update:page` with the page that still shows
the first row that was visible, so the list never lands past its end.

## Agent

The root is `<nav aria-label="Pagination">`; the buttons are named First, Previous, Next and
Last, the select "Rows per page". Paging is navigation, not a mutation: no `data-action`.

## Gotchas

- The page owns the data: Pagination never fetches. With livewire, put `page` and `pageSize` in
  the read's params and the URL query, so a reload and the agent land on the same page.
- `total` of `0` shows "0-0 of 0" and disables every arrow; show the Table's empty state above it.
- In cursor mode `page`, `pageSize` and `total` are ignored.
