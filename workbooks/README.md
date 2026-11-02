# Workbooks

Staged instructions for the recurring tasks of this collection and of the projects built from it,
after the Interpretable Context Methodology (ICM, arxiv 2603.16021): folder structure as agent
architecture, numbered stages, explicit load and do-not-load tables, one Input, Process, Output,
Completion contract per stage.

```
workbooks/<task>/
  CONTEXT.md              L1: goal, what to load (Resource | When | Why), what NOT to load, stages
  stages/NN-<name>/
    CONTEXT.md            L2: Input, Process, Output, Completion; under 80 lines
```

Routing (L0) is the table in the root `CLAUDE.md`. Layering: root `CLAUDE.md` (always) ->
workbook `CONTEXT.md` (on entry) -> current stage `CONTEXT.md` (per step) -> the cards, knowledge
notes and scripts the stage names (per step). Nothing else.

| Workbook | Runs in | Task shape |
|----------|---------|------------|
| `start-project` | a target project | set the project up: tokens, shell, DESIGN.md, lint, skills |
| `design-direction` | a target project | the full brief to a direction, a preset and a written contract |
| `copy-piece` | a target project | bring a component, block or recipe (and its closure) into the project |
| `build-page` | a target project | one new page from a recipe, against the contract |
| `review-ui` | a target project | review UI changes against the contract, the laws and the gates |
| `maintain-collection` | this repository | add or change a piece, token, preset, message or pattern |
| `groom` | both | compile the run reports into workbook, card and skill improvements |

Conventions:
- Stages run in order and hand over a few lines of structured facts, not prose. A human may stop
  after any stage.
- Every workbook except `groom` ends with the shared, mandatory `learn` stage
  (`_shared/learn/CONTEXT.md`): a run report in `journal/runs/`. `groom` compiles those.
- A stage that mutates something outside the repository it runs in (a push, a PR, a deploy) names
  it and waits for a yes.
- The project-side workbooks (`start-project`, `design-direction`, `copy-piece`, `build-page`,
  `review-ui`) and `knowledge/` are copied into a target project under `docs/ui/` by
  `start-project`; the project's `CLAUDE.md` gets the matching L0 table (D55).
- The skills in `skills/` are thin entry points: they name the workbook and its entry stage.
