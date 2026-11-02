---
name: ui-page
description: Build a new page in a project set up with govengers/ui - pick the recipe (ListPage, DetailPage, SettingsPage, LoginPage, Dashboard), copy what is missing, compose blocks, wire livewire descriptors, set data-page and data-action, write the page's messages.ts and route, register agent actions, run ui-lint and look at it light, dark and on a phone width. Use on "add a page", "build the customers list", "create the settings screen", "new screen for X", "ui-page".
---

# ui-page

One page, one recipe, one look (D12, D23, D32). Every page of the product goes through this.

## Inputs

- The page: `<area>.<page>` (for example `customers.list`), what it shows, which livewire
  descriptors exist for it (`src/api/api.ts`: `reads`, `live`, `calls`, `uploads`).
- `DESIGN.md` and `src/ui/INDEX.md` of the project: read both before anything else.

## Steps

1. **Pick the recipe.** `ListPage` (entities with filter, sort, paging, bulk actions, detail
   drawer), `DetailPage` (one entity: header, cards, inline edit, related lists), `SettingsPage`
   (index of cards or a form per section), `LoginPage`, `Dashboard` (tiles, charts, recent
   lists). Read the recipe's card in `<source>/pages/<Recipe>/<Recipe>.md`. No recipe fits: write
   the exception in `DESIGN.md` under "Exceptions" (page, why, which recipe it is closest to)
   BEFORE building, then build it from the closest recipe.
2. **Copy what is missing** with `ui-copy` (the recipe and its blocks).
3. **Create the files** under `src/pages/<Area>/`:
   - `<Page>.vue` from the recipe: root `<Page data-page="<area>.<page>">`, `PageHeader` first,
     one primary action at most, every mutating `Button` with `data-action="<call name>"`, every
     form field with `name`.
   - for a list: `<entity>.list.ts` with columns, facets, tabs, row actions and bulk actions
     (D32); the page passes it to the blocks.
   - `messages.ts` for the folder, mounted by path (`t('customers.list.title')`); no shared
     locale file (D21).
   - the route in the router: named, typed params, `meta: { title, intent, page: '<area>.<page>' }`
     so `app-map.json` can list it (D24).
4. **Wire livewire** through props: pass `live.customers` (a `LiveTarget`) to `SearchTable`,
   `calls.updateCustomer` to `DetailForm`, and so on. Never fetch in the page yourself.
5. **States.** Loading is `!error && loading`; a refused subscription shows the error, not the
   skeleton. Live errors carry no HTTP status: branch on `error.code` (`not_found`,
   `forbidden`). A page with several subscriptions exposes one failure and one retry. Own writes
   need no local upsert; the push renders them.
6. **Agent surface.** Register the page's mutating actions with `useAgentAction` (block tier,
   `src/ui/blocks/agent/`): name = the livewire call name, a one-sentence description, the
   params schema. Pages that only read register nothing.
7. **Verify.** `just ui-lint` and `vue-tsc --noEmit` clean. Open the page in the browser (the
   `run` skill or Playwright): light, dark, 1280 px and 390 px wide. Tab through it once: every
   control reachable, focus visible, Escape closes overlays. Compare it with the previous page of
   the product: same header height, same card radius, same button sizes; a difference is a
   defect in this page, not a style.
8. **Report**: the route, the recipe (or exception), the descriptors used, the actions
   registered, screenshots looked at.

## Do not

- Do not write CSS that a token or a layout component already provides. A `<style>` block in a
  page holds grid and gap at most, with tokens only (`ui-lint` enforces hex, px, font-family).
- Do not invent a new component in the page. Need one: copy from govengers/ui, else write it in
  `src/ui/<Name>/` in the same style and add it to `src/ui/INDEX.md`.
- Do not hard-code a user-facing string outside `messages.ts`.
