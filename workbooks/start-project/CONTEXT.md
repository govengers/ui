# start-project (L1)

Set a Vue 3 project up so every page after this one follows one design contract (D1, D12, D19):
tokens, base styles, a preset, the shell closure, messages, the contract file, the mechanical
rules, the project-side workbooks and skills. Quick mode writes the contract from defaults in one
step; full mode runs the `design-direction` workbook between stages 02 and 03.

## Load

| Resource | When | Why |
|----------|------|-----|
| `stages/<current>/CONTEXT.md` | always | contract |
| `workbooks/_shared/learn/CONTEXT.md` | last stage | the run report contract |
| `docs/design.md` D1-D13, D19, D39, D47, D55 | stage 01 | what a target looks like and why |
| `INDEX.md` | stage 02 | the shell closure's names |
| `templates/project/*` | stages 02-04 | the files that go into the project |
| `workbooks/copy-piece/` | stage 02 | copying the shell closure |
| `workbooks/design-direction/` | between 02 and 03, full mode only | brief to direction |
| `scripts/ui-lint.ts`, `scripts/contrast.ts` | stage 04 | copied as is |

## Do not load

| Resource | Why |
|----------|-----|
| cards other than the shell closure | copied later by `copy-piece` on demand |
| `pages/`, `patterns/` | `build-page` loads them when a page is built |
| `demo/` | the demonstrator is not part of a project |

## Stages

1. `01-preflight`: source checkout and commit, target shape, mode, stop if already set up
2. `02-foundation`: dependencies, tokens, base, preset, modules, the shell closure, `main.ts`, `App.vue`
3. `03-contract`: `DESIGN.md` (defaults in quick mode, the direction's outcome in full mode)
4. `04-rules`: `ui-lint`, justfile recipes, CI step, `CLAUDE.md` L0 table, `docs/ui/` workbooks, knowledge and skills, `src/ui/INDEX.md`
5. `05-verify`: build, lint, the empty shell in the browser light and dark
6. `06-learn`: mandatory run report (`workbooks/_shared/learn/CONTEXT.md`)
