# Stage 02: mechanical

## Input
The scope block.

## Process
1. `just ui-lint` (or `bun scripts/ui-lint.ts src/ui src/pages`). Every finding is at least
   MAJOR; note the rule id.
2. `bunx vue-tsc --noEmit`; an error is MAJOR.
3. Tokens or presets changed: run the contrast script on them (temporary `ui/` directory with
   the project's `tokens.css` and preset); every failing pair is MAJOR with the measured ratio.
4. Header lines: a copied piece without `govengers/ui <Name> @ <commit>` is MINOR (provenance lost).

## Output
```
ui-lint: <n> findings (<rule ids>)
vue-tsc: <clean|n errors>
contrast: <n/n|not needed>
provenance: <ok|missing on ...>
```

## Completion
Proceed to `03-contract-and-laws`.
