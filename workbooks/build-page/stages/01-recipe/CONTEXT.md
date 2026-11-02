# Stage 01: recipe

## Input
The page in the human's words: what it shows, for whom, which resource.

## Process
1. Name it `<area>.<page>` (`customers.list`, `settings.general`); check `DESIGN.md`'s recipes
   table and `src/pages/` for an existing page of that name.
2. Pick the recipe: `ListPage` (records with filter, sort, paging, bulk, drawer), `DetailPage`
   (one record: header, form, workflow, related lists), `SettingsPage` (cards, each its own
   form), `LoginPage` (auth screens), `Dashboard` (tiles, recent lists). Read its card.
3. No recipe fits: write the exception in `DESIGN.md` under "Exceptions" (page, closest recipe,
   why, date) BEFORE building, then build from the closest recipe. The exception needs the
   human's yes.
4. List the descriptors the page needs from `src/api/api.ts` (`live.x`, `live['x.item']`,
   `calls.y`, `uploads.z`); a missing one is a backend task, name it.

## Output
```
page: <area>.<page>   recipe: <Recipe> | exception (closest <Recipe>)
descriptors: <names>   missing on the backend: <none|names>
```

## Completion
An exception waits for the yes. Else proceed to `02-pieces`.
