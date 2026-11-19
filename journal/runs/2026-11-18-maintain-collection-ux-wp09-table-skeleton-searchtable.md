---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 2 h
groomed: no
---

## Task
UX hardening pass, work package WP09 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): Skeleton
waits for `--ui-loading-delay` (`06-B`), Table's loading rows are Skeleton (`06-A`) and follow
`loadingRows` (`06-C`), the sticky header sits at `--ui-sticky-top` (`09-N`), the 44 px sentence
(`09-K2`), SearchTable's sort row and Select all in card mode (`09-F`) and `searchLabel` (`11-D`).

## Measurements
All in one-off Playwright runs against the demo (not committed), Chrome on this machine.
- Before the change (`06-A` step 1), Table demo, `reducedMotion: 'reduce'`: `.ui-table__shimmer`
  computed animation `ui-table-shimmer 1e-05s 1 0s`, no running animation, background
  `0px 0px / 200% 100%` with the shine stop at 50%. The animation was cut; the shine band rested
  inside the right half of every bar (picture taken: each bar lighter towards its right end).
  After: the Skeleton line reads `ui-skeleton-shimmer 1e-05s x1`, no running animation,
  background `100% 0px / 300% 100%`: the band rests outside the bar, a flat surface.
- Loading delay, from the first frame an element exists (sampled every animation frame, both
  `no-preference` and `reduce`): Skeleton demo 12 of 12 hidden at insertion, shown after 400 ms
  (416 ms under reduce, frame granularity), box the same non-zero size before and after. Table
  demo loading rows: 15 of 15 hidden at insertion, shown after 399 ms (417 ms), boxes kept.
  SearchTable demo: the slow read (socket never answers) 125 of 125 shown after about 400 ms;
  the fast reads (customers and orders, fake latency 150 ms) ended loading about 300 ms after the
  placeholders appeared, none of their 70 placeholders was ever visible. After 3.2 s under
  reduce: 0 running animations on all three demos.
- Row height, table mode: placeholder row 46 px, data row 45.5 px. Card mode at 390 px: placeholder
  card 105 px, data card of a non-selectable list 105 px (123 px with a selection checkbox).
- 48rem edge, SearchTable width forced to 767, 768, 768.5 and 769 px: SearchTable and Table
  measure the same width every time; at 767 and 768 the header is hidden and the sort row shown,
  at 768.5 and 769 the header shown and the sort row hidden. Never both, never neither.
- Card mode on a phone (390 by 844, touch): Tab from the search field of the customers demo:
  four toolbar buttons, sort select, Select all, the bulk bar's Clear and Export, the first row,
  its checkbox, its menu. Every stop visible; no stop in `thead`. The direction button is skipped
  there because that list has no sort yet (disabled, see below); in the orders demo (default
  sort) Tab goes search, sort select, "Descending", the pager. The accessibility snapshot of the
  card-mode table has no `columnheader`.
- Sticky header, Table demo at 1280 by 600 with the demonstrator's sticky top bar (56 px)
  standing in for the shell's: window scrolled 200 and 330 px, the header's top edge is at 56 px,
  equal to the bar's bottom edge, the bar stays at 0, rows scroll under the header. The AppShell
  sticky fixture is WP05's; WP15 repeats the check there.
- `just touch-probe --only=SearchTable`, `Table`, `Skeleton`: 0 offenders each. `--all`: 0
  offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt.
- Screenshots, rendered on the base commit and on the branch with the same browser: Table and
  SearchTable changed as intended (Table: three Skeleton rows; SearchTable: 25 placeholder rows
  in the loading demo instead of 5). Skeleton is pixel-identical to the base render. Of the 14
  other pieces that use Skeleton, Table or SearchTable (JobProgress, ColumnsPicker, Board,
  NotificationInbox, DevLogin, ApiKeyManager, DetailForm, AgentDock, StatusTile, DetailDrawer,
  ListPage, SettingsPage, DetailPage, Dashboard) none moved: the only differences are
  anti-aliasing noise (channel delta 1 to 7) and live text in Dashboard and JobProgress that
  changes between two renders.

## What went wrong on first try
- `bun scripts/screenshots.ts --only=Table` -> the loading demo showed bars in Name, Status and
  Revenue only, reproducibly -> cause: during a capture of the whole article (taller than the
  viewport) Chrome restarts the CSS animations of the cells marked `data-hide-on-phone` (logged
  `animationstart` for exactly those cells during the capture), and the capture lands on the frame
  where the appear animation's backwards fill still hides them. A section-sized capture and a
  real scroll paint every bar. Injecting the delay before navigation or waiting two frames does
  not help; adding `.ui-skeleton, .ui-skeleton__line { animation: none !important; }` to the
  style tag the script injects does (Table shows all bars, Skeleton stays pixel-identical).
  `scripts/screenshots.ts` is WP01's file: handed over.
- The first card-mode placeholder rendered one bar per cell of `span` (columns plus select plus
  actions): seven stacked bars in a card that shows three values. The loading row now has the
  cells of a data row (empty select and actions cells, column cells with `data-hide-on-phone`).

## Instructions that were wrong or missing
- Plan WP09 step 2: "the loading cell renders `<Skeleton />`" / in card mode a cell is a flex row,
  where a Skeleton without an explicit width shrinks to 0; it renders `<Skeleton width="100%" />`.
  (fixed now: no, the plan is not this package's file; see deviations)
- Plan WP09 step 7 does not say what the direction button does while there is no sort, nor whether
  a new column in the select keeps the direction. Built: disabled while nothing is sorted; a new
  column keeps the direction (two independent controls, unlike a header click). Both on the card.
  (fixed now: yes, `SearchTable.md`)

## Deviations from the plan (for the as-built note of WP09)
- Loading rows carry the cells of a data row instead of `span` equal cells, so a placeholder card
  in card mode follows the data card (equal for plain text cells since review round 1).
- The placeholder is `<Skeleton width="100%" />` (card mode's flex cell).
- The sort row sits directly above the Table inside the block that disappears with it on a refusal
  without rows, after the banner and the stale line, so it stays next to what it sorts.
- `.ui-search-table` is a size container now: inside a flex row it needs a width, like Table
  (gotcha on the card).
- `Table.demo.vue`: the first table has `sticky-header`, its section sets `--ui-sticky-top` to the
  demonstrator's top bar height (the shell sets it itself); the loading demo shows
  `:loading-rows="3"`.
- `SearchTable.vue` is 210 lines, over the about 200 of stage 02; splitting the sort row into a
  sibling component would add a file outside this package's list.

## Questions I had to ask the human
- none

## Pieces that did not fit
- SearchTable demo: its loading section has no `page-size`, so it shows 25 placeholder rows now
  (about 900 px more demo). `SearchTable.demo.vue` is not in this package's list: handed over.

## Gate friction
- See the screenshot capture above. Also for WP15's pixel comparison: Dashboard and JobProgress
  render live text that differs between two runs a minute apart; AgentDock, ColumnsPicker and
  StatusTile differ by anti-aliasing noise between runs of different dev servers.
- `just ci` green (vue-tsc, index-check, contrast 192/192, ui-lint clean, template-check, 421
  tests in 1.67 s, build).

## Time sinks
- Finding why two columns of placeholders were missing only in the committed-style capture.

## Suggested improvements (for grooming)
- script: `scripts/screenshots.ts` freezes Skeleton animations in its injected style (see above).
- workbook: stage `04-gates` step 4 could say that a piece used inside other pieces gets its
  consumers re-rendered and compared against a render of the base on the same machine, not
  against the committed files (which were rendered elsewhere and differ everywhere).

## Review round 1
Review of `7ffdd4c..c74b105`: REJECT, 2 MAJOR, 2 DESIGN, 4 MINOR. Fixed on the same branch.
- MAJOR, sort select showed the wrong column: a sort on a key without an option (ColumnsPicker hid
  the column, or `?sort=` names a column that is not shown) let the native select fall back to the
  first option. The select now binds the option's value or `null` ("Sort by"). Measured on the
  ListPage recipe at 390 px with "Customer since" hidden and with `?sort=-owner`: the select reads
  "Sort by", the button "Descending". Mounted test: a `defaultSort` outside the columns gives
  `select.value === ''`, choosing Name then sorts by name, still descending.
- MAJOR, selectable placeholder rows were short: `height: var(--ui-touch-min)` on the select cell,
  and the empty actions cell of a placeholder row gets `height: var(--ui-control-h)` (a row menu's
  button; without it a list with row actions and no selection measured 105 against 120 px per
  card on touch). Measured with four temporary demo sections (plain, selection, row actions,
  both; text cells, page size 3), first frame against loaded, both densities: fine pointer
  1440 px table mode plain and actions 46 against 46 (compact 38 against 38), with selection
  46 against 46 (compact 44 against 45); touch 390 px cards 105 against 105 plain, 120 against
  120 with selection or actions; touch 1600 px table mode as fine, compact actions 44 against 45;
  fine 600 px cards 105, 120, 116 and 108 (compact actions) all equal. The customers demo has a
  Badge cell, taller than a line: card 120 against 123 px (list 1272 against 1320 px, before the
  fix 1122), compact row 44 against 45 px (440 against 449), comfortable 45.5 against 49.3 px. The
  D97 text in the handover says "as tall as a data row of plain text".
- DESIGN, blank frames during the delay: the loading row group (`.ui-table__loading`) waits with
  the same zero-length animation, its box held. Fast read in the customers demo at 390 and 1440 px:
  18 frames with placeholders, 0 of them computed visible (rows, frames and bars; computed style
  missed the collapsed row lines of table mode, see review round 2); slow read: shown after
  392 to 461 ms, also under reduce; pictures before and after the delay at 390 px: empty space
  under the sort row, then 25 Skeleton cards.
- DESIGN, Select all at the far end: it comes first in the sort row now, its box centred over the
  row boxes of the cards (`padding-inline-start` from the card's border, padding and 44 px cell),
  the sort pair at the end. Box centres 59 against 59 px (compact 51 against 51). Tab order at
  390 px: toolbar, Select all, sort select, direction (when sorted), bulk bar, first row; no stop
  in the hidden header.
- MINOR, nested sticky: one sentence on `Table.md` (a scroll box that is not the page sets
  `--ui-sticky-top: 0px`), a `todo:` below.
- MINOR, direction button named by its state: no change (plan step 7), a `todo:` below.
- MINOR, untested card claims: the sort test asserts the disabled direction button while nothing is
  sorted and that Name after the flip keeps descending. Mutations: removing `:disabled="!sort"`,
  resetting the direction in `sortKey` and binding `sort?.key ?? null` again each fail a test.
- MINOR, Skeleton restart: one gotcha on `Skeleton.md`.
- Gates after the fixes: `just index`, `just ci` (192/192 pairs, 0 undeclared, ui-lint clean,
  template-check, 422 tests in 1.72 s, build), `just touch-probe --all` (0 offenders, 0 smaller
  than known, 0 stale, 48 known, 14 exempt).
- The screenshot `todo:` now freezes `.ui-table__loading` too (tested: the Table picture has every
  bar, Skeleton stays pixel-identical).

## Review round 2
Re-review of `c74b105..190684a`: REJECT, 1 MAJOR, 1 MINOR; seven of eight round-1 findings resolved.
- MAJOR, table mode still showed ruled empty rows during the wait: the table collapses its
  borders, so the cells' bottom lines are painted by the visible table although the cells compute
  `visibility: hidden`. My round-1 check read computed style, which does not see paint. Fix, as
  the reviewer tested it: the placeholder cells wait with `ui-table-lines` (`border-color:
  transparent` from the first frame for `--ui-loading-delay`). Decided on pixels this time: the
  row area of the loading table, clipped from the page, counted against its background colour.
  With the wait held open (delay set to 60 s from the first frame), light and dark, motion and
  reduced motion: Table demo 3 rows at 1440 px 0 full-width line rows and 50 px other than the
  background (the frame's two rounded bottom corners), SearchTable slow read at 1440 px 0 px and
  0 lines, card mode at 390 px 0 px. After the wait (normal delay): 35, 237 and 319 full-width
  line rows (lines and bars). Control without the rule, light: 2 and 19 full-width line rows during
  the wait, so the count does see the lines. Real early frames with the normal 400 ms delay,
  taken 66 to 101 ms after insertion, three runs each with motion and reduced motion: 0 line rows
  (corners only); 700 ms later 299 line rows.
- MINOR, the ListPage overflow `todo:` now says what it costs and names WP10.
- The reviewer's reduced-motion observation (each level of a placeholder row shows one frame after
  its parent) goes to WP15 as a `todo:`.
- The screenshot `todo:` freezes the cells' new animation too (tested: the Table picture has every
  line and bar, Skeleton stays pixel-identical).
- Gates after round 2: `just index`, `just ci` (192/192 pairs, 0 undeclared, ui-lint clean,
  template-check, 422 tests in 1.66 s, build), `just touch-probe --all` (0 offenders, 0 smaller
  than known, 0 stale, 48 known, 14 exempt).
- Lesson for the next check of a hidden phase: read the pixels, not `visibility`; a collapsed
  border, an outline or a shadow drawn by an ancestor is painted whatever the cell computes.

## Handover
decision: D97, changed: **Placeholders wait and match what comes.** Skeleton shows after `--ui-loading-delay`, with its box held from the start; the delay holds under reduced motion, which shortens durations only. Table's loading rows are Skeleton, as many as `loadingRows`, which SearchTable sets to its page size; the rows, their row lines and card frames wait for the same delay, so a fast read shows the header over an empty box, or empty space in card mode, never ruled empty rows or blank cards. A placeholder row has the cells of a data row, the select cell 44 px and the actions cell a control's height, so it is as tall as a data row of plain text and a few pixels shorter than one with a taller custom cell. A sticky table header sits at `--ui-sticky-top`. When the Table turns into cards, its header is hidden from assistive technology too, because each cell names its column and the header's controls would be invisible tab stops; SearchTable shows Select all, a sort select and a direction button instead, and a Table without it gets them from its page (Table exposes `toggleAll`, `allChosen`, `someChosen`).
journal: 18.11.2026 maintain-collection ux-wp09-table-skeleton-searchtable - done after two review rounds: Skeleton and Table placeholder rows wait for --ui-loading-delay, loadingRows, sticky header at --ui-sticky-top, SearchTable sort row and Select all in card mode, searchLabel; run report 2026-11-18-maintain-collection-ux-wp09-table-skeleton-searchtable.md
readme: none
todo: scripts/screenshots.ts: a full-article capture restarts the appear animation of Skeletons in `data-hide-on-phone` cells and catches them hidden (Table demo, Email and City placeholders); add `.ui-skeleton, .ui-skeleton__line, .ui-table__loading, .ui-table__loading td { animation: none !important; }` to the injected style tag before WP15 renders
todo: SearchTable.demo.vue: the loading section shows 25 placeholder rows (default page size) since WP09; give it `:page-size="5"`
todo: screenshots: Dashboard and JobProgress demos render live text that differs between two renders a minute apart, so a pixel-equal before and after flags them without a change
todo: Dialog, Sheet and DetailDrawer (and any scrolling box of the collection) set `--ui-sticky-top: 0px` on their scroll container, else a sticky Table header inside them sticks the shell's top-bar height below the box's top; WP15 repeats the nested sticky check once WP05 sets the token
todo: SearchTable's direction button is named by its state ("Ascending", "Descending") without `aria-pressed`, as plan WP09 step 7 dictates; owner to decide: the action as the name (two new `ui.*` keys) or one fixed name with `aria-pressed`
todo: WP10: the ListPage recipe is 514 px wide in a 390 px viewport (`ui-page` 464 px), on the base and on the branch alike; until that is fixed, its SearchTable sort select (292 to 413 px) and direction button (421 to 465 px) sit past the right edge of a 390 px screen, since Select all moved to the start of the sort row (before, Select all sat there); `ListPage.vue` is WP10's
todo: WP15: under reduced motion each nesting level of a placeholder row shows one frame after its parent (row group 410 ms, bar 476 ms; 67 ms end to end, not seen as a step), because `ui/base.css` gives every element a 0.01 ms transition and `visibility` inherits; without reduced motion all levels show in the same frame; for the reduced-motion check
keys: none
screenshots: Table, SearchTable (Skeleton rendered, pixel-identical to the base)
probes: reduced motion before: Table shimmer cut (1e-05s, 1 iteration) but its shine band rested inside each bar; after: flat bar, 0 running animations after 3.2 s on the Table, Skeleton and SearchTable demos. Delay: Skeletons and placeholder rows hidden at insertion and shown after 392 to 461 ms with the same non-zero box, also under reduce. Paint during the wait, decided on pixels of the row area against its background (wait held open, light and dark, motion and reduce): table mode 0 full-width line rows and nothing but the frame's rounded corners, card mode 0 px; after it lines and bars (35, 237, 319 line rows); control without the line rule 2 and 19 line rows; real frames 66 to 101 ms into the normal delay: 0 line rows. Heights, first frame against loaded, text cells, both densities: table mode 46 against 46 px (compact 38 against 38, selectable compact 44 against 45), cards 105 against 105 plain and 120 against 120 with selection or row actions; customers demo with a Badge cell: card 120 against 123 px, compact 44 against 45, comfortable 45.5 against 49.3. Edge: at 767 and 768 px sort row shown and header hidden, at 768.5 and 769 px the reverse, both containers equal. Phone: Select all box centred over the row boxes (59 against 59 px, compact 51 against 51); tab order toolbar, Select all, sort select, direction (when sorted), bulk bar, first row, no stop in the hidden header, no columnheader in the accessibility tree. ListPage at 390 px with "Customer since" hidden or `?sort=-owner`: the select reads "Sort by". Sticky: header top 56 px equal to the demonstrator top bar's bottom after scrolling 200 and 330 px (AppShell's own fixture is WP05's, check again in WP15). Touch probe after review round 2: 0 offenders over all demos (48 known, 14 exempt).
