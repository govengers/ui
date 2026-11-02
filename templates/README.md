# templates

Files that go into a target project. `ui-start` copies and fills them; nothing here is used by
this repository itself.

| File | Goes to | What |
|------|---------|------|
| `project/DESIGN.md` | `DESIGN.md` | the design contract (D12): preset, overrides, recipes, exceptions |
| `project/CLAUDE.md` | appended to `CLAUDE.md` | the project's L0 routing table into `docs/ui/workbooks/` plus the rules that hold outside a workbook |
| `project/main.ts` | `src/main.ts` (merge) | how tokens, base, preset, messages and the live pair are mounted |
| `project/App.vue` | `src/App.vue` (merge) | the shell with banners, toast host and dock slot |
| `project/justfile` | appended to `justfile` | `ui-lint` and `ui-screens` recipes |
| `project/ci-ui.yml` | a CI step | runs `ui-lint` and the type-check |

`scripts/ui-lint.ts` is copied as is (D47: one source, no template copy to drift).

`start-project` also copies the project-side workbooks (`copy-piece`, `build-page`, `review-ui`, `design-direction`, `groom`, `_shared`), `knowledge/` and the run-report template into `docs/ui/` (D55).
