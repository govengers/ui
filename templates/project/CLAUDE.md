
## UI (govengers/ui, ICM routing)

This project's frontend is built from govengers/ui copies (no Quasar, no Tailwind, no component
library). The procedure for every UI task is a workbook under `docs/ui/workbooks/` (L1 load
table and L2 stages); load only the workbook and the stage you are in.

| Task shape | Workbook | Entry stage |
|------------|----------|-------------|
| "copy X", "I need a file upload", `ui-copy` | `docs/ui/workbooks/copy-piece/` | `01-resolve` |
| "build the customers list", "new page", `ui-page` | `docs/ui/workbooks/build-page/` | `01-recipe` |
| "review the UI", "review this PR's pages", `ui-review` | `docs/ui/workbooks/review-ui/` | `01-scope` |
| "change the design direction / preset" | `docs/ui/workbooks/design-direction/` | `01-brief` |
| "groom the UI workbooks" | `docs/ui/workbooks/groom/` | `01-collect` |
| anything else UI | `DESIGN.md`, `src/ui/INDEX.md`, the piece's code; the rules below |

Rules that hold outside any workbook:
1. `DESIGN.md` is the contract; a new page picks a recipe listed there or gets an exception written there first.
2. No component outside `src/ui/`; copy from govengers/ui first (`ui-copy`), else write it in `src/ui/<Name>/` in the same style and add it to `src/ui/INDEX.md`.
3. Styles: scoped CSS with `var(--ui-*)` only; `just ui-lint` fails hex, raw px, font-family, pages without `Page`/`PageHeader`/`data-page`, mutating buttons without `data-action`.
4. Data: livewire through the generated client in `src/api/`; blocks take descriptors as props; loading is `!error && loading`; live errors branch on `error.code`.
5. Strings: `messages.ts` per page folder; component strings under `ui.*` in `src/ui/messages.ts`.
6. Design floor: `docs/ui/knowledge/laws-of-ux/` is the knowledge base the page and review workbooks load.
7. Every workbook run ends with its learn stage: a report in `docs/ui/journal/runs/`.
