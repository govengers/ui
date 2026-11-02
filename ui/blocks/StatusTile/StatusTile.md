---
name: StatusTile
tier: block
intent: [status tile, dashboard tile, kpi, metric, stat card, number card, lamp, delta, trend]
uses: [Card, Icon, Skeleton, format]
livewire: false
status: ready
laws: []
---

# StatusTile

One number on a dashboard (D34): a label, the value with its unit, the change against the period
before (arrow and tone), a lamp for its state, and room for a sentence or a sparkline. With `to`
the whole tile is a link card. It reads nothing itself: the page passes values, live or static.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `StatusTile.vue`, `tile.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Card`, `Icon`, `Skeleton`, `format` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `StatusTile.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `label` | `string` | required | |
| `value` | `string \| number` | required | a number is formatted with the app locale; a string is shown as is (pre-formatted money, `-`) |
| `unit` | `string` | none | after the value, smaller |
| `delta` | `number` | none | the change in percent: `12.5` shows +12.5 %, `0` is neutral |
| `invert` | `boolean` | `false` | a rise is bad (errors, churn): up turns danger, down success |
| `state` | `ok \| warning \| danger \| neutral` | none | the lamp before the label |
| `stateLabel` | `string` | none | names the lamp for assistive technology |
| `to` | `RouteLocationRaw` | none | the tile becomes a link card |
| `loading` | `boolean` | `false` | a skeleton instead of the value and delta |

## Slots

| Slot | Content |
|------|---------|
| default | a sentence or a sparkline under the value |

## With livewire

The page reads and the tile shows: pass `loading` from the read's `loading` and the value from
its data (a count is the `total` of a one-row `useLiveList`), and say a refusal in the slot.

```ts
const active = useLiveList(live.customers, { filter: { where: { field: 'status', op: 'eq', value: 'active' } }, limit: 1 })
```
```vue
<StatusTile label="Active customers" :value="active.total.value ?? 0" :loading="active.loading.value" />
```

## Agent

A linked tile is one link whose name is all its text. The delta's arrow is decorative; the
signed number carries the direction. The lamp is an image named `stateLabel`, else hidden.

## Gotchas

- Colour alone never carries the state: give `stateLabel`, or say it in the label or the slot.
- `delta` is percent, not a fraction: pass `12.5`, not `0.125`.
- A tile with `to` is a link: no buttons inside it.
