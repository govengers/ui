# Stage 04: rules

## Input
The target from `01-preflight`, the source checkout.

## Process
1. Copy `scripts/ui-lint.ts` to the project's `scripts/ui-lint.ts` as is (D47); append
   `templates/project/justfile` recipes to the project's justfile; add the step from
   `templates/project/ci-ui.yml` to the frontend CI job.
2. Copy the project-side workbooks and knowledge (D55): `workbooks/README.md`,
   `workbooks/_shared/`, `workbooks/copy-piece/`, `workbooks/build-page/`,
   `workbooks/review-ui/`, `workbooks/design-direction/`, `workbooks/groom/` into
   `docs/ui/workbooks/`; `knowledge/` into `docs/ui/knowledge/`; create
   `docs/ui/journal/runs/README.md` from `journal/runs/README.md`. Add the project's
   `docs/ui/README.md` naming the source commit.
3. Append `templates/project/CLAUDE.md` (the project's L0 routing table) to the project's
   `CLAUDE.md`; copy `skills/ui-copy`, `skills/ui-page`, `skills/ui-review` into
   `.claude/skills/` (they route into `docs/ui/workbooks/`).
4. Write `src/ui/INDEX.md`: one line per copied piece (`| Name | tier | commit | intent |`),
   sorted by tier then name.

## Output
```
ui-lint: scripts/ui-lint.ts, just ui-lint, CI step
docs/ui: <n> workbooks, <m> knowledge notes
CLAUDE.md: L0 table appended; skills: ui-copy, ui-page, ui-review
src/ui/INDEX.md: <n> pieces
```

## Completion
Proceed to `05-verify`.
