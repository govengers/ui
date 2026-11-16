# Stage 04: gates

## Input
Everything from stages 02 and 03.

## Process
1. `bun run check` (0 errors), `bun scripts/ui-lint.ts ui pages` (clean), `bun test scripts ui
   pages demo/src` (green).
2. Tokens or presets touched: add any new text/surface pair to `scripts/contrast.ts`, then
   `just contrast` passes for every preset in both themes.
3. `just index` (INDEX.md regenerated; the card's front matter validated by `scripts/cards.ts`).
4. `bun scripts/screenshots.ts --only=<Name>`; Read both PNGs and look at them; fix and repeat.
   A token change: re-render the pieces that use it.
5. `README.md` tier table: add the name. A changed convention: a new numbered decision in
   `docs/design.md`, never an edit of an old one.
6. One commit per piece: `<Name>: <what it does in one line>`; no attribution footers.

## Output
```
check: 0   lint: clean   tests: <n>   contrast: <n/n|n/a>   index: current
screenshots: <Name>.light.png, <Name>.dark.png looked at
commit: <sha>
```

## Completion
Proceed to `05-learn`.
