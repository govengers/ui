---
name: Tabs
tier: primitive
intent: [tabs, tab list, counted tabs, list tabs, segmented navigation, sub navigation, CountedTabs]
uses: [Badge]
livewire: false
status: ready
laws: [law-of-similarity, law-of-uniform-connectedness, working-memory]
---

# Tabs

A row of tabs with an accent underline on the active one and an optional count per tab. Plain
items make a keyboard-operable tab list; items with `to` make a nav of router links, the counted
tabs of a list page.

## Load

| Read | When | Why |
|------|------|-----|
| this card | always | the contract |
| `Tabs.vue` | to use it: skim; to change it: read | the behaviour |
| the cards of `Badge` | when their props show up here | what the composed pieces do |
| `ui/tokens.css` | only when changing the look | the tokens it reads |

Do not load:

| Skip | Why |
|------|-----|
| `Tabs.demo.vue`, `*.test.ts` | demo and tests are not copied and not needed to use it |
| other pieces | one piece per need |


## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `items` | `TabItem[]` | required | `{ value, label, count?, to?, disabled? }`; all items carry `to` or none do |
| `modelValue` | `string` | none | the active `value`, in both forms |
| `size` | `sm \| md` | `md` | |
| `label` | `string` | none | `aria-label` of the tab list or nav; set it when a page has more than one |

`TabItem` is exported from `Tabs.vue`. `count` renders as a small pill Badge after the label,
`accent` on the active tab, `neutral` on the others.

## Events

| Event | Payload | When |
|-------|---------|------|
| `update:modelValue` | `string` | a tab of the tab list is clicked or reached by arrow, Home or End |

## Agent

The tab list form is `role="tablist"` with `role="tab"` buttons and `aria-selected`; the routed
form is a `nav` of links with `aria-current="page"` on the active one. Either way the agent finds a
tab by its label and the count is part of its name ("Open 12").

## Gotchas

- Panels are not part of this component: the page renders the content for `modelValue` right
  below the tabs. `aria-controls` is optional in the tab pattern and left out here, since the panel
  belongs to the page.
- In the routed form `modelValue` decides the active tab, not the router: vue-router ignores the
  query when it marks links active, so `?status=open` and `?status=closed` would both count as the
  current route. Derive `modelValue` from the route on the page; the routed form never emits.
- Keyboard in the tab list: Tab enters at the active tab (or the first enabled one when none
  is active), ArrowLeft and ArrowRight move and select with wrap-around, Home and End jump to the
  ends, disabled tabs are skipped.
- A disabled routed item is an `a` without `href`: shown, not focusable, not followed.
- Tabs wider than their box scroll sideways inside the strip (in a `PageHeader` too). The active
  tab is scrolled into the strip on mount and whenever `modelValue` changes; a change of the items
  (counts that arrive later widen the tabs, also when changed in place) or of the strip's size (a
  rotation, a narrower window) places it again unless the user has scrolled the strip since the
  active tab last changed: a wheel, a swipe, a press on the strip itself (its scrollbar), or the
  arrow, Home and End keys in a nav of links. A tap on a tab or the Tab key is no scroll. Only the
  strip scrolls, never the page. Nothing but the tab cut at the edge shows that more follow.
