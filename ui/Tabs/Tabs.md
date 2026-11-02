---
name: Tabs
tier: primitive
intent: [tabs, tab list, counted tabs, list tabs, segmented navigation, sub navigation, CountedTabs]
uses: [Badge]
livewire: false
status: ready
---

# Tabs

A row of tabs with an accent underline on the active one and an optional count per tab. Plain
items make a keyboard-operable tab list; items with `to` make a nav of router links, the counted
tabs of a list page.

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
