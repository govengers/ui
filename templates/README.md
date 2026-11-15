# templates

Files that go into a target project. `ui-start` copies and fills them; nothing here is used by
this repository itself.

| File | Goes to | What |
|------|---------|------|
| `project/DESIGN.md` | `DESIGN.md` | the design contract (D12): preset, overrides, recipes, exceptions |
| `project/CLAUDE.md` | appended to `CLAUDE.md` | the project's L0 routing table into `docs/ui/workbooks/` plus the rules that hold outside a workbook |
| `project/main.ts` | `src/main.ts` (merge) | how tokens, base, preset, messages, the router and the session's pair are mounted |
| `project/App.vue` | `src/App.vue` (merge) | public routes bare, else the shell with banners, sign out, toast host and dock slot |
| `project/session.ts` | `src/session.ts` | the app's one session: the livewire pair and the redirect providers (D56) |
| `project/router.ts` | `src/router.ts` | routes with agent meta, lazy components, the sign-in guard, login wiring |
| `project/Home.vue` | `src/pages/Home/Home.vue` | the first page, replaced through `ui-page` |
| `project/vite.config.ts` | `vite.config.ts` (merge) | `@` alias and the dev proxy for `/api` (socket) and `/auth` |
| `project/app-map.ts` | `scripts/app-map.ts` | writes `src/app-map.json` from the routes and every `actions.ts` (D48) |
| `project/justfile` | appended to `justfile` | `ui-lint` and `app-map` recipes |
| `project/ci-ui.yml` | CI steps | `ui-lint`, the type-check and `app-map` |

`scripts/ui-lint.ts` is copied as is (D47: one source, no template copy to drift).

`start-project` also copies the project-side workbooks (`copy-piece`, `build-page`, `review-ui`, `design-direction`, `groom`, `_shared`), `knowledge/` and the run-report template into `docs/ui/` (D55).
