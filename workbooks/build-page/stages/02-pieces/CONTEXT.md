# Stage 02: pieces

## Input
The recipe name; `src/ui/INDEX.md`.

## Process
1. The recipe's card lists its `uses`; compare with `src/ui/INDEX.md`.
2. Missing pieces: run `workbooks/copy-piece/` once for the recipe (its closure comes along).
   Present pieces at an older commit: leave them; an upgrade is its own `copy-piece` run, not a
   side effect of a page.

## Output
```
present: <n>   copied now: <Name...|none>
```

## Completion
Proceed to `03-compose`.
