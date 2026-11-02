# Stage 02: apply

## Input
The table from `01-collect`.

## Process
1. Apply every recurring finding and every seen-once finding that is plainly factual (a wrong
   file name, a prop that does not exist, a key that is missing): edit the stage, the card, the
   knowledge note, the skill or the script. A card change that alters a piece's behaviour is a
   `maintain-collection` run, not a grooming edit: queue it in `TODO.md`.
2. Seen-once judgement calls go to `journal/deferred.md` (`target | finding | first seen | reports`).
3. Findings that are defects in a piece's code go to `TODO.md` with the report name.
4. After card edits: `bun scripts/index.ts`; after stage edits: re-read the workbook's
   `CONTEXT.md` for consistency of the stage list; keep every stage under 80 lines.

## Output
```
applied: <n> (files: ...)
deferred: <m>
todo: <k>
```

## Completion
Proceed to `03-close`.
