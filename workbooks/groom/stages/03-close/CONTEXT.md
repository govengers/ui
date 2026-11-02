# Stage 03: close

## Input
The reports consumed in `01-collect` and the result of `02-apply`.

## Process
1. Set `groomed: dd.MM.yyyy` in the header of every consumed report.
2. One line in `journal/<yyyy-mm>.md`: `dd.MM.yyyy groom: <n> reports, <applied> applied, <deferred> deferred, <todo> todo`.
3. One commit for the whole grooming pass (`groom: <date>, <n> reports`), never one per finding.

## Output
The commit.

## Completion
Report the counts and the commit to the human. `groom` has no learn stage.
