# groom (L1)

Compile the run reports since the last grooming into improvements of the workbooks, cards,
knowledge notes, skills and scripts. Run it on a cadence (after every ten reports, or monthly),
not inside a task. In a target project it grooms `docs/ui/` the same way.

## Load

| Resource | When | Why |
|----------|------|-----|
| `stages/<current>/CONTEXT.md` | always | contract |
| `journal/runs/*.md` with `groomed: no` | stage 01 | the evidence |
| `journal/deferred.md` | stage 01 | findings seen once, waiting for recurrence |
| the workbook, card, knowledge note, skill or script a finding points at | stage 02 | the thing to change |
| `TODO.md` | stage 02 | findings that are defects elsewhere |

## Do not load

| Resource | Why |
|----------|-----|
| reports already `groomed: <date>` | done |
| `INDEX.md` | generated; regenerate after card changes |
| `screenshots/` | re-rendered by `maintain-collection`, never groomed |

## Stages

1. `01-collect`: read the ungroomed reports, cluster findings by target and recurrence
2. `02-apply`: change workbooks, cards, knowledge, skills, scripts for findings seen twice or clearly right once; queue the rest
3. `03-close`: mark reports groomed, journal line, report to the human
