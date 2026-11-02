# Stage 01: resolve

## Input
Piece names, or a need in the human's words ("I need a file upload").

## Process
1. Source checkout as in `start-project` 01 (`$GOVENGERS_UI`, `~/github.com/govengers/ui`, or a
   shallow clone); record the commit.
2. A need instead of a name: find it in `<source>/INDEX.md` "By intent"; propose the piece, do
   not copy a second candidate "just in case".
3. For each name read its card; take `uses`; repeat until closed. Order the closure: modules
   (`format`, `theme`, `agent`), primitives, layout, blocks, pages.
4. For each piece in the closure check the project (`src/ui/<Name>/`, `src/ui/blocks/<Name>/`,
   `src/pages/<Name>/`, `src/ui/<name>.ts`) and read its header line: same commit = skip; older =
   upgrade candidate (stage 02 step 4); absent = copy.

## Output
```
source: <path> @ <commit>
closure (in order): <Name (copy|skip @ commit|upgrade from commit)> ...
livewire needed: <yes|no>
```

## Completion
Proceed to `02-copy`.
