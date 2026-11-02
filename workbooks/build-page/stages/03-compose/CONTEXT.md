# Stage 03: compose

## Input
The recipe copied under `src/pages/<Recipe>/`; the descriptors; the blocks' cards; the laws
the recipe's card names.

## Process
1. Move and rename: `src/pages/<Area>/<Page>.vue` from the recipe file; `data-page="<area>.<page>"`
   on the `Page` root; `PageHeader` first with one `variant="primary"` action at most (Hick's
   Law, DESIGN.md rule 4).
2. Entity config: a list gets `<entity>.list.ts` (columns, facets, tabs, row and bulk actions,
   D32); a detail or settings page gets its field list in the page. Facet keys never collide
   with `search`, `sort`, `page`, `item`, `t` (the URL keys the blocks own).
3. Wire livewire through props only: `target`, `call`, `upload` descriptors from `@/api/api`;
   never fetch in the page.
4. `messages.ts` in the page folder, mounted with `useI18n({ useScope: 'global', messages })`
   (the convention on every recipe card); no hard-coded user-facing string.
5. The route: named, typed params as props, `meta: { title, intent, page: '<area>.<page>' }`.
6. A `<style>` block holds grid and gap with tokens only (D47); no new component in the page.
7. Before moving on, read the laws the recipe's card names and the three review questions of
   each; adjust what they catch (target sizes, choice count, grouping, feedback timing).

## Output
```
files: <paths>
primary action: <name>   mutating actions: <names>
laws checked: <names>
```

## Completion
Proceed to `04-states-agent`.
