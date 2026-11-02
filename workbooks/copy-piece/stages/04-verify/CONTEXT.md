# Stage 04: verify

## Input
The project after `03-wire`.

## Process
1. `bunx vue-tsc --noEmit` and `just ui-lint`: clean.
2. A block or page: render its first use in the browser (dev server, Playwright or the `run`
   skill), light and dark; a block that reads data must show rows or its empty state, never a
   skeleton forever (loading is `!error && loading`).
3. A primitive: the type-check is enough.

## Output
```
vue-tsc: clean   ui-lint: clean
browser: <piece> shows <rows|empty|n/a>
```

## Completion
Report: pieces copied (with commit), skipped (current), upgraded (hunks), messages added,
imports rewritten. Then proceed to `05-learn`.
