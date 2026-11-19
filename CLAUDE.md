# govengers/ui

A browsable, copy-paste collection of Vue 3 components, blocks and page recipes for govengers
applications, with the workbooks, knowledge and skills that make a project keep one look across
all its pages. Not a package: a project copies the pieces it needs. This file is the L0 routing
table (ICM, `workbooks/README.md`); procedure lives in the workbooks, facts in the cards.

## Where am I (layout)

| Path | What |
|------|------|
| `INDEX.md` | generated finder: every piece by tier and intent; read it before touching a piece |
| `ui/<Name>/` | primitives and layout pieces: `<Name>.vue`, `<Name>.md` (the card), `<Name>.demo.vue` |
| `ui/blocks/<Name>/` | livewire-wired blocks, same three files |
| `pages/<Name>/` | page recipes with `actions.ts`, `messages.ts` and the entity config |
| `ui/tokens.css`, `ui/base.css`, `ui/presets/` | the only tokens; presets change tokens only |
| `ui/messages.ts`, `ui/Icon/icons.ts` | the only `ui.*` keys and icon names |
| `patterns/` | intent guides; `knowledge/laws-of-ux/` the design knowledge base |
| `workbooks/<task>/` | ICM workbooks: staged instructions (routing below) |
| `skills/` | thin entry points that name a workbook; installed into `~/.claude/skills` and into projects |
| `templates/project/` | files `start-project` copies into a target |
| `demo/` | the demonstrator (`just demo`); `demo/src/fake/` the in-browser livewire engine |
| `scripts/` | index, contrast, screenshots, touch-probe (D87), ui-lint, cards, `tokens.test.ts` (the touch floor per pointer and density, D84); `scripts/test/` the mounted-test harness (D69); `just ci` runs all but screenshots and touch-probe |
| `docs/design.md` | every decision, numbered D1 onward; a change is a new number |
| `journal/`, `TODO.md` | run reports and the monthly line; defects seen on the way |

## Routing (L0)

| Task shape | Workbook | Entry stage |
|------------|----------|-------------|
| "set up the UI in project P", `ui-start` | `workbooks/start-project/` | `01-preflight` |
| "design direction / brief / brand for P" | `workbooks/design-direction/` | `01-brief` |
| "copy X into P", "I need a file upload in P", `ui-copy` | `workbooks/copy-piece/` | `01-resolve` |
| "build the customers list in P", "new page", `ui-page` | `workbooks/build-page/` | `01-recipe` |
| "review the UI of P", "review this PR's pages", `ui-review` | `workbooks/review-ui/` | `01-scope` |
| "add a component / block / recipe / token / preset / note here", `ui-maintain` | `workbooks/maintain-collection/` | `01-place` |
| "groom the workbooks / compile the run reports" | `workbooks/groom/` | `01-collect` |
| anything else | no workbook: `INDEX.md`, the card, the code, the rules below |

Load only the workbook's `CONTEXT.md`, the current stage, and the cards, notes and scripts it
names. Do not browse other workbooks or pieces.

## Rules

1. **Copy, never import** (P1). Nothing here becomes a package; a project's copy is its own,
   stamped with the source commit. Improvements come back here as a `maintain-collection` run.
2. **The card is the contract.** Props, slots, events, livewire props, agent attributes and
   gotchas live in `<Name>.md`; the code must not know more than the card says. A card without a
   `## Load` table or without front matter fails `just index`.
3. **Tokens are the only knob** (P4): components read `var(--ui-*)`; presets override tokens;
   `ui-lint` fails hex, raw px, font-family, colour functions, literal font sizes, bare `vh`,
   `:hover` outside `@media (hover: hover)` and an icon-only Button without `label` (D89). A look
   no token expresses is a token request.
4. **Native first, accessibility floor non-negotiable** (D9): names, focus, 44 px on touch,
   measured contrast, reduced motion. Ponytail never trims these.
5. **Agent experience over developer experience** (P2): explicit imports, one way per job, one
   screen per file, variants as attributes, everything checkable by script.
6. **The accessibility tree is the agent tree** (D23): `data-page`, `data-action` = livewire
   call name, `name` on fields. Pieces and recipes carry them; `ui-lint` checks pages.
7. **Gates before done**: `bun run check`, `bun scripts/ui-lint.ts ui pages`, `just contrast`,
   `just index`, screenshots for what changed and looked at, `just touch-probe --only=<Name>` for
   a piece with controls, `just test`. Never claim a check you did not run.
8. **Learn loop, mandatory.** Every workbook run ends with `workbooks/_shared/learn/CONTEXT.md`:
   a run report in `journal/runs/`, one line in `journal/<yyyy-mm>.md`, safe fixes applied in
   the run, the rest for `groom`. A wrong or missing sentence on a card is fixed in the run.
9. **Decisions are numbered, never edited.** A convention change is a new `Dnn` in
   `docs/design.md`.
10. **Commits**: one piece or one change per commit, `<Name>: <what>`; no attribution footers of
    any kind; never `git add -A` when scratch files may exist; push only when the human says so.
11. **Diction**: English, no em-dash, dates `dd.MM.yyyy`, concise. Summaries, never dumps.
    The repository is public: name no customer, employer or private project; describe the
    origin neutrally or cite a `Dnn` (D82).
