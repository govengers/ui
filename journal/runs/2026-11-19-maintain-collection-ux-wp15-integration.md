---
date: 19.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 5 h
groomed: no
---

## Task
UX hardening pass, work package WP15 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): apply the
handover blocks of WP03 to WP14 (decisions, journal lines, README names, TODO lines, keys), the
change lines the reviews collected for this package, the gates, a fair before and after of every
screenshot against `main` (d353ef1), the browser checks of step 4 and a ruling on the test suite's
time budget. Branch `task/ux-wp15` from the integration branch at 8ec7564; it ran alone.

## Applied per package
- WP03 Tooltip: D90 (handover text), journal line, README name, TODO lines (laws `applies`, the
  owner question on the delay); the note on the panel's ground went to the WP16 section of the plan.
- WP04 Button: D91, journal line, TODO lines (ApiKeyCreate and WorkflowStatus focus, busy flags in
  submit handlers, the reduced-motion owner question), the Firefox and Safari hold and the window
  switch into plan section 12. FileUpload Retry: no change, as the handover rules.
- WP05 Shell: D92 (handover text plus the bottom stacking built here), journal line,
  `--ui-sticky-top` on Dialog and Sheet (DetailDrawer through Sheet), the Table gotcha,
  `--ui-tabbar-h` and `--ui-sticky-bottom`, `--ui-button-ghost-ink` (D102), the AgentDock demo's
  dead class, TODO lines (held Enter and double click on Sheet and Dialog openers, the laws notes,
  the count badge), the iPhone double tap and the 10 to 40 ms press into section 12.
- WP06 Toast, Dialog, Menu: D93, D94, journal line, WorkflowStatus and ApiKeyCreate keep their view
  while the dialog leaves, the toast's hover pause on touch, the harness cleanups, TODO lines
  (inline preview Escape, popover stubs, peak-end note). The Dialog card's pointer to the list
  pattern's "Deleting" section resolves (the section exists). The Toast demo is no longer wider than
  a phone (probe below).
- WP07 Controls: D95, journal line, README name RadioGroup, TODO lines (Select card, Checkbox
  required and refused update, SettingsPage demo's missing Profile tab, laws `applies`). The
  SettingsPage demo no longer overflows at 390 px (probe below).
- WP08 Live forms: D96 (plus the press endings built here), journal line, SettingsPage
  `leaveGuard: false`, ActionBar's scroll padding. The `logout()` line was done by WP13.
- WP09 Table: D97, journal line, the screenshot script's placeholder line, the nested sticky lines,
  TODO lines (SearchTable demo's page size, live text in two screenshots, the direction button).
- WP10 ListPage: its decision as D101 (plus SearchTable's step back), journal line, the demo widths
  (Input, Sheet, RangePicker, Dashboard), the SearchTable step back, the harness shims, the suite
  ruling, TODO lines (Pagination and ListPage size for the owner, sort row on an empty list, focus
  on a removed row, a link with `page` and a facet).
- WP11 AgentDock: D98 (plus the log's name), journal line, `ui.conversation`, the ResizeObserver
  stand-in, the Android keyboard and the screen-reader entries into section 12, TODO line on
  `aria-busy`.
- WP12 Upload: D99, journal line, TODO lines (demo sections, the fake engine's key, FileUpload size
  and offline reason and double remove, the Input value attribute). The toast queue reset between
  files landed with WP06's harness.
- WP13 Palette, starter: D100 (plus the keys), journal line, `ui.keyCtrl` with its two readers, the
  sign-out keys with their readers (`logout` takes the shell's `t`), TODO lines (hash on the first
  load, reload position). The title truncation line was done by WP05.
- WP14 Notes: journal line; Skeleton reads `--ui-loading-delay` (confirmed), so the "Which loader"
  clause stays; TODO lines (review-ui stage list, Board refusal).

## Change lines from the reviews (each with its outcome and check)
- ActionBar covers a focused field: done. `:root:has(.ui-action-bar[data-sticky])` sets
  `scroll-padding-bottom` to the bar's height plus `--ui-sticky-bottom` and `--ui-space-3` (81 px
  bare, 135 px over the phone bar). Probe, 390 by 844 touch, field 16 of a scratch form, script focus
  and native validation, the field in the strip under the bars, just above the bar, below the fold:
  12 of 12 cases clear of the bar in the shell and bare (before: 4 of 6 covered in each, field
  800..844 under the bar from 775).
- LiveForm `settle` held by a press that never ends: done. A context menu or the window's own blur
  empties the pressed pointers and settles; tests for pointercancel, contextmenu, the window's blur,
  an element's blur (does not end it) and the removal of all five listeners; each of 8 mutants
  fails a test. Not run in a browser: a release that never arrives cannot be produced headless.
- SettingsPage `notifications` `leaveGuard: false`: done, with the handover's comment. Mounted
  test (an unload while a switch saves is not prevented, fails on revert); browser: a switch, then a
  link at once: 0 prompts (before: 1).
- Dialog exit shows reset content: done. WorkflowStatus keeps title, sentence, tone and error until
  the next open; a press on its confirm while it leaves runs nothing. ApiKeyCreate forgets the
  secret at close and keeps the secret's layout, emptied, until the next open (a flag, no timer).
  Frames during the exit (1440 px): WorkflowStatus "Cancel order", danger, 198 px in all 16 frames
  (before: an empty default title, 142 px); ApiKeyCreate "Your new API key", field empty from the
  first frame after Done, no form, 237 to 238 px (before: the create form, 476 px); the secret is
  in no frame after the press and not in the DOM afterwards. Three mounted tests, each fails on
  revert, one on a leak of the secret into the field.
- `--ui-sticky-top` on the scroll boxes of Dialog, Sheet, DetailDrawer: done with WP05's flush
  values instead of `0px` (minus the body's top padding), plus `--ui-sticky-bottom`. Probe below.
- `scripts/screenshots.ts` stops the placeholders' appear animations: done. The Table picture shows
  the Email and City placeholders, the script of 8ec7564 renders them blank (looked at both).
- Plan 6.4 `cancel` type: done.
- README and CLAUDE.md name `just touch-probe` and `scripts/tokens.test.ts`; CLAUDE.md rule 3 names
  the new lint rules: done.
- Test suite duration: ruled, see "Suite ruling".
- `ui.keyCtrl` and its two readers, `ui.conversation`: done. MarkdownEditor names the key in the
  locale ("Fett (Strg+B)") and with the command sign on Apple platforms ("Bold (⌘B)"), the starter's
  palette hint likewise; mounted tests fail on revert. The starter's App.vue readers are checked by
  `template-check` (vue-tsc in a scaffold) only.
- SearchTable direction button without `aria-pressed`: owner question, a `TODO.md` line marked owner.
- Starter sign-out with the real leave guard: done as three cases in `scripts/starter-signout.test.ts`
  that mount `useLeaveGuard` itself on the starter's router: an edited form and Cancel keep the
  page and the session (0 requests), OK and a clean form end it (1 request, signed out). Both edited
  cases fail when the guard never asks. The full path table of the WP13 reviews (lost chunk,
  throwing guard, slow and refused logout, two tabs) was not repeated in a browser.
- FileUpload Retry focus: no change, ruled in WP04's handover (a loading Retry would hold the focus
  only until a success removes it, so focus would move later, at a moment the user did not act).
- Android keyboard after Stop: plan section 12.
- Toast queue between test files: already done by WP06's harness reset (`scripts/test/setup.test.ts`).
- Harness cleanups: done. `scripts/test/setup.ts` gives every test a modal dialog (attribute and
  close event) and a ResizeObserver stand-in (`scripts/test/resize.ts`); SettingsPage, ListPage,
  ApiKeyCreate and AppShell drop their dialog shims, Tabs and AgentDock their stand-ins, the Toast
  file its frame shim and queue clearing, ApiKeyCreate its id mark. `place.test.ts` needed nothing:
  the harness empties the body.
- After every merge, the gates: run below.
- Demos wider than a phone: done. Input's sizes row wraps, an inline Sheet does not slide in,
  RangePicker's range wraps in its button, Dashboard's column is `min(18rem, 100%)`. Probe: every
  demo at 390, 360 and 320 px, touch, widest `scrollWidth` per frame for 600 ms and settled: none
  wider than the viewport (with the four changes reverted: Input 672, Sheet 708, 648, 568,
  RangePicker 363 at 360 and 320, Dashboard 337 at 320). SearchTable's page past the last steps
  back (offset mode); a mounted test fails on revert; two ListPage cases that built that empty
  page changed to build an empty filtered list (Clear filters) and the step back (delete), and fail
  on revert.
- ListPage delete confirm with the real exit fade: checked, "Delete 2 customers?" in all 23 frames
  of the exit.
- Toast on touch: done, the pause on hover only under `(hover: hover)`. Browser, 390 touch: a toast
  tapped on its text (host `:hover` true afterwards) is gone 5.6 s later (before: still there);
  mounted tests for a mouse (pauses) and a touch screen (does not), the touch case fails on revert.
- Screen-reader entries (toasts as named groups, the dock's streaming log): plan section 12.
- `--ui-button-ghost-ink`: done (D102), probe below.
- Double tap on More on an iPhone, the 10 to 40 ms press: plan section 12.
- AgentDock demo `on-chrome`: removed. The committed AgentDock pictures were 721 px high, as a render
  of `main` on this machine; the branch renders 773 px, the stream row WP11 added above the frame.
- Decision numbers: D101 and D102 written, WP16's two renumbered to D103 and D104 in sections 6.5,
  7.1 and WP16.

## Browser checks (Playwright's cached Chromium 156.0.8078.4, one-off scripts outside the repository)
- Touch probe `just touch-probe --all`: 61 demos, 2 densities: 0 offenders, 0 smaller than known,
  0 stale entries, 46 known, 14 exempt (exit 0).
- Sticky header, AppShell demo's fixture (1440 px, both densities): the top bar at the frame's top
  (365 under a frame at 364 with its 1 px border), the header row at 421 = the bar's bottom after
  300 and 700 px (compact 429 = 429). Nested, scrolled 300 px: Dialog widened to 70rem, header 77
  at a body top of 77 (compact 71.5 at 71.5); Sheet 60rem, 56 at 56 in both densities (before: 149
  under 77 and 132 under 56, a top bar's height too low).
- Top bar ghost Search of the AppShell demo, light: at rest 16.97:1 (250 on 24), hovered 16.12:1
  (24 on 244); dark 16.97:1 and 14.27:1; the account Popover's Sign out 10.44:1 light, 11.99:1 dark
  (its `--ui-ink-2`).
- `--ui-button-ghost-ink` by pixels (scratch fixture, 1280 px, deviceScaleFactor 2): a neutral Badge
  inside a top-bar ghost Button, neutral light 9.50, dark 10.08; paper light 8.18, dark 7.41; slate
  light 9.65, dark 9.68:1 (integration head: 1.05, 14.27, 1.11, 12.37, 1.02, 14.07, the Badge
  painted in the chrome's ink). The ghost Button at rest 16.97, 7.88, 17.06:1 and hovered 16.28 and
  14.27, 12.70 and 10.55, 15.73 and 14.07:1, identical before and after; Sign out in a Popover in the
  slot unchanged (10.44 to 11.99, 8.36 to 9.06, 10.72 to 11.19).
- Reduced motion (`reducedMotion: 'reduce'`): Table, Skeleton, Toast (a neutral and a danger toast
  fired) and Dialog (opened, and 30 ms into its close): the longest transition of any element,
  `::backdrop` included, 0.01 ms; 0 running animations, during and 600 ms after.
- Hover guard, 390 touch: a tap on a secondary, ghost and primary Button and on an unselected Table
  row leaves the background as before the tap (`:hover` still matches; the rules sit under
  `(hover: hover)`); with a mouse the row's cells turn `--ui-surface-2`.
- Phone shell at 390 touch: four tabs and More (Dashboard, Customers 12, Orders, Files); More opens
  the sheet "More" listing Settings; a tap on it navigates to its route and no dialog stays open.
- Bottom stacking, scratch fixture at 390 by 844 touch, page scrolled 300 px: the ActionBar 721..790
  over the bar 790..844, a tap at the first tab's centre hits the tab (before: ActionBar 775..844
  over the bar, the tap hit the ActionBar); with the root text at 125 percent the ActionBar still
  ends where the bar begins; `bare`: the ActionBar at 775..844, token `0px`; the collapsed dock strip
  742..790 on the bar 790..844 (before 752..800, 10 px into every tab).

## Pieces whose look moved
Rendered against `main` d353ef1 in a temporary worktree outside the repository (removed), both with
this package's screenshot script, same machine and browser; pictures and the per-file pixel
differences in the owner's output folder (`moved.txt`). 64 files moved: the dark pictures of
ActionBar, AgentCursor, Banner, Card, Checkbox, ColumnsPicker, CommandPalette, ConnectionBanner,
DetailDrawer, DetailPage, DevLogin, Dialog, EmptyState, FacetFilter, FeedbackCapture, FileUpload,
ImpersonationBanner, Input, JobProgress, LiveForm, LoginForm, LoginPage, Markdown, Menu,
NotificationInbox, PageHeader, Pagination, Popover, RangePicker, SettingsPage, Sheet, Spotlight,
Switch, UpdateHint, WhatsNew, WorkflowStatus (34 of these 36 at most 6 of 255 per channel on the
controls: the dark `--ui-border-strong` of D85, AgentCursor and Spotlight 2 of 255; FeedbackCapture
and WorkflowStatus besides by up to 211 and 159 of 255 in live text, a number and a time of day,
corrected in the fix round); both pictures of AgentDock,
AppShell, Avatar, Button, SearchTable, Table (new size: new sections or rows), DetailForm, Field,
ListPage, Select, StatusTile, Stepper, Textarea, Toast (visible changes: the field error icon, the
period, demo rows); the dark Dashboard picture did not move. New: RadioGroup, Tooltip. 54 files
kept: 49 byte-equal, 5 different only in live text that also differs between two renders of the
branch (Dashboard dark, FeedbackCapture light, Menu light, NotificationInbox light, WorkflowStatus
light).

## Suite ruling
Measured with no other build or test running on this 18-core machine (load average 5 to 9 from
other sessions). One process, 646 tests at 8ec7564: 3.56, 3.73, 3.59 s fixed order; 3.55, 3.48,
3.51 s random. Per file (JUnit): ListPage 0.58 s, AppShell 0.46, Board 0.39, AgentDock 0.33,
FileUpload 0.25, the rest under 0.16; start-up 0.15 s; `.vue` compiling about 0.3 s of CPU.
`settle()` was called 463 times and spent 1.84 s, nearly all of it waiting on 0 ms timers that Bun
runs after about 1.1 ms (the fake engine answers on them too); skipping rounds with no 0 ms timer
pending saved 0.15 s, so it was not kept. Ruling: the 2 s budget of D69 and section 10 holds for
`just test`, which now runs four workers with the harness's reset in each (`--parallel=4
--no-isolate`): 661 tests in 1.35 to 1.38 s fixed, 1.35 to 1.53 s random. In one process, the
order check and what the remote CI runs, 661 tests take 3.58 to 3.79 s fixed and 3.58 to 3.75 s
random; that number is stated in section 10, not budgeted. No test was removed or shortened.

## Gates (results, final state)
- `bun install --frozen-lockfile`: no changes. `just index`: INDEX.md unchanged (no card's front
  matter changed), so nothing to commit.
- `just ci`: exit 0 (INDEX.md is current, 192/192 pairs pass, 0 undeclared pairs in 66 style
  sources, ui-lint clean twice, template-check, 661 pass 0 fail, build).
- `bun scripts/screenshots.ts --check`: "every demo has its light and dark screenshot", exit 0.
- `bun test --randomize scripts ui pages demo/src`, ten runs: 661 pass, 0 fail each, 3.58 to
  3.75 s (seeds 1050454313, 516974011, 329429003, 2837263188, 3903805678, 3085640701, 3325964442,
  1910400332, 1952131996, 3367273444).
- `just touch-probe --all`: exit 0, 0 offenders, 0 stale.

## Touch probe `known` (for the owner's summary)
- AgentDock: the composer's textarea, 255 by 42 (compact 271 by 42).
- FacetFilter, both densities: each chip's is / is not toggle 18.5 by 44 (pressed: 44.2 by 36), its
  remove button 30 by 44, a short value button 32.4 by 44 (four chips in the demo).
- LoginForm, both densities: "Forgot password?" 115.2 by 21, "Create an account" 118.2 by 21.
- Changelog: five version permalinks, 40.6 by 20 (compact 38.3 by 18.8).
- ListPage, both densities: the chip's toggle 18.5 by 44, its remove button 30 by 44.
- LoginPage: "Forgot password?" 115.2 by 21; three "Imprint" links 51 by 24 (compact 48.2 by 22.5).

## What went wrong on first try
- A mounted test pressed a Button right after `nextTick()` -> the press did nothing about one run in
  three -> Vue ignores an event stamped in the millisecond its listener was attached; wait a task
  (`settle()`) before a press on something just rendered.
- A failing `toEqual` on an array holding a jsdom element ran for minutes printing the element ->
  compare `element === null` instead.
- The first sticky check compared the bar with the frame's border box -> the bar starts 1 px lower,
  at the padding edge.
- The first ghost-ink pixel read took the chrome at a pill Badge's rounded corners for its ink ->
  crop the corners.

## Instructions that were wrong or missing
- plan 7.1: `justfile` belongs to WP01 only / the suite ruling needed it (fixed now: yes, section 15
  and the as-built note say so).
- WP05 handover: `--ui-sticky-bottom` set by AppShell on its root element / the page's scroll padding
  sits on the document root and cannot read it there; set on the root (fixed now: yes, D92 and the
  as-built note).
- extras: `--ui-sticky-top: 0px` for Dialog, Sheet, DetailDrawer / measured flush values are minus
  the body's padding, as the WP05 handover said (fixed now: yes).

## Questions I had to ask the human
- none

## Pieces that did not fit
- Toast: on a phone inside AppShell the toasts sit over the bottom bar (TODO line).
- AppShell: only a sticky ActionBar sets the page's scroll padding; the top bar and the phone bar
  alone can still cover a focused field (TODO line).

## Gate friction
- `just ci` stays without `screenshots.ts --check`; it was run by hand.

## Time sinks
- The fair before and after: 118 files compared byte for byte, then by pixels, and two renders of
  the branch to tell live text from a change.

## Suggested improvements (for grooming)
- script: `scripts/screenshots.ts` could render a demo twice and report pictures that differ between
  the two, so a pixel compare can tell live text from a change by itself.
- harness: a `press(element)` helper in `scripts/test/mount.ts` that waits a task before it clicks
  would make the Vue same-millisecond rule impossible to trip.
- workbook `maintain-collection` stage 04: name `just test` (four workers) and the single-process
  random run as two different checks.

## Fix round (19.11.2026)
The review approved with 1 DESIGN and 11 MINOR findings; this round works off all twelve. No review
follows, so the measurements below are the proof. Browser checks in the same Chromium, the scratch
fixture extended with a Sheet and a Dialog (with and without actions) each holding 16 fields and a
sticky ActionBar; "before" is the file at 481830e.

- SearchTable, false empty state and capped total: an empty page of a list whose total is above 0
  shows placeholders until it stepped back; the step back acts only on an empty page (`count === null
  || shown > 0` returns). The tried patch also waited for `stale`; dropped, because a stale state
  either still shows the rows before (D76) or has no total, so the term never decided anything and
  each remaining guard is pinned by its own test. Tests: the emptied last page never renders the
  `empty` slot (fails without the placeholders); a link to `?page=6` with a total capped at 11
  keeps page 6 and its 3 rows (fails without the rows guard; the pair's socket caps every `total` as
  a count cap answers); a list whose connection ended keeps `?page=3` (fails without the null guard);
  the earlier step-back tests and both ListPage cases still fail without the step back. ListPage
  demo, last page of 6 rows deleted one by one, frames after the last confirm, 1440 mouse and 390
  touch: 1 row, from 53 (57) ms placeholders and no empty state, from 212 (218) ms 25 rows; before:
  "No customers match" with 0 rows between.
- ActionBar in a dialog: the page's rule skips bars in `dialog` and `[popover]`; a Dialog's or
  Sheet's body holding a sticky bar gets the same padding with `max(0px, --ui-sticky-bottom)`, as
  tried. Measured, 390 touch and 1440 mouse, Sheet and Dialog, field 16 in the strip under the bar,
  just above it and below the fold, by script and by native validation, and Tab through all 16
  fields: covered 0 px in all 28 checks (before: 44 of 44 px at 390, 40 of 40 at 1440, in the strip
  and on Tab). A page whose only sticky bar sits in a closed dialog: root padding `auto` (before 135
  px at 390, 77 at 1440). The 12 page cases again (shell and bare, script and native validation,
  three positions): all clear, stacking unchanged (ActionBar 721..790 on the bar 790..844).
- Dialog without actions: `.ui-dialog__body:last-child` sets `--ui-sticky-bottom` to minus the
  panel's end padding, as tried; the sticky bar ends 0 px above the body's edge after 300 px of
  scroll at 390 and 1440 (before 20 px, with rows in the band).
- ApiKeyCreate: `:persistent="showsSecret"`, as tried; frames after Done: 265 px, no X, Copy and Done
  throughout at 390 (before 265 to 270 px with the X); 1440 236 to 237 (sub-pixel), no X. Test: no X
  and the actions Copy and Done after Done (fails with `secret !== undefined` and with the actions on
  `v-if="secret"`). WorkflowStatus, not tried by the review: the confirm view keeps whether a call
  runs, so a confirm that succeeded fades with its spinner, a disabled Cancel and no X (before at 390:
  back to 205 px with the X and an enabled Cancel); a test fails on each of the three reverts.
- Safe area: the card's recipe (padding on the nav) squeezed the tabs. Better than a recipe the
  project cannot apply against the shell's scoped rule: the phone bar pads `env(safe-area-inset-bottom)`
  under its tabs and counts it in the root token (0 unless `viewport-fit=cover`). Without an inset
  nothing moves: tabs 53, 66.5 and 107 px in bars of 54, 67.5 and 108 px at text 100, 125 and 200
  percent, both densities. With the inset simulated at 34 px (the `env()` replaced in a scratch
  copy): bar 88 px, tabs 53 px at its top with labels ending at 802 above the inset, no overflow,
  ActionBar 687..756 on the bar; at 125 and 200 percent the same. A real `env()` was not measured.
- Root token: a `nav` without items now shows no bar on phones and sets no token (before: an empty
  54 px bar and the ActionBar lifted onto it). A framed non-bare shell still lifts the page's own
  sticky ActionBar (measured: page bar 721..790 with a framed shell, 775..844 without): a card
  gotcha and a `TODO.md` line, because moving the token onto the shell would need the shell to
  compute the page's scroll padding, repeating ActionBar's height formula.
- Tests pinned: ApiKeyCreate's actions during the fade, the starter's Retry passing `t` on (a second
  refusal is worded by the shell's translation; fails when Retry passes another `t`), the null-total
  guard (above).
- Run report and `moved.txt`: 34 dark pictures differ by at most 6 of 255; FeedbackCapture and
  WorkflowStatus dark also by up to 211 and 159 in live text.
- Toast on hybrid devices: a `TODO.md` line (read, not measured), no change.
- DESIGN, ruled by the dispatcher: `just ci` runs `just test-ci`, the remote CI's command (one
  process, fixed order), so the local gate equals CI again; `just test` stays the four-worker edit
  loop; `package.json`'s `test` is the CI command again. D103 amends D69 with the numbers (665
  tests: `just test` 1.37 to 1.38 s, random 1.38 to 1.49 s; `just test-ci` 3.69 to 3.75 s); WP16's two
  decisions move to D104 and D105 (plan sections 6.5, 7.1 and WP16). The README names Bun 1.4.4 or
  later, the version measured; older releases were not tried. `package.json` has no `engines`
  field, so none was added.
- Screenshots: every demo rendered again; against the branch's earlier render only live text, 1 of
  255 of anti-aliasing and 9 px of one Button field's edge (equal between two renders today) differ,
  so no committed file changed.

Gates of the round: `just index` leaves INDEX.md as it is; `bun install --frozen-lockfile` no
changes; `just ci` exit 0 (INDEX.md is current, 192/192 pairs pass, 0 undeclared pairs in 66 style
sources, ui-lint clean twice, template-check, `bun test scripts ui pages demo/src` 665 pass 0 fail
in 3.75 s, build); `bun scripts/screenshots.ts --check` exit 0; ten `bun test --randomize scripts
ui pages demo/src` runs 665 pass 0 fail each, 3.69 to 3.83 s; `just touch-probe --all` exit 0 (61
demos, 0 offenders, 0 smaller than known, 0 stale entries, 46 known, 14 exempt).

What went wrong on first try: the first exit sampler deduplicated states with a set, which hid the
X coming back after a state that looked like the first one; consecutive states are compared now.
