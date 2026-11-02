---
name: RangePicker
tier: block
intent: [time range, date range, range picker, time filter, last 7 days, quick ranges, from to, grafana time picker, created between]
uses: [Popover, Button, Icon, Field, Input]
livewire: false
status: ready
laws: []
---

# RangePicker

A Grafana-style time range: a button showing the range ("Any time", "Last 7 days", "Today",
"02.11.26, 10:00 - 02.11.26, 12:00") opens quick ranges (any time; last 5 minutes to last 90
days; today, yesterday, this week, this month) and an absolute form with two native date-time
inputs. The value is livewire time
values, so a page ANDs `rangeToConditions(field, range)` straight into its filter.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `RangePicker.vue`, `range.ts` | to use it: skim; to change it: read | the behaviour |
| the cards of `Popover`, `Button`, `Icon`, `Field`, `Input` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |
| `@/api/runtime`, `@/api/vue` types named under "With livewire" | when wiring it | the descriptor props |

Do not load:

| Skip | Why |
|------|-----|
| `RangePicker.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `modelValue` | `TimeRange` | required | v-model |
| `syncQuery` | `boolean` | `false` | reads and writes `?t=-7d`, `?t=today`, `?t=<from>..<to>`; any time removes `t` (vue-router, replace) |

`TimeRange` (from `range.ts`): `{ from: TimeValue; to: TimeValue; calendar? }`. A `TimeValue` is
an RFC 3339 string, livewire's `{ relative: '-7d' }` (s, m, h, d, w), or `''` for now, which is no
bound. `{ from: '', to: '' }` is any time (exported as `anyTime`): no conditions, no `t`, the
usual default of a list. `calendar` (`today`, `yesterday`, `thisWeek`, `thisMonth`) marks a calendar range, so its
label and URL stay "today" while `from` and `to` hold the instants computed when it was chosen.

`range.ts` also exports `rangeToConditions(field, range)`, `labelOf(range, t, locale)`,
`anyTime`, `isAnyTime(range)`, `relativeRange('-7d')`, `calendarRange(key)`, `toQuery(range)`
(`''` for any time) and `fromQuery(text)` (undefined without a `t`).

## Slots

None.

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:modelValue` | `TimeRange` | a quick range chosen, the form applied, or `?t=` changed with `syncQuery` |

## Exposes

`open()`: opens the picker (a demo, a keyboard shortcut).

## With livewire

The picker reads nothing; its value goes into the list's filter:

```ts
const range = ref<TimeRange>({ ...anyTime })
watchEffect(() => {
  list.filter.value = { where: { and: [...rangeToConditions('createdAt', range.value), ...facetConditions] } } as OrdersFilter
})
```

`rangeToConditions` returns `field >= from` and `field <= to`; a side that is now is left out,
so any time yields no condition at all.
A relative `from` stays relative on the wire: the server re-runs the read on its safety tick, so
"last 15 minutes" keeps moving.

## Agent

The trigger's name is "Time range: Last 7 days". Quick ranges are `menuitemradio` with
`aria-checked` and `data-range` (`any`, `-7d`, `today`); the form's inputs are named `from` and `to`.
An agent can set the v-model or `?t=` instead of clicking.

## Gotchas

- Livewire has no "start of day": today, yesterday, this week (Monday) and this month are
  instants computed when chosen, so a list left open past midnight keeps yesterday's start until
  the range is chosen again or the page reloads with `?t=today`.
- The form edits local time (datetime-local) and emits UTC instants; an empty "To" is now.
- With `syncQuery` the URL wins on load when it has `t`; without it the initial v-model holds and
  is written only once the user picks a range. Any time is no `t`, so with a default other than
  `anyTime` a reload after choosing any time comes back with the default; make `anyTime` the
  default of a synced list.
- Keyboard: arrows, Home and End move between the quick ranges, Tab moves into the form, Escape
  closes and focus returns to the trigger.
