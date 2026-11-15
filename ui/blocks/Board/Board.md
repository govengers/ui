---
name: Board
tier: block
intent: [kanban board, task board, board with columns, drag and drop cards, move card, reorder cards, swimlane, work in progress limit, status columns, trello board]
uses: [Badge, Banner, Button, Icon, Menu, Skeleton]
livewire: true
status: ready
laws: [jakobs-law, law-of-common-region, fittss-law, doherty-threshold]
---

# Board

A kanban board over ONE board-wide livewire list read: columns and their order are computed on
the client from a column field and a numeric rank field. Cards move by pointer drag (mouse and
pen anywhere on the card, touch on the grip so the board still scrolls), by keyboard on the grip
(Space lifts, arrows move, Space drops, Escape cancels) and by the card menu ("Move to <column>",
up, down). A move calls the page's move mutation with the moved card as the optimistic item.
Column headers count their cards against an optional limit; empty, loading, refused, stale and
cut states are built in; on phones each column takes most of the screen and swipes sideways.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Board.vue`, `board.ts`, `drag.ts` | to use it: skim; to change it: read | wiring, model, pointer drag |
| the cards of `Badge`, `Banner`, `Button`, `Icon`, `Menu`, `Skeleton` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `Board.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `target` | `LiveTarget<Query, ListResponse<Item>>` | required | the board-wide list read, e.g. `live.tasks`; `Item` needs an `id` |
| `filter` | `Query['filter'] \| undefined` | none | e.g. the cards of one board; read once |
| `sort` | `Query['sort'] \| undefined` | none | rank first (`['position']`) so a cut list keeps the top cards; read once |
| `limit` | `number` | `100` | cards loaded at most; the server clamps it to the resource's MaximumLimit; more cards show "Showing n of m cards" |
| `columns` | `BoardColumn[]` | required | `{ key, label, limit? }`; `key` is the value of the column field; cards of other values are not shown |
| `columnField` | `keyof Item & string` | required | e.g. `status` |
| `rankField` | `keyof Item & string` | required | a number, e.g. `position`; ties order by id |
| `itemLabel` | `(item) => string` | required | the card's name in menus and announcements |
| `move` | `MutationTarget<Params, Body, Item>` | required | e.g. `calls.moveTask`; must answer the moved item and carry an `upserts` effect on the read's resource |
| `moveArgs` | `(item, placement) => { parameters, body }` | required | maps a `Placement` (`column`, `index`, `before`, `after`, `rank`) to the call |
| `cardActions` | `(item) => MenuItem[]` | none | more items in the card menu, under the move items |
| `label` | `string \| undefined` | none | the board's accessible name |

## Slots

| Slot | Scope | Content |
|------|-------|---------|
| `card` | `{ item, column }` | the card's body (default: `itemLabel`); rendered twice while dragging (the ghost) |
| `column-actions` | `{ column }` | the header's end: an add button, a column menu |
| `empty` | `{ column }` | a column without cards (default `ui.noCards`) |

## Events

| Event | Payload | When |
|-------|---------|------|
| `moved` | `(item, placement)` | the move mutation answered |
| `move-error` | `(error, item)` | it was refused; the runtime already took the optimistic card back |

## With livewire

One `useLiveList(target, { filter, sort, limit })` for the whole board, grouped and ordered here.
Never subscribe per column: the runtime upserts an optimistic item into every live list of its
resource whatever their filter, so a per-column list would flash a moved card in every column.
A move runs `connection.call(move, parameters, body, { optimistic })` where the optimistic item
is the card with the new column and rank; the push replaces it. Other people's moves arrive as
pushes and re-render the columns.

The rank is the midpoint between the new neighbours, or 1024 past an end (`board.ts`
`rankBetween`). The server stores what it gets and should renumber a column when two
neighbours come closer than about 1e-6; `before` and `after` are in the placement for a server
that computes ranks itself.

## Agent

Every card menu item carries `data-action` = the move mutation's name; the menu is named
"Actions for <card>". Grips are buttons named "Move <card>" with the keyboard help as their
description. Each card is `[data-board-card="<id>"]`, each column `[data-board-column="<key>"]`.
Moves and their outcome are announced in an assertive live region.

## Gotchas

- Cards select no text (`user-select: none`), so a mouse drag never starts a selection; links and
  buttons inside a card do not start a drag.
- A pointer drag hides the original card (`data-origin`) instead of unmounting it: touch keeps
  its implicit capture on the element the finger went down on.
- Auto-scroll runs only while the pointer moves near the board's left or right edge.
- `filter`, `sort` and `limit` are read at mount; key the component to change them.
- `columnField` values must be the column `key`s; a card whose value has no column is invisible.
