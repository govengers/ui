# Stage 01: collect

## Input
`grep -l "groomed: no" journal/runs/*.md` plus `journal/deferred.md`.

## Process
1. Read each report. Take every line from "What went wrong", "Instructions that were wrong or
   missing", "Questions", "Pieces that did not fit", "Gate friction", "Suggested improvements".
2. Normalise each into `target | finding | reports` where target is a file and section
   (`workbooks/build-page/stages/03-compose`, `ui/Table/Table.md#Gotchas`,
   `knowledge/laws-of-ux/hicks-law.md`, `skills/ui-page/SKILL.md`, `scripts/ui-lint.ts`).
3. Group by target; count recurrence across reports and `deferred.md` rows (a deferred row plus
   one fresh report = recurred). Questions a human answered more than once are the most valuable
   findings: their answers belong in a card or a stage.
4. Drop findings already fixed in the run (`fixed now: yes`) unless they recurred afterwards.

## Output
```
reports: <n> (<date range>)
findings: <m>, recurring: <k>
| target | finding | seen in | proposed change |
```

## Completion
Proceed to `02-apply`.
