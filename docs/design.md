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
  contract (`DESIGN.md`) the way an earlier product started with the impeccable direction: direction and
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
  admin. The UI of an earlier data-heavy admin console is the reference for what exists
  today; its facet filter (variant D of its filter designs) is the model for ours (D31).
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
- **D17 Harvest, rewritten.** Seeded from an earlier Vue component library and an earlier
  product's `tokens.css`/`components.css` lessons; brand derivation, `@fontsource` presets and the
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
  admin console's variant D (D8) plus URL sync of clauses and search and a `not in` chip toggle. No operator
  builder in v0; time ranges are `RangePicker`, text is the search field.
- **D32 The `ListPage` recipe** is the admin console's full kit (D8) made generic: `PageHeader`, `CountedTabs`,
  toolbar (search, `FacetFilter`, `ColumnsPicker`), chip bar, `Table` (cards on phone), `BulkBar`,
  `RowMenu`, `DetailDrawer` with previous and next, `CreateDialog`. Per-entity parts live in one
  config file (`customers.list.ts`: columns, facets, tabs, row and bulk actions).
- **D33 Four things the admin console lacks, in v0:** `FileUpload`, `Stepper` (with "save then watch" as a step
  kind), `WorkflowStatus` (timeline plus allowed transitions as confirmed actions), `useLiveForm`
  (save sends only touched fields, a push refills only untouched ones).
- **D34 Other admin console pieces generalised:** `RangePicker`, `CountedTabs`, `ColumnsPicker`,
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
  an earlier operations repository: the root `CLAUDE.md` is the L0 routing table (task shape to
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
  session the request has. After a redirect logout nothing serves an identity until the page
  shows it lives on: a `pageshow` from the back/forward cache, or the next change the app asks for. govengers/auth also changes the identity without a 401 or 4401 (an
  impersonation past `MaximumDuration` ends in place; another tab signs in or out), so
  `check()` re-reads `/auth/me` on tab or window focus and every minute while impersonating,
  takes the fresh identity (roles, name) and builds a new pair only when the key changed. The anonymous pair's unauthorized callback is ignored.
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
  forgotten on close, on a new connection (another identity) and when the connection ends; a
  create answering after
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

## Product pieces (16.11.2026)

- **D62 Release notes come from the changelog files, shown once per user per minor line.** A
  project keeps `changelog/<major>.<minor>.md` (`# M.m - Title`, `## M.m.p - YYYY-MM-DD` per
  patch, groups `### Features | Fixes | Changes | Security`), parsed by the `ui/changelog.ts`
  module, which refuses anything else with `file:line` (a hyphen, en or em dash all count, so a
  file is never dropped over the dash). `parseChangelogs` collects errors instead of throwing,
  so a typo fails the project's test, not the running app. The pure `decideWhatsNew` shows the
  running minor line when the user last saw an older line and the line has a Features item; a
  first visit stores the line silently, a patch never shows, a dev build never shows. WhatsNew
  takes the parsed lines and `readSeen`/`writeSeen` callbacks (default localStorage, once per
  browser; a user setting makes it once per user) instead of slotted notes and a stored version,
  and belongs in the shell, so the Dashboard recipe no longer mounts it. The `Changelog` page
  recipe renders every line. Bullets are plain text: no markdown renderer for a list of
  one-liners.
- **D63 UpdateHint compares versions and never reloads by itself.** The bundle's version against
  the server's, from a value a live read pushes or a `check` function (a version endpoint or a
  read) run every 15 minutes while visible, on tab focus and on socket reconnect (a deploy
  restarts the server, so every client reconnects), at most once a minute (half the interval
  when shorter), and a trigger inside that gap runs once at its end. Any known version
  other than the bundle's counts, a rollback too; `dev` and friends never do. An info banner with
  Reload; a dismissed hint returns only for yet another version. Reloading on its own would drop
  what the user is typing; chunk-load failures stay the app's `vite:preloadError` handler.
- **D64 NotificationInbox: one list, an optional count read, optimistic marks.** The popover
  reads the newest `limit` rows through one `useLiveList` (no per-state lists, the runtime's
  optimistic upsert reaches every list of a target); the true unread total is a separate object
  read (`{ unread }`), else the bell counts the loaded rows and says `3+` when that is a lower
  bound. Mark read is the runtime's optimistic upsert; mark all marks the ids of the rows it showed
  (not a createdAt threshold: a row committed later may carry an older time), keeps them, takes
  them back on error, and forgets them when the connection changes. Mark all is disabled only
  when the count read or the complete list proves nothing is unread.
- **D65 FeedbackCapture sends exactly what it previews, redacted at entry, over REST.** A ring
  buffer (`installFeedbackBuffer`, 50 entries) wraps console error and warn, `fetch` (not-ok
  answers and network failures) and the uncaught error events, and redacts on entry: secret keys
  masked with their subtree at any depth (also inside text that is JSON, or JSON in JSON, which
  is parsed and redacted as a value), `key=value` with an object value's whole subtree, header
  lines to their end, bearer tokens, JWTs and URL user info scrubbed from text, a console line
  per argument and then as the whole printed line; the page URL keeps no query or fragment
  value, a failed request's URL keeps the values that name no secret except `code`, `key` and
  `state` (filters and pages are what a bug report needs). `push` redacts too. The dialog freezes buffer, environment
  and the optional screenshot (taken before the dialog shows) on open; `buildReport`
  deep-freezes the body the preview prints and Send posts. Unticking details removes them from
  both. Sent through `pair.client` (REST) because the socket is often what is broken. The
  screenshot is a hook given 3 s, so the block carries no dependency and a hanging hook cannot
  keep the dialog shut; D34's `html2canvas-pro` is the project's choice.

## Board, markdown and palette (16.11.2026)

- **D66 Markdown brings `marked` and `dompurify`.** The `Markdown` block is the second block with
  dependencies of its own (D3): `marked` renders GitHub-flavoured markdown through a dedicated
  synchronous instance, `dompurify` sanitises through a private instance (its hooks never touch
  another piece's purifier). Raw HTML in the source is shown as text, not sanitised HTML; links to
  another origin open with `noopener noreferrer nofollow`; images load only from relative,
  http(s), `blob:` and raster `data:image/` URLs. Without a working DOM the renderer escapes the
  text instead of returning unsanitised HTML. Sanitiser tests run on `jsdom` (dev dependency, the
  DOM DOMPurify supports); `happy-dom` let `javascript:` links through in the first run.
- **D67 A board is one live list.** `Board` subscribes the whole board with one `useLiveList`
  and groups and orders on the client. The runtime upserts an optimistic item into every live list
  of its resource regardless of filter (D36 of livewire), so per-column subscriptions would flash a
  moved card in every column. A move sends a numeric rank, the midpoint between the new
  neighbours (1024 past an end), plus the neighbours' ids; renumbering a crowded column is the
  server's job. One drag engine on pointer events serves mouse, pen and touch (touch from the grip
  only, so the board scrolls); the keyboard path lifts on the grip and the menu path ("Move to")
  needs no drag at all (D9).
- **D68 The palette searches with one-shot queries.** `CommandPalette` reads each search group
  with `connection.query`, not a subscription: results need not be live, and a subscription per
  keystroke would churn the server. Its quick actions are the bound agent actions without
  params (D24, D48), so the palette, the dock and the driver share one vocabulary.

- **D69 Mounted tests for what only shows mounted.** D16 kept component tests out; the first
  review of Board, Markdown and CommandPalette found focus loss, a lift without an end, a file
  drop left to the browser and a pick lost to a full storage, all invisible to model tests.
  `bun test` now preloads `scripts/test/setup.ts` (`bunfig.toml`): a jsdom document as the global
  DOM and a loader compiling `.vue` script and template (no styles). `scripts/test/mount.ts`
  mounts a piece with vue-i18n and a pair on a fake engine without latency. A piece gets a
  `<Name>.mounted.test.ts` when it has behaviour a user meets through events: focus, keyboard,
  events, storage, identity switches. Logic stays in model tests (D16); layout, scrolling and
  CSS states stay with local browser probes, out of CI. Budget: the whole suite under 2 s, no
  browser in CI, debounces driven by fake timers, never by waiting.
- **D70 Images in rendered markdown load from the page's own origin.** `createMarkdownRenderer`
  takes `imageHosts` (origins); other absolute image sources lose their `src`. Markdown written
  by another user or by an agent that read hostile content would otherwise make every reader's
  browser call a foreign host (tracking, exfiltration in the URL). Supersedes D66's
  "http(s) images".

- **D71 A board's lift aims between two cards.** A pointer or keyboard lift keeps the ids of the
  cards above and below its target, and the spot is computed from them on every render (`resolve`
  in `board.ts`; a neighbour gone falls back to the other, then to the index). A position number
  meant something else once another user's card arrived above it: the drop landed elsewhere or
  read as cancelled, and Vue moved the lifted element, which loses focus in Chrome and ended the
  keyboard lift. The hidden origin of a pointer drag sits where the list has the card, not at a
  remembered index. Amends D67.

- **D72 A lift not moved yet sits where the list has the card.** Until the first arrow key or
  pointer move, a lift's target is the card's own spot in the current list (`home` on `Lift`),
  not the cards around it at lift time. A card another user put between the card above and the
  lifted one would otherwise draw the lifted card above it and turn a put-back into a move.
  Amends D71.

## Sync with the libraries (16.11.2026)

- **D73 The runtime is vendored from a livewire commit until it is released.** `demo/src/api/`
  holds livewire `main` at 95e50bc (after v1.0.1, PR #13 merged, no tag yet), header naming the
  commit; the next tag replaces it byte for byte. Amends D40. With it the collection drops its
  workarounds: `useLiveList` keeps the rows and total of a changed query until the new first page
  and drops them on the connection's end (livewire D76, D83), so `SearchTable` and `Board` read
  `list.items` and `total` directly instead of holding the last rows per connection; the generic
  `ListQuery`, `FilterDocument`, `SearchableFilterDocument` come from `runtime.ts` (livewire D78),
  so `SearchTable`, `Board`, `NotificationInbox`, `CommandPalette`, `FacetFilter` and the demo's
  `api.ts` stop redeclaring them.
- **D74 The starter shell mounts the product pieces.** `templates/project/App.vue` mounts
  `WhatsNew`, `UpdateHint`, `NotificationInbox`, `FeedbackCapture`, `ImpersonationBanner` and
  `CommandPalette`, each as one marked block (import, state, tag) a project deletes when its
  server side is missing; `main.ts` installs the feedback buffer, `changelog.ts` and
  `changelog/0.1.md` feed WhatsNew. start-project stage 02 names what each needs from the
  backend and asks which to keep. `scripts/template-check.ts` stands the generated `api.ts` in
  with `scripts/fixtures/api.ts` (the declarations the shell names, excluded from the root
  type-check because its `./runtime` exists only in the target) and parses the starter
  changelog. Removal is a deletion, not a configuration flag: one way per job (P2).
- **D75 JobProgress shows govengers/jobs' job view.** `JobLike` is the part of
  `postgresadapter.View` the block reads: status `cancelled` added, `progress` nullable (an
  indeterminate bar until the first report, never 0 %), `progressMessage`, `result`, `error`,
  `errorClass` (a sentence for `permanent` and `lease_expired`), `cancelRequested` (badge
  "Cancelling"). Cancel and Retry are bound to the mutations `livewireadapter` declares
  (`cancelJob`, `retryJob`, props, `data-action` = their names), shown only when the page passes
  them and the status allows (cancel while queued or running without a pending cancel, retry
  when dead). The result comes from the item read, as the list leaves it out: a list row that
  succeeded without one reads its item once (a finished job does not change), and a page's
  `resultRoute(result, job)` turns it into the "Open result" link; a `result` slot shows a
  summary. The view has no `resultRoute` field, so D29's row field is gone. The fake engine's
  jobs follow the view (list items without result, cancel and retry with govengers/jobs' 409s).
- **D76 FileUpload counts the bytes it sends.** `Client.upload`'s `onProgress` (livewire D79)
  drives the bar; it stays indeterminate where the runtime cannot report (bun, `credentials:
  'omit'`, an application fetch such as the demo's). Server rows no longer carry progress. A
  server pushes the file's row before its answer arrives, so until the answer a row that joined
  the list after the upload started, with the file's name and size, hides behind the upload; the
  answer's id then hands over to the row. The fake engine inserts the row at the end of the body
  and scans it afterwards (`scanning`, then `ready`).
- **D77 LoginPage's `change` is optional.** Without it there is no change-password screen
  (`state="changePassword"` shows the sign-in) and the starter router passes none, because
  govengers/auth has no change-password route; `LoginRoute.vue` binds `loginProps` whole, so a
  project that adds `change` there gets the screen.
- **D78 The impersonation end comes from govengers/auth.** auth D70 answers
  `impersonationEndsAt` on `/auth/me` while impersonating; `SessionIdentity` documents it and the
  banner counts down without app code. `endsAt` stays as an override for older auth releases. An
  unreadable end is no countdown, not an ended impersonation. Amends D59.
- **D79 Mounted tests have a router and cover the page recipes.** `scripts/test/mount.ts`
  installs a memory router (links render, navigation goes nowhere) and `setup.ts` exposes jsdom's
  `history`; `bun test` runs `pages` too, so recipes get mounted tests like blocks (amends D69).
- **D80 JobProgress takes the generated job view, per run and per job.** `JobLike.status` and
  `errorClass` are `string`: livewire generates a named Go string type as `string` unless the
  application lists it as an enum, so a union would reject the default client; an unknown status
  shows as it is in a neutral badge. `done` fires once per run, not per id: a job seen unfinished
  again (Retry) reports its next end. A refused Cancel or Retry belongs to its job id and
  connection. A list row's result read lost with the socket runs again once the socket is open; a
  refusal stays final. A refused changed query in SearchTable and Board keeps the rows of the
  query before under the banner (livewire D76); the cards say so. The starter mounts after
  `router.isReady()`, so the first render knows the route's `meta.public`. Amends D74, D75.
- **D81 A lost result read is shown, and the starter mounts on a failed first navigation.** A
  JobProgress list row whose result read was lost with the socket says so with Retry
  (`data-action="retryResult"`, in the actions row: the inline alert clips its overflow) besides
  reading again once the socket is open: a page without a
  live read leaves the socket idle after the drop, so it never opens by itself, and a retry on
  its own timer would loop while the network is down. A status is looked up in the block's own
  badges only (`Object.hasOwn`), so `constructor` shows as it is. The starter's
  `router.isReady()` failure (a route chunk lost after a deploy, a guard answering `false`) is
  logged and the shell mounts anyway, so UpdateHint and the nav stay. Amends D80.

## Neutral examples (16.11.2026)

- **D82 The collection names no private project.** The repository is public, so cards, comments,
  decisions, knowledge notes, workbooks and demo data describe where a design came from in
  neutral words ("an earlier data-heavy admin console", "an earlier product") or cite a decision
  number instead of naming the project, its owner or its customer. Demo data uses invented
  companies and common cities; the screenshots of the demos whose data changed were rendered
  again. This is the one exception to "decisions are never edited": the wording of D1, D8, D17,
  D31 to D34 and D53 was changed in place, their content and reasoning were not.
