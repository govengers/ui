---
name: Pareto Principle
category: principle
summary: A few causes produce most of the effects, so put the effort where most users are
applies: [ListPage, DetailPage, SettingsPage, Dashboard, LoginPage]
---

# Pareto Principle

> The Pareto principle states that, for many events, roughly 80% of the effects come from 20% of
> the causes. (Jon Yablonski, Laws of UX)

A typical business application is mostly lists, detail pages, forms and settings. Getting those
few shapes right serves most screens and most users; exotic screens are the exception and should
stay visibly so.

## In this collection

- Five page recipes cover the typical business application (D8): ListPage, DetailPage,
  SettingsPage, LoginPage, Dashboard.
- The list page is the most common page (`patterns/building-a-list-page.md`), so its recipe
  carries the full kit: tabs, search, facets, range, columns, bulk, row menu, drawer (D32).
- A new list costs one config file per entity (`customers.list.ts`: columns, facets, tabs,
  actions).
- A page outside the recipes needs a written exception in the project's `DESIGN.md` (D12), so
  exceptions stay visible and rare.

## Review questions

- Is this page one of the recipes, and if not, is the exception written down?
- Does the page's effort go to the tasks most users do most often?

## Source

https://lawsofux.com/pareto-principle/
