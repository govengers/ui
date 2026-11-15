# govengers/ui design decisions

Binding record of the decisions behind this repository, agreed in the grill rounds of
02.11.2026 (D1-D36) and taken while building the foundation (D37 onward). A change to one of
these is a new numbered decision below the old one, never an edit in place.

## What this is

govengers/ui is a browsable collection of Vue components, composed blocks and page recipes that a
coding agent copies into the next govengers application. It is not an npm package and never
will be: copying keeps every project free of breaking changes and free to adjust its copy locally.
The repository also carries the skills, playbooks and project templates that make a target
project keep one look across all its pages, and a demonstrator that shows every piece under
switchable style presets.

## Scope and shape

- **D1 Contract first, including quick projects.** A target project starts with a design
  contract (`DESIGN.md`) the way Paloma One started with the impeccable direction: direction and
  tokens first, every page against them. The contract is a file, not a ceremony: `ui-start --quick`
  writes it from defaults in one step (D19).
- **D2 Repository shape mirrors govengers/standards.** `README.md`, `AGENTS.md` (what an agent
  reads by task), `MANIFESTO.md` (principles), `ui/` (components and blocks), `pages/` (recipes),
  `patterns/` (intent guides), `skills/`, `templates/` (files that go into a target project),
  `demo/`, `docs/design.md` (this file). Public, Apache 2.0.
- **D3 Runtime dependencies allowed in copied code:** `vue`, `vue-router`, `vue-i18n`,
  `date-fns`, and the project's generated livewire client. Icons are inline SVG (D43). No form
  library, no component library, no CSS framework. A block solving a hard problem may bring one
  dependency of its own (the feedback screenshot block brings `html2canvas-pro`); the card names
  it.
- **D4 Four tiers.** `primitive` (props and emits only, no livewire), `layout` (shell, page,
  header, bars), `block` (composed and livewire-wired), `page` (a whole-page recipe composing
  blocks). Primitives stay dumb so the demo and the tests need no backend.
- **D5 Blocks reach livewire through props.** A block imports the runtime types from
  `@/api/runtime` and `@/api/vue` (where the generator writes) and receives the project's
  descriptor as a prop (`target`, `call`). A block copies verbatim; only the page names the
  descriptor. `@` resolves to `src` in every target (the Vite default).
- **D6 Tokens.** One `ui/tokens.css`: primitive scales feed semantic tokens (`--ui-bg`,
  `--ui-ink`, `--ui-accent`, `--ui-radius-*`, `--ui-space-*`, `--ui-font-*`, ...). Components use
  semantic tokens only. A preset is one CSS file that overrides tokens and nothing else; if a
  preset needs more, the token is added first. No namespaced root class.
- **D7 Three presets at launch:** `neutral` (default, system fonts), `paper` (warm, tight
  radius), `slate` (dark-first product tool). Fonts stay the system stack unless a project
  self-hosts one and overrides `--ui-font-sans`.
- **D8 Coverage target: the typical business application.** Settings, profiles, lists with the
  full filter kit, detail pages, edit forms, file upload, stepper, workflow, dashboard, login,
  admin. The PDB databridge UI (Wilde IT, Mercedes-Benz) is the reference for what exists today;
  its facet filter (OpenRouter variant D, 21.09.2026) is the model for ours (D31).
- **D9 Native first, accessibility floor non-negotiable.** `<dialog>`, `popover`, `<details>`,
  native date and number inputs, CSS over JS. Every component has a visible focus ring, labelled
  controls, 44 px touch targets, measured 4.5:1 text contrast in every preset and both themes,
  and respects reduced motion. Ponytail never trims these.

## Navigation and copying

- **D10 One directory per component.** `ui/<Name>/<Name>.vue`, `<Name>.md` (the card: front
  matter with `tier`, `intent`, `uses`, `livewire`, `status`; body with contract, props, slots,
  events, variants, agent notes, gotchas) and `<Name>.demo.vue`. `scripts/index.ts` generates
  `INDEX.md` (the finder) from the cards; CI fails on drift. `patterns/` holds intent guides.
  Agents enter through `AGENTS.md`, then `INDEX.md`, then the card, then the code.
- **D11 Target layout and provenance.** Copies land in `src/ui/<Name>/`, blocks in
  `src/ui/blocks/<Name>/`, tokens and presets in `src/ui/`, pages in `src/pages/<Name>/`. The copy
  skill copies the `uses` closure, drops the card and the demo, and stamps every file with one
  header line `// govengers/ui <Name> @ <commit>`.
- **D12 Anti-creep in the target project.** Three templated mechanisms: `DESIGN.md` (preset,
  overrides, page recipes, the rules "a new page picks a recipe or gets a written exception here"
  and "no component outside `src/ui/`; copy from govengers/ui first, else write it there in the
  same style"), `ui-lint` (fails CI on hex colours, raw `px`, `font-family` or `<style>` outside
  `src/ui/`, pages without `Page` and `PageHeader`, pages without `data-page`, mutating buttons
  without `data-action`) and a `CLAUDE.md` section ("before any UI work read DESIGN.md and
  src/ui/INDEX.md").
- **D13 Five skills:** `ui-start`, `ui-copy`, `ui-page`, `ui-review`, `ui-maintain`. The first
  four are copied into the target's `.claude/skills/` by `ui-start`.

## Demonstrator and quality

- **D14 Demo.** `demo/` is a Vite + Vue app importing the collection by relative path. Routes
  per component, block and page recipe; top bar with preset, theme and density switches. Blocks
  run against an in-browser fake `LiveConnection` built on livewire's `FakeSocket` with seeded
  data; no Go backend. Deployed to GitHub Pages from `main`.
- **D15 Screenshots for agents.** Playwright renders every component, block and page in the
  default preset, light and dark, into `screenshots/`, committed so an agent can look before it
  copies. Regenerated by `ui-maintain`.
- **D16 Gates.** `vue-tsc`, index drift, screenshot presence, the contrast script (measures every
  declared text and surface pair per preset and theme), a Playwright axe pass on the demo. No
  per-component unit tests; `bun test` covers logic with branches (fake engine, ui-lint, index
  generator, contrast).
- **D17 Harvest, rewritten.** Seeded from `@mxcd/vue-components` (bathroom planner) and Paloma
  One's `tokens.css`/`components.css` lessons; brand derivation, `@fontsource` presets and the
  vue-agent-fx wrappers are dropped. Everything is rewritten to D6 tokens and D3 dependencies.
- **D18 Stack default.** Once v0 exists, the frontend default for new projects becomes "Vue 3 +
  govengers/ui copies"; Quasar stays only for existing projects.

## Round 2

- **D19 Quick mode.** `ui-start --quick` writes a ten-line `DESIGN.md` from defaults (preset
  `neutral`, light and dark, shipped recipes, no overrides) and copies the shell. `--full` runs
  brief, direction and custom preset. A quick project upgrades by editing the same file.
- **D20 Date library: `date-fns` v4** (`@date-fns/tz` when zones matter). Components accept ISO
  strings or `Date`; display goes through `Intl` with the app locale, arithmetic through
  `date-fns`.
- **D21 i18n.** `vue-i18n`, one `messages.ts` per page folder (no shared locale file). Components
  carry their strings under `ui.*` in `ui/messages.ts` (`en`, `de`), copied along.
- **D22 AX principles** (agent experience over developer experience): explicit over magic (no
  auto-imports, no global registration, visible relative imports); one way per job; one screen
  per file (about 200 lines, else split) with the card next to it; grep-able names (no computed
  class names, no string-built keys); convention in files, not tooling; everything checkable by
  script wins over prose; native and standard before clever.
- **D23 The accessibility tree is the agent tree.** Every page root carries `data-page`, every
  actionable element `data-action`, every form field `name`. The spotlight, the visual driver and
  the tests resolve targets by these; `ui-lint` enforces them.
- **D24 One action vocabulary, three executors.** Blocks register
  `useAgentAction({ name, description, params, run })`; names equal the livewire call names. A
  build script emits `app-map.json` (routes with intent and params, actions per page, field
  names); the server hands it to the agent. Background mode reuses the livewire calls as aikido
  tools.
- **D25 Agent modes and pieces.** Modes `chat`, `guide` (spotlight, user acts), `drive` (agent
  acts visibly), `background` (server side). v0 ships `AgentDock` (panel on desktop, sheet on
  phone, mode switch, stop and take over), `Spotlight` (cutout, bubble, next and back) and
  `AgentCursor` (visible pointer performing registered actions at human pace; any user input
  interrupts).
- **D26 Chat over livewire.** A conversation is a livewire resource; streamed tokens arrive as
  pushes; sending and mode switches are calls; the backend runs aikido inside the app's Go
  server. One socket. The agent's client-side tools are `navigate`, `spotlight` and `drive`
  events the dock executes.
- **D27 Mutation safety in drive mode.** Navigation and filling run freely; the final submit of a
  mutating action pauses on the submit button until the user clicks or says go. `DESIGN.md` may
  whitelist actions for unattended submits.
- **D28 No hand-written tours.** Guide and drive plans are derived by the agent from
  `app-map.json` and page intents. A saved plan in the same format is the only static tour.
- **D29 Background results.** `govengers/jobs` on the server, one `JobProgress` block in the UI,
  and the convention that a job's result names a route the dock redirects to.
- **D30 Demo covers the agent.** A scripted fake agent with canned plans makes chat, guide and
  drive visible and screenshot-able without a model or backend.
- **D31 FacetFilter block.** Button, cascade menu with live counts that ignore the facet's own
  selection, one chip per field, optional panel for short enumerations; feature-identical to the
  PDB variant D plus URL sync of clauses and search and a `not in` chip toggle. No operator
  builder in v0; time ranges are `RangePicker`, text is the search field.
- **D32 The `ListPage` recipe** is PDB's full kit made generic: `PageHeader`, `CountedTabs`,
  toolbar (search, `FacetFilter`, `ColumnsPicker`), chip bar, `Table` (cards on phone), `BulkBar`,
  `RowMenu`, `DetailDrawer` with previous and next, `CreateDialog`. Per-entity parts live in one
  config file (`customers.list.ts`: columns, facets, tabs, row and bulk actions).
- **D33 Four things PDB lacks, in v0:** `FileUpload`, `Stepper` (with "save then watch" as a step
  kind), `WorkflowStatus` (timeline plus allowed transitions as confirmed actions), `useLiveForm`
  (save sends only touched fields, a push refills only untouched ones).
- **D34 Other PDB pieces generalised:** `RangePicker`, `CountedTabs`, `ColumnsPicker`,
  `DetailDrawer`, `BulkBar`, the three shell banners, `WhatsNew`, status tiles, `format.ts`.
  `FeedbackButton` with screenshot is an optional block carrying `html2canvas-pro`.
- **D35 Theme.** `useTheme()`: `light | dark | auto`, `auto` default, persisted in
  `localStorage`, optionally mirrored to a user setting through a call the app passes in.
- **D36 Accent rule.** `--ui-accent` (buttons, links, state, focus) and `--ui-accent-soft`
  (chips, selected rows) only. No accent region fills, no gradient tokens; a preset that wants
  one writes the exception on its card.

## Foundation decisions (building, 02.11.2026)

- **D37 Themes through `light-dark()`.** Every colour token is declared once as
  `light-dark(light, dark)` under `color-scheme: light dark`; `<html data-theme="light|dark">`
  pins a theme, otherwise the system decides. No duplicated dark blocks, no theme engine.
- **D38 Density is an attribute.** `<html data-density="compact">` overrides the control and
  spacing tokens in `tokens.css`; components never branch on density.
- **D39 The repository mirrors the target.** `ui/` here is `src/ui/` there, `pages/` is
  `src/pages/`, so every relative import survives the copy untouched. Cards and demos sit next to
  the code and are not copied.
- **D40 Livewire runtime vendored for the demo.** `demo/src/api/runtime.ts` and `vue.ts` are
  byte copies of livewire v1.0.0 (plus a one-line header) so blocks type-check and run here
  against `@/api/*` exactly as in a target.
- **D41 Variants are attributes, parts are classes.** Root class `ui-<name>`, parts
  `ui-<name>__part`, variants and sizes as `data-variant`, `data-size`, states as `data-state`
  or native pseudo-classes. No class concatenation anywhere.
- **D42 Plain scoped CSS.** `<style scoped>` with `var(--ui-*)` only; no preprocessor, no CSS
  modules, no utility classes.
- **D43 Icons.** `ui/Icon/icons.ts` holds a curated Lucide subset as path data (ISC licence
  noted in the file); `Icon.vue` renders by name. Adding an icon is pasting one path.
- **D44 Component API conventions.** `modelValue` for v-model; `size` is `sm | md | lg`;
  `variant` names are per component and listed on the card; booleans default to false; strings
  the user sees are props with English defaults or `ui.*` keys; emits are typed; slots are named
  and listed on the card.
- **D45 Demo exceptions.** `import.meta.glob` is allowed in the demo only (to discover demos).
  Presets are switched by enabling one of three `<link>` elements, so the preset file is used
  exactly as a target uses it.
- **D46 Screenshots in CI by presence, not pixels.** CI checks that every card has its light and
  dark screenshot; pixel regeneration is local (`just screenshots`), because fonts differ across
  machines.
- **D47 One `ui-lint`, two modes.** `scripts/ui-lint.ts` is copied into a target as is (no
  template copy). The ban on `<style>` blocks outside `src/ui/` from D12 is its `--strict` mode;
  the default lets a page keep a grid-and-gap style block under the same token rules, because
  recipes composing blocks need that much CSS and utility classes are not an option (D42).
- **D48 Actions are declared in files, bound at runtime.** A page folder exports its actions
  from `actions.ts` (plain `AgentAction` objects: name = livewire call, description, params,
  page, mutating). `useAgentAction(action, run)` binds a handler while the page lives.
  `scripts/app-map.ts` (template) imports every `actions.ts` and the route meta and writes
  `src/app-map.json`; nothing is extracted from templates by regex. Drive plans are
  `DriveStep[]` targeting `data-action`, `name` or `data-page` (`ui/agent/types.ts`).
- **D49 Optional props are `x?: T | undefined`; attributes land on the control.** The
  repository compiles with `exactOptionalPropertyTypes`, so a page passing `string | undefined`
  (an error from `ApiError.fields`) needs the explicit union. Controls set `inheritAttrs: false`
  and bind the attributes to the native element, `class` and `style` to the wrapper, so
  `aria-label` and `data-action` reach the `<input>`. `ui-lint` and D42 agree on hairlines: 0,
  1px and 2px (also negative) are the only px values; every control is 44px on coarse pointers
  through the tokens, not per component.
- **D50 The fake engine is a demo server, not a livewire clone.** `demo/src/fake/` implements the
  frames the v1.0.0 runtime sends and expects (query, subscribe with snapshot then diff or
  replace pushes, calls with field errors, stored filters evicted as 404 `not_found`, presence,
  uploads reported as live `files` rows because `Client.upload` has no progress callback, jobs
  advancing on a timer; distinct reads cap at 1000 values and ignore paging; an upload ignores
  its abort signal once started). Facet counts come from a custom object read `customerFacets` (every
  value, own selection ignored) because livewire's `distinct` counts one field under the full
  filter; a block must work with both: per-facet `distinct` reads with the filter minus that
  facet's clauses against a real backend, a combined read when the app offers one. Known gaps:
  no batch, no history reads, no 4401, no reconnects, one acting user, `billing` always
  answers 403 to show the forbidden state.
- **D51 One Popover primitive.** `ui/Popover` owns anchored placement (below, above, else the
  roomier side with a scrolling cap), the toggle guard against the light-dismiss race, and
  per-frame following of its trigger. `Menu`, `FacetFilter`, `RangePicker` and `ColumnsPicker`
  build on it instead of each carrying the placement code; a placement fix lands once.
- **D52 Drive mode pauses by default.** A `click` step on a `{ action }` target pauses for the
  user unless the action is bound through `useAgentAction` and declared not mutating, or named in
  `unattended`. An unbound action is treated as mutating; the earlier rule (pause only when a
  bound action says `mutating`) let an unbound mutation run. On tablets and phones the shell
  collapses the dock to a strip while a plan runs (`AppShell dockCollapsed`, bound to
  `AgentDock`'s `running` event) so the plan can reach the page.
- **D53 ICM structure.** The repository follows the Interpretable Context Methodology used by
  the Wilde IT devops worker: the root `CLAUDE.md` is the L0 routing table (task shape to
  workbook, plus the rules that hold everywhere); each `workbooks/<task>/CONTEXT.md` is the L1
  load and do-not-load table; each `stages/NN-<name>/CONTEXT.md` is an L2 Input, Process,
  Output, Completion contract under 80 lines; every workbook ends with the shared mandatory
  learn stage writing `journal/runs/`, and `groom` compiles the reports. Skills are thin entry
  points naming the workbook. Cards carry a `## Load` table (what to read to use or change the
  piece, what not to load) so a piece is navigated the same way.
- **D54 Laws of UX as the design floor.** `knowledge/laws-of-ux/` holds one note per law from
  lawsofux.com (Jon Yablonski), in our words with attribution, each mapped to the pieces,
  tokens and rules that embody it and to review questions. The `design-direction`,
  `build-page` and `review-ui` workbooks load the laws a recipe card names; a card's `laws`
  front matter lists them.
- **D55 Project-side workbooks live under `docs/ui/`.** `start-project` copies the project-side
  workbooks, the knowledge base and the run-report template into the target's `docs/ui/`, and
  the project's `CLAUDE.md` gets the matching L0 table (`templates/project/CLAUDE.md`), so a
  project's agent runs the same stages without reaching back into this repository.

## Session and starter (16.11.2026)

- **D56 One session module.** `ui/session.ts` (`createSession`) is the only code that changes who
  the app acts as: password login with the TOTP step, logout, dev login, impersonation start and
  stop, all against govengers/auth's routes as they are. It owns the livewire pair: every change
  ends the pair before the request that changes the cookie and builds the next pair from what
  `GET /auth/me` answers afterwards, also when the change failed; changes run one after the
  other (livewire D66, the `live.ts` of livewire's todo example made a module). The app builds
  the pair in `createPair(key, onUnauthorized)`, so the module stays free of URLs. The pair key
  carries the impersonator (`admin>target`), so starting or stopping an impersonation is a new
  pair. Logout follows the provider that made the session (the impersonator's while
  impersonating): a redirect provider (OIDC, GitHub) navigates to its `<prefix>/logout`, a dev
  login posts `/auth/dev/logout`, any other `POST /auth/password/logout`, which ends whatever
  session the request has. govengers/auth also changes the identity without a 401 or 4401 (an
  impersonation past `MaximumDuration` ends in place; another tab signs in or out), so
  `check()` re-reads `/auth/me` on tab focus and every minute while impersonating and builds a
  new pair only when the key changed. The anonymous pair's unauthorized callback is ignored.
  An unreadable `/auth/me` leaves the pair ended and retries with backoff (1 s to 30 s); a
  refused change keeps its own error. `login` answers auth's challenge name
  (`{ challenge?: 'totp' | 'totp_setup' }`) so a further challenge is a new value, not a
  pseudo error.
  `safeRedirect` applies govengers/auth's `return_to` rule on the client. The card has tier
  `block` and lives at `ui/session.md` like `theme`: a module with livewire wiring and no view.
- **D57 LoginForm follows govengers/auth.** The first field is `identifier` (user name or
  email, auth's login body), not `email`; "Remember me" is gone because auth has none (the
  session lives `MaximumAge` from the login); the `sso` slot is replaced by a `providers` prop
  rendered as buttons (one way per job) and `layout="sso"` puts them first with the password
  form behind a link; the code step can switch to a backup code (`backupCode: true`). Refusals
  carrying a known govengers/auth `code` show as `ui.*` sentences. The TOTP field takes 6 to 8
  digits (auth's `TOTP.Digits`). `LoginCredentials` changed
  shape: a copy made before keeps its own file; a re-copy needs the page's `login` updated.
- **D58 DevLogin is a function-prop block kept out of production by the bundler.** It takes
  `users` and `login` (the session's `devUsers`, `devLogin`), renders nothing when the server
  lists none (the session answers `[]` for a 404), and is imported behind
  `import.meta.env.DEV` so production builds drop its chunk. `GET /auth/dev/users` answers
  `{ users: [{ id, name, description }] }` (govengers/auth `devlogin`); the session unwraps
  `users` and refuses another body, so a mismatch shows as an error, not as an empty card.
  `LoginPage` has an `after` slot for it; `templates/project/LoginRoute.vue` fills it.
- **D59 ImpersonationBanner is a warning.** Acting as someone is deliberate, so the banner is
  `warning`, not the `danger` the login pattern named. The end time comes from the app
  (`impersonationEndsAt` on its own `/auth/me`, or `endsAt`): govengers/auth's
  `IdentityResponse` does not carry it. Read-only is the app's rule and only shown here. The
  countdown sits in an `aria-live="off"` span so it is not announced every second.
- **D60 ApiKeyManager over livewire.** Keys are a livewire resource plus two mutations the app
  declares; the block takes the descriptors (D5). The create mutation answers the row plus the
  secret and must not declare an `upserts` effect, or the runtime would put the secret into
  every live list until the next push. The secret lives only in the dialog's state and is
  forgotten on close and on a new connection (another identity); a create answering after
  either is dropped. A key must
  not manage keys; the card says to mount the operations behind a session-only check.
- **D61 The starter is checked by script.** `templates/project` gains `router.ts` (lazy
  components so `scripts/app-map.ts` can import the routes without a DOM; `public` meta; the
  sign-in guard), `session.ts`, `LoginRoute.vue`, `Home.vue` and `vite.config.ts` (proxy
  `^/api/` with `ws` and `^/auth/`, regex keys because plain keys are prefix matches that would
  catch SPA routes like `/api-keys`; `changeOrigin` off so the socket's Origin matches the Host
  the backend sees).
  `main.ts` resumes the session before installing the router, because installing it runs the
  first navigation. `App.vue` renders public routes without the shell. `start-project` copies
  `app-map.ts`; the `ui-screens` recipe is dropped instead of adding a Playwright dependency to
  every project (the verify stages screenshot with Playwright or the `run` skill).
  `scripts/template-check.ts` scaffolds the templates into a temporary target and runs vue-tsc,
  ui-lint and app-map there in CI (about 2 s), so a template cannot rot again.
