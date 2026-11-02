# Stage 01: scope

## Input
A PR number, a branch, or a ref (`git diff <ref>`).

## Process
1. List the changed files under `src/pages/`, `src/ui/`, `src/App.vue`, `src/main.ts` and any
   `messages.ts`, `actions.ts`, `*.list.ts`.
2. Map each to a page (`data-page` value) or a piece (`src/ui/<Name>/`); note pieces that are
   new in the project (not in `src/ui/INDEX.md`) and copies whose header commit changed.
3. Read `DESIGN.md`: preset, rules, recipes table, exceptions.

## Output
```
pages: <area.page (recipe|exception|none)> ...
pieces: <Name (copied @ commit | written here | changed)> ...
tokens or presets changed: <yes|no>
```

## Completion
Proceed to `02-mechanical`.
