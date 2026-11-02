---
name: FacetFilter
tier: block
intent: [facet filter, filter, filters, filter chips, filter bar, add filter, faceted search, live counts, filter panel, checkbox filter, FacetPanel, url filter]
uses: [Popover, Button, Icon, Badge, Input, Checkbox, Field]
livewire: true
status: ready
laws: [choice-overload, hicks-law, law-of-common-region, teslers-law, working-memory, zeigarnik-effect]
---

# FacetFilter

The list filter (D31): a "Filters" button with a count opens a cascade, the facets on the left, the
values of the active facet on the right with a live count each. Every facet with ticked values
becomes one chip ("Status is active, on hold, or 2 more"); the chip's operator switches between
"is" and "is not", its values reopen the cascade inside that facet, its cross drops the facet.
"Add filter" and Clear end the bar. `FacetPanel.vue` in the same directory shows the short facets
as checkbox lists. OR inside a facet, AND across facets.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `FacetCascade.vue`, `FacetFilter.vue`, `FacetPanel.vue`, `facets.ts`, `useFacetValues.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Popover`, `Button`, `Icon`, `Badge`, `Input`, `Checkbox`, `Field` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `FacetFilter.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `facets` | `FacetDefinition[]` | required | read once at setup; key the block to change them |
| `modelValue` | `FacetClause[]` | required | v-model; the ticked values per facet |
| `distinct` | a distinct read | none | the resource's `live['<resource>.distinct']`; one subscription per facet |
| `facetsRead` | a facets read | none | one read answering `{ [key]: DistinctValue[] }`; wins over `distinct` |
| `baseFilter` | `FilterDocument` | none | a tab's or page's fixed clauses, ANDed into the counts, never a chip |
| `search` | `string` | none | the page's search text, merged into the counts |
| `syncQuery` | `boolean` | `false` | reads and writes `?status=active,onHold`, `?tags.not=trial` (vue-router, replace) |

`FacetDefinition` (from `facets.ts`): `key` (the field), `label`, `short` (a panel facet, no value
search in the cascade), `values` (a fixed enumeration `{ value, label }[]` in display order; else
the values come from the counts read), `labelOf(value)` (an id to a name), `array` (a list field:
"is" becomes `hasAny`, "is not" `not hasAny`). `FacetClause`: `{ key, values, negate? }`.

`facets.ts` also exports what a page needs around the block: `toFilterDocument(clauses, { base,
search, facets })` (the list's filter document), `documentWithout(clauses, key, options)`,
`chipText(facet, clause, t, locale)`, `toQuery(clauses)`, `fromQuery(query, facets)`,
`withQuery(query, clauses, facets)`.

`FacetPanel` takes the same props except `syncQuery` and the same v-model; it renders only the
facets with `short`, and its Clear removes only those.

## Slots

None.

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:modelValue` | `FacetClause[]` | a value ticked, a chip toggled, removed, Clear, or the URL changed with `syncQuery` |

## Exposes

`open(key)`: opens the cascade inside a facet (a demo, a keyboard shortcut, the agent).

## With livewire

The block never builds the list's filter; the page does, from the same clauses:

```ts
const clauses = ref<FacetClause[]>([])
const list = useLiveList(live.customers, { limit: 25 })
watchEffect(() => { list.filter.value = toFilterDocument(clauses.value, { facets, base, search: search.value }) as CustomersFilter })
```

```vue
<FacetFilter v-model="clauses" :facets="facets" :distinct="live['customers.distinct']" :base-filter="base" :search="search" sync-query />
```

- `distinct`: one live distinct read per facet, each under the document without that facet's own
  clauses, so a count shows what ticking the value would yield (D31). A facet with `array` gets no
  read: livewire's distinct refuses list fields; give it `values`, it shows no counts.
- `facetsRead`: one subscription under the whole document; the server counts each facet without
  its own clauses (the demo's `live.customerFacets`). Use it when the app declares one.
- The cast to the generated filter type is the page's: the block knows fields only as strings.

## Agent

The button is `data-action="filter"`; every chip carries `data-facet="<key>"`; in the cascade
every facet carries `data-facet` and every value `data-value`, values are `menuitemcheckbox` with
`aria-checked`. The chip's values button is named by the whole sentence ("Status is active or on
hold"). Clauses are plain data: an agent sets the v-model or the URL query instead of clicking.

## Gotchas

- Value order never moves: a fixed enumeration keeps its order, read values sort by label, and a
  value once seen stays listed at 0 (dimmed) while the counts change.
- Without `values`, a distinct read names only values with rows under the other facets, so a value
  appears once a count names it. Give short facets (the panel's) their `values`; a facets read
  that answers zero counts (like `customerFacets`) lists everything from the start.
- Every facet subscribes for as long as the block lives (counts are ready on open). A FacetPanel
  next to a FacetFilter subscribes again; use `facetsRead` when that matters.
- Keyboard: Up and Down inside a column, Right (or Enter, Space) into the values, Left back, Space
  ticks, Escape closes, Tab closes and moves on from the trigger.
- With `syncQuery` the URL wins on load when it names a facet; a URL without one means the
  initial v-model, which is written only once the user changes it (so several blocks syncing one
  URL never race on load). The search text is the page's to sync.
- The chip reads "or" between values (`Intl.ListFormat` disjunction), which is what OR inside a
  facet means.
