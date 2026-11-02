---
name: ui-start
description: Set up govengers/ui in a Vue 3 project before the first page - tokens, shell, DESIGN.md, ui-lint, the project-side workbooks, knowledge and skills. Use at project start, when a project has no DESIGN.md, or on "set up the UI", "start the frontend", "ui-start". Args - `--quick` (defaults, one step) or `--full` (brief, direction, custom preset).
---

# ui-start

Entry point for the `start-project` workbook (ICM). Do not improvise the procedure here.

1. Locate the collection: `$GOVENGERS_UI`, else `~/github.com/govengers/ui`, else
   `git clone --depth 1 https://github.com/govengers/ui` into a temporary directory.
2. Read `<source>/CLAUDE.md` (the rules), then `<source>/workbooks/start-project/CONTEXT.md`.
3. Run its stages in order from `01-preflight`, loading only what each stage names. Full mode
   runs `<source>/workbooks/design-direction/` between stages 02 and 03.
4. The run is not done before stage `06-learn` has written its report.
