---
name: ui-copy
description: Copy one or more govengers/ui pieces (component, block, page recipe, module) with their uses closure into this project's src/ui/ (blocks into src/ui/blocks/, pages into src/pages/), stamp the provenance, merge ui.* messages, wire livewire imports, update src/ui/INDEX.md; also upgrades an existing copy against the source commit. Use on "copy the Table", "I need a file upload", "add the FacetFilter", "update our Button from govengers/ui", "ui-copy".
---

# ui-copy

Entry point for the `copy-piece` workbook (ICM). Do not improvise the procedure here.

1. In a project set up by `ui-start`: `docs/ui/workbooks/copy-piece/CONTEXT.md`. Elsewhere:
   `<source>/workbooks/copy-piece/CONTEXT.md` with `<source>` as in `ui-start`.
2. Run its stages from `01-resolve`, loading only what each stage names.
3. The run is not done before `05-learn` has written its report
   (`docs/ui/journal/runs/` in a project).
