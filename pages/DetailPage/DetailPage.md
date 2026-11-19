---
name: DetailPage
tier: page
intent: [detail page, record page, entity page, customer page, view and edit, inline edit, status lifecycle, related records, not found page]
uses: [Page, PageHeader, Badge, Banner, Button, Card, Dialog, EmptyState, Field, Icon, Input, Table, Toast, agent, format, DetailForm, LiveForm, WorkflowStatus, SearchTable]
livewire: true
status: ready
laws: [chunking, pareto-principle]
---

# DetailPage

One record (D33), written for a customer: the header with the back link, the status Badge, the
"customer since" line and Delete; the record's fields as an inline edit form that saves only the
touched fields; the status lifecycle with its allowed transitions; the customer's recent orders
with a link to the full list. Not found, refused and stale are handled once for the whole page.
Width `page`: form and status side by side (stacked below about 50rem), the related list below
at full width.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `DetailPage.vue`, `actions.ts`, `messages.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Page`, `PageHeader`, `Badge`, `Banner`, `Button`, `Card`, `Dialog`, `EmptyState`, `Field`, `Icon`, `Input`, `Table`, `Toast`, `agent`, `format`, `DetailForm`, `LiveForm`, `WorkflowStatus`, `SearchTable` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| the cards of its blocks, `patterns/` guide named below, the laws in `laws` | when composing | shape, reasons, review questions |

Do not load:

| Skip | Why |
|------|-----|
| `DetailPage.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Files

| File | What |
|------|------|
| `DetailPage.vue` | the page; `id` comes in as a prop (the route passes params as props) |
| `actions.ts` | `updateCustomer`, `deleteCustomer` as `AgentAction`s (D48) |
| `messages.ts` | every string under `customers.detail` (en, de), mounted by `useI18n({ useScope: 'global', messages })` |

## When copying

`ui-copy` puts the folder into `src/pages/<Area>/`. Then:

1. Rename `customers` to the entity: `data-page="customers.detail"`, the message keys
   `customers.detail.*`, the route names `customers.list`, `customers.detail` and `orders.list`.
2. Rewrite the descriptor import: the line under `// In a project:` replaces the `@/fake/api`
   line (`ui-copy` does it).
3. Edit `pick` (the fields the form edits) and the Fields in the form's slot; every field the
   update call validates gets a Field, else its error has nowhere to show.
4. Edit the lifecycle: `states`, `allowed` (the transitions per state) and which of them ask
   first (`confirm`). Better still, one call per transition where the API has them (D33).
5. Edit the related list: the read, its filter (`customerId eq id`), columns and cells.
6. One `messages.ts` and one `actions.ts` per folder: next to a `ListPage` of the same area,
   merge these into its files.
7. Add the route with `props: true`: `{ name: 'customers.detail', path: '/customers/:id',
   component: DetailPage, props: true, meta: { page: 'customers.detail', title, intent } }`.

## Data flow

- `useLiveForm({ target: live['customers.item'], params: () => ({ id }), call:
  calls.updateCustomer, pick })` is the only read of the record; the header, the workflow and
  the form all show its `item`. Another `id` (a route change) refills every field.
- The status is not a form field: it moves through `WorkflowStatus`, whose transitions call
  `updateCustomer` with `{ status }`; "Mark as churned" asks first. The push moves `current` and
  refills the form's untouched fields.
- The orders card is a `SearchTable` in cursor mode (orders have no total) on `live.orders`
  filtered by `customerId`, newest first, five per page. "All orders" links to
  `orders.list?customerId=<id>`, which an orders `ListPage` with a `customerId` facet reads.
- Delete calls `deleteCustomer`, toasts, resets the form and goes back to the list. A page that
  leaves on purpose after it discarded the record resets the form first, else the leave guard of
  `useLiveForm` asks about edits to a record that is gone (D96).

## States

| State | Shows |
|-------|-------|
| loading | header "Customer", DetailForm's skeleton; workflow and orders wait for the record |
| `not_found` | EmptyState "This customer does not exist" with a link back to the list |
| any other refusal | one danger Banner (`forbidden` as `ui.forbidden`) with Retry, nothing else |
| stale | the record stays, an info Banner `ui.stale` above it |
| a save refused | DetailForm shows the field errors at the Fields |

One failure, one retry: a refused record read replaces the body, so the orders read never runs
next to it. A refused orders read shows inside its card only.

## Agent

`data-page="customers.detail"`. Save is `type="submit"` with `data-action="updateCustomer"`
(DetailForm); every transition carries `data-transition="<status>"` and either itself or its
confirm button `data-action="updateCustomer"`; Delete and its confirm carry
`data-action="deleteCustomer"`. Fields are named after the API fields. `actions.ts` declares
both calls for the record on screen; the page binds them with `useAgentAction`.

## Gotchas

- With no status history read, the page passes `history: []`: no state is marked done. Pass the
  real history when the API has one.
- The orders `SearchTable` shows its own stale line under the page's stale Banner while the
  socket is down.
- Width `page`, not `content`: a `Table` below 48rem of its own width shows its rows as cards,
  and a card inside a 48rem column is always below that. A detail page without a related list
  can take `content`.
- The back link and "All orders" need the `customers.list` and `orders.list` routes; without
  them the router throws while resolving the link.
