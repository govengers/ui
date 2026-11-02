# Stage 03: wire

## Input
The copied pieces; the cards' "Messages" and "With livewire" sections.

## Process
1. Messages: every `ui.*` key a copied piece calls (`grep -o "t('ui\.[a-zA-Z]*'" -r <dir>`) exists
   in the project's `src/ui/messages.ts` for every locale the project has; add missing ones from
   `<source>/ui/messages.ts`.
2. Livewire: a block imports `@/api/runtime` and `@/api/vue`. Check they resolve to the project's
   generated client. A different path: rewrite those two import lines in the copy and record it.
   A page recipe imports its descriptors on one line under `// In a project:`; rewrite that line
   to `@/api/api` and the project's descriptor names.
3. Page recipes: rename `data-page`, the route name, the messages namespace and the entity in
   `<entity>.list.ts` and `actions.ts` as the card's "When copying" section says.
4. `src/ui/INDEX.md`: add or update `| Name | tier | commit | intent |`, sorted by tier then name.

## Output
```
messages added: <keys|none>
imports rewritten: <files|none>
index: <n> lines
```

## Completion
Proceed to `04-verify`.
