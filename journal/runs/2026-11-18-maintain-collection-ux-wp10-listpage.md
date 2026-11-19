---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 8.5 h
groomed: no
---

## Task
UX hardening pass, work package WP10 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): the
delete confirm names its count (`09-I`), the empty table tells a first run from a filtered list
with Clear filters (`13-B`), the search box names the noun (`11-D`), a "Deleting" section in
`patterns/building-a-list-page.md` (`08-E`); plus three additions from the reviews of other
packages: the page width on a phone, the delete confirm's title while the dialog leaves, the
section heading "Deleting" kept as named. Then a coordinator addition before review: the three
causes of the phone overflow (PageHeader, Pagination, the demonstrator's `App.vue`, in no
package's list) became this package's, with a check of every other user, a list of the demos the
demonstrator change shows overflowing, and a focus target after a delete.

## Measurements
All browser checks are one-off Playwright runs against the demo (not committed), Chrome on this
machine.
- Phone width, cause first (before the coordinator addition). At 390, 360 and 320 px (touch, `isMobile`) the demo lays out 514 px
  wide (`ui-page` 464 px), the sort select at 241..413 and the direction button at 421..465 px,
  30, 31 and 34 controls past the right edge (every row menu at 408..452, the search box to 432,
  Add filter, the last tabs). Ranking the min-content width of every element under `.ui-page`:
  the tab strip `nav.ui-tabs` needs 416 px (four counted tabs), and its box
  `.ui-page-header__tabs` is a flex item with `min-width: auto`, so PageHeader cannot be narrower
  than 416 px and the page not narrower than 416 + 2 x 24 px. The demonstrator's grid
  (`demo/src/App.vue`: `.shell` column `1fr`, `.main` without `min-width: 0`) then sizes its main
  to that min-content (514 px). Injected rules, measured one by one: `.ui-page-header__tabs
  { min-width: 0 }` alone: still 514 (the demonstrator blowout). `.main { min-width: 0 }` alone,
  which is what AppShell already does (`minmax(0, 1fr)`, main `min-width: 0`): page 340 px, but the
  tab strip reaches 465 px, so a real app scrolls 75 px sideways at 390. Both: 390 and 360 px wide
  at 390 and 360, no control off screen (only "Churned", inside the tab strip, which scrolls by
  design), sort select 49..221, direction 229..273. At 320: 331 px, Pagination's page group
  (282 px min-content, it does not wrap) puts "Last" at 287..331; with
  `.ui-pagination__pages { flex-wrap: wrap }` as well: 320 px, nothing off screen, the direction
  button wraps under the select (49..93), Next and Last wrap onto a second pager line. None of the
  causes was in this package's files; the coordinator gave them to it (see below).
- Delete confirm during an exit fade. With a 200 ms opacity exit injected (the shape WP06 plans:
  `display` and `overlay` `allow-discrete`, parts stacked), two rows selected, a real double click
  on the confirm: frames every 25 ms after the close all read "Delete 2 customers?" and "Delete 2
  customers" (opacity 1.00 to 0.17); the base commit's file read "Delete 0 customers?" and
  "Delete" in the same frames. Pictures at opacity 0.75 taken of both and looked at. The subtitle
  went from 31 to 29 customers: the double click deleted two rows, not four.
- Empty states, 1280 by 900, light and dark: a search that matches nothing beside the preset
  country chip shows "No customers match" and Clear filters; Enter on Clear filters (keyboard):
  the URL landed on `?search=zzzz` (the page's write, country gone) and then on no query
  (SearchTable's write), 25 rows, 0 chips, the search box empty, focus on the filter button
  (`data-action="filter"`). The demo's "Without customers": "No customers yet", the hint, New
  customer (primary, `createCustomer`); a customer created from it (pointer, then typing and Enter
  in the form): one row, the empty state gone, focus on the header's New customer. Pictures of
  both states in both themes looked at.
- Phone, 390 by 844, touch, with the two layout rules above injected (as is, Playwright cannot tap
  the empty state's button: the layout viewport is 500 to 514 px and scaled): a tap on Clear
  filters empties the URL and puts the focus on the filter button without a focus ring (pointer);
  two rows tapped and Delete selected: the bottom sheet (0..390 x 655..844) reads "Delete 2
  customers?" and "Delete 2 customers". The first run's New customer measures 147 x 44 px in both
  densities.
- Focus after a confirmed delete, before the coordinator addition: Chrome put it on the body after
  a row-menu delete and after a bulk delete; the opener leaves with the push.
- `just touch-probe --only=ListPage`: 0 offenders (4 known). `--all`: 0 offenders, 0 smaller than
  known, 0 stale, 48 known, 14 exempt.
- Mounted tests (first round): 5 tests, 66 expects. Each claim was checked by mutating `ListPage.vue` on a copy
  and running the file: 17 of 18 mutants fail a test (without the `deleting` guard, without the
  `confirming` guard, clearing `doomed` at close, "Delete" on the button, no focus after create,
  no focus after Clear filters, models only without the URL write, the write not awaited, `t`
  kept, no range reset, no search reset, no `searchLabel`, the first run on every tab, and
  `narrowed` without search, without clauses or without range). The survivor sets the search
  before the two models after the awaited write: all three run in one tick, the same behaviour.
- Suite time (first round): `bun test scripts ui pages demo/src` took 1.79 to 1.85 s without the
  new file and 1.98 to 2.09 s with it. Six mounts of the whole recipe became five and the lists
  hold 0, 4 or 26 customers to get there.

### Coordinator addition: the overflow fixed at its causes, focus after a delete
- Built: `ui/PageHeader/PageHeader.vue` `.ui-page-header__tabs { min-width: 0 }`;
  `ui/Pagination/Pagination.vue` `.ui-pagination__pages` wraps, right-aligned, with first and
  previous, next and last kept together in `.ui-pagination__pair`; `demo/src/App.vue` `.main
  { min-width: 0 }`; `ui/Tabs/Tabs.vue` scrolls the active tab into its strip (below); ListPage
  moves the focus after a delete. Cards: PageHeader (new Gotchas), Pagination, Tabs, ListPage.
- ListPage recipe, no injected CSS, touch, comfortable (compact in brackets):
  - 390 px: page 390 wide; `ui-page` 25..365 (17..373); Select all 49..165 (33..149); sort select
    49..221 (185..357); direction 229..273 (33..77, on the next line); pager First 49..93,
    Previous 97..141, Next 239..283, Last 287..331, rows-per-page select 153..218; nothing off
    screen, one tab inside the scrolling strip.
  - 360 px: page 360 wide; Select all 49..165; sort select 49..221 (33..205); direction 229..273
    (213..257); pager First 125..169, Previous 173..217, Next 219..263, Last 267..311 (compact:
    33..315); nothing off screen.
  - 320 px: page 320 wide; Select all 49..165; sort select 49..221 (33..205); direction 49..93
    (213..257); pager First 85..129, Previous 133..177, Next 179..223, Last 227..271 (compact
    101..287); nothing off screen, two tabs inside the strip.
  - Every pager button 44 x 44 px, the rows-per-page select 65 x 44 px, in both densities.
- Other users of Pagination, no injected CSS, 390, 360 and 320 px, both densities: the SearchTable
  demo and the Pagination demo are as wide as the viewport, nothing is off screen, every button is
  44 x 44 px; the pager takes two or three lines at 320 px and the arrow pairs never split.
  Pictures of the pager at 360 and 320 px looked at (before the pairs, Last stood alone on the
  third line).
- Other users of PageHeader with tabs (`grep PageHeader` over `ui/` and `pages/`: ListPage and
  SettingsPage fill `#tabs`; the Tabs demo has strips of its own), at 390 and 320 px: every strip
  scrolls inside its box, the page is as wide as the viewport, and the active tab lies inside the
  strip on load: ListPage `?tab=churned` strip 49..341, "Churned 16" 220..341 (strip scrolled by
  148 px; at 320 px by 218 px), `?tab=onHold` 234..341, SettingsPage `?tab=danger` "Danger zone"
  234..341, the SettingsPage demo's second page pinned to `danger` 234..341. With the reveal
  reverted (Tabs.vue of HEAD): "Churned 16" at 368..489, "On hold" 242..349, "Danger zone"
  311..418, all cut. Without only the watch on the items, ListPage's active tab is still cut (the
  counts arrive after the mount and widen the tabs). A strip the user scrolled back to its start
  stays there through eight live count changes. Tabs offers no overflow sign (tab overflow fades
  are a non-goal of this pass); the tab cut at the strip's edge is the only cue.
- Focus after a delete, real Chrome: a row-menu delete of the first row puts the focus on the row
  that took its place ("Meridian Energy"); a bulk delete of the second and third rows on the row
  now second ("Juniper Robotics"); a keyboard delete (Enter on the menu item, Enter on the
  confirm) on the next row, with its focus ring. Target chosen: the row that takes the first
  deleted row's place, else the last row before it, else the list itself. The row is the row's
  first tab stop (rows open the drawer, so they are focusable and come before their box and
  menu): Tab reaches its box and menu, a screen reader reads the record, and Enter opens it since
  review round 1 (before, Table let the same key press close the drawer again). When no
  row stays, SearchTable's root takes the focus (`tabindex="-1"` passed through from the page), so
  the next Tab starts inside the list. The target is taken from the rows on screen before the
  call, because the push may remove the rows before the call answers.
- The first run is told by SearchTable's `total`: a page emptied past the last page (page 2 of 30
  customers after five deletes) shows "No customers match" without New customer, no longer "No
  customers yet" while 25 customers exist.
- Demos wider than a 390 px viewport after the demonstrator change (all 60 demos, touch, their
  first state; the cause found by hiding elements until the page fits): `/ui/Input` 672 px,
  section "Sizes": `div.row` (flex, no wrap) holds three Inputs whose native fields do not
  shrink, the last at 450..672; `/ui/Sheet` 708 px: the inline preview Sheet runs the entrance
  slide from `translate: 100%` (366..708 during its first 200 ms) and a phone's layout viewport
  keeps 708 px after it. Measured to fit: SettingsPage (468 px in another review; now 390, the
  PageHeader fix), Toast with all five demo toasts fired (regions 16..374), FileUpload with a
  104-character file name chosen (390). At 320 px also: `/ui/blocks/RangePicker` 363 px (section
  "Absolute range": the trigger's label `span.ui-range-picker__label`, 287 px of a date range on
  one line) and `/pages/Dashboard` 337 px (`div.dashboard__cards`).
- Touch probe after the change, all 60 demos, both densities: 0 offenders, 0 smaller than known,
  0 stale, 48 known, 14 exempt; the measured sizes of the 48 known targets are identical to a run
  with the four changed files of HEAD (the two `--all` listings do not differ), so no record in
  `scripts/touch-probe.ts` moves.
- Screenshots: Pagination, PageHeader, Tabs, SettingsPage, SearchTable, Page and AppShell rendered
  with HEAD's files and with the branch's on this machine: byte-identical, light and dark (the
  changes act on narrow widths only); left as committed. ListPage re-rendered and looked at.
- Mounted tests: 5 tests, 74 expects. Mutants of `ListPage.vue`, each run on a copy: 22 of 23
  fail a test (the 17 of the first round, plus: no focus after a delete, the target always the
  first remaining row, the target taken after the call, no `tabindex` on the list, the first run
  without the total); the survivor is still the equivalent reordering of three assignments.
- Suite time: 1.70 to 1.72 s without `ListPage.mounted.test.ts`, 2.08 to 2.11 s with it, over the
  D69 budget of 2 s on this machine (todo).

## What went wrong on first try
- `ListPage.mounted.test.ts`, page 2 started from the URL (`?page=40&status=...`) -> 14 rows, page
  1 -> a link with `page` and a facet, `t` or `search` opens on page 1 (see todo); the test pages
  to 2 with the pager and empties page 2 by live removals.
- The same test set the page size to 10 -> NaN pages -> Pagination offers 25, 50 and 100 only;
  26 customers, one removed on page 2.
- A delete test compared `document.activeElement` inside a `toEqual` array -> a failing mutant
  made bun deep-compare two jsdom element trees and ran for minutes -> elements are compared with
  `toBe` on their own.
- Two row boxes clicked in one tick selected one row -> the second click read the selection
  before the parent re-rendered; a `nextTick` between them, as a person cannot click twice in a
  tick.
- The first version waited 250 ms for SearchTable's debounce and mounted nine times: the suite
  took 2.3 to 4 s. D69 says debounces run on fake timers, never by waiting: the blanks come from
  the URL now, the extra waits are gone, and scenarios that follow the URL share a mount.

## Instructions that were wrong or missing
- Plan WP10 step 2, tests: "the same starting on page 2 with facets and a range" / a URL cannot
  start there, the facets' URL read resets the page; reached through the pager and live removals.
  (fixed now: no, the plan is not this package's file; see deviations)
- Task addition 2: "reset after the exit, not at close" / nothing needs a reset: the dialog's
  target is replaced when it opens next, and its open state is a separate boolean, so no timer
  has to know when an exit animation ended. (fixed now: no; deviation below)
- `ListPage.md` said nothing about deep links with `page` / a gotcha now says which links keep the
  page. (fixed now: yes)
- Coordinator addition: "a visible sign that more tabs follow if the collection's Tabs piece
  offers one" / it offers none, and tab overflow fades are a non-goal of the plan (section 2); the
  tab cut at the strip's edge is the cue. (fixed now: no, none to build)
- Coordinator addition: "the next row's first control" / the recipe's rows are clickable, so the
  row itself is its first tab stop and takes the focus. (fixed now: yes, on `ListPage.md`)
- `patterns/building-a-list-page.md`, "Data flow": `toFilterDocument(clauses, tabFilter, search)`
  / the signature is `toFilterDocument(clauses, { base, facets })` and SearchTable adds the
  search. (fixed now: yes)

## Deviations from the plan (for the as-built note of WP10)
- The delete confirm's open state is its own `confirming` boolean; `doomed` (ids and name) is set
  when the dialog opens and never cleared, so title and button keep their text through the close
  and the exit. `confirmDelete` returns at once while a delete runs or when the dialog is no
  longer open (a second press, or a press on the confirm of a leaving dialog).
- Focus moves the plan did not name, because the buttons that held it leave with the empty state:
  Clear filters puts the focus on FacetFilter's button (`data-action="filter"`) before it writes;
  a successful create puts it on the header's New customer after the dialog closed (the dialog
  returns it to its opener, which can be the empty state's button). The search box was not the
  target: focusing a text field after a tap opens a phone's keyboard.
- Clear filters had no double-press guard in round 0, with the sentence "a second run writes the
  same keys away and sets the same models": wrong, a second press cancels the first navigation and
  a block writes its key back (review round 1); one in-flight flag now.
- `:empty-title` is gone from the SearchTable call: the page's `empty` slot replaces SearchTable's
  empty state.
- `ListPage.demo.vue`: a "Without customers" switch shows the first run on a pair of its own over
  a second fake engine whose customers were removed with the existing `store.remove` (the engine
  is not extended); the URL is emptied first and "Random change" is disabled meanwhile.
- The mounted test reuses one mount for the blanks, facet-only and range-only cases (FacetFilter
  and RangePicker follow the URL) and starts the search-only filtered case on an empty store,
  where Clear filters leads into the first run; time budget.
- `ListPage.vue` is 304 lines (242 before), over the about 200 of stage 02; a sibling file would
  be outside this package's list.
- Coordinator addition: `ui/Tabs/Tabs.vue` and `Tabs.md` changed, although only PageHeader,
  Pagination and `demo/src/App.vue` were handed to this package: the check asked for the active
  tab scrolled into view on load, which only Tabs can do for every strip (PageHeader would have to
  know Tabs' attributes and would miss counts that arrive later). Tabs.vue is in no package's
  list after WP02.
- Focus after a delete: the target is the row that takes the first deleted row's place (its own
  tab stop, as rows are clickable), else the last row before it, else SearchTable's root, which
  receives `tabindex="-1"` from the page as a fallthrough attribute (no wrapper element, no extra
  landmark).
- The first run also needs SearchTable's `total` to be 0 (`@total`), found while testing the empty
  page after deletes.
- Pagination wraps in pairs (two `span.ui-pagination__pair`) rather than button by button, so
  Last never stands alone on a line.
- The delete test runs on page 2 of 30 customers (`?page=2`, which a link keeps) and deletes the
  second and third rows, the last row, then the remaining rows.

## Questions I had to ask the human
- none

## Pieces that did not fit
- PageHeader: its tabs box could not shrink, so a page with counted tabs was as wide as its tabs
  (fixed in the coordinator addition).
- Pagination: its page group did not wrap at 320 px (fixed in the coordinator addition).
- Tabs: kept the strip at its start, so an active tab past the box's edge was hidden on load
  (fixed in the coordinator addition).

## Gate friction
- `scripts/test/setup.ts` has no `showModal()` or `close()`: the test file shims both like
  `SettingsPage.mounted.test.ts` (WP07), restored after the file (todo).
- The D69 budget: see Measurements; WP15 measures the merged suite.
- After the coordinator addition: `just index` (INDEX.md left unstaged), `just ci` green
  (vue-tsc, index-check, contrast 192/192, 0 undeclared, ui-lint clean, template-check, 453 tests
  in 2.11 s, build), `just touch-probe --all` as above, `bun scripts/screenshots.ts
  --only=ListPage` looked at in both themes (the demo bar gained "Without customers", the
  recipe's default state is unchanged), files left unstaged.

## Time sinks
- The mutation runs: a failing `toEqual` over DOM elements hung bun (see above), and two runs
  that overlapped swapped the same file; one run at a time, with a 60 s limit per mutant.
- Finding the width's cause: computed boxes showed only that everything was 514 px; ranking the
  min-content width of every element named the tab strip, and injecting each candidate rule alone
  showed that two rules in two other files are needed.

## Suggested improvements (for grooming)
- script: a phone width probe next to the touch probe (`scrollWidth` against the viewport at 390,
  360 and 320 px per demo, the cause found by hiding elements) would have caught the PageHeader
  and Pagination overflow in WP01; it needs the demonstrator's `min-width: 0` to see anything.
- harness: `scripts/test/setup.ts` could provide the dialog shim once instead of per test file.
- workbook: stage `02-build` could say that a button inside a state that leaves when the action
  succeeds (an empty state, a bulk bar) moves the focus somewhere that stays.

## Review round 1
Review of `2a3d042..cbadf23`: REJECT, 1 MAJOR, 2 DESIGN, 7 MINOR (a second reviewer alongside: 10 items). The
Tabs commit stays. First `git merge task/govengers-ui-ux-overhaul` (b0fe1b1, twelve packages, the
real Dialog exit fade, Tooltip, the harness that resets timers, focus, views, body, storage and
toasts after every test): merge commit 53cd426, no conflict. All work below is on the merged state.
- MAJOR, a first run claimed while customers exist: SearchTable keeps the old query's rows and
  total until the new first page arrives, so right after Clear filters (or an emptied search box)
  `narrowed` was false while `listTotal` was still the filtered 0. Coordinator cleared
  `SearchTable.vue` for this: its `empty` slot gets `stale` (`list.stale`: the rows and total still
  belong to the query before, or the socket is not open), on the card with the decision text below.
  Chosen while stale: the page keeps the case it showed (the rows on screen are the old query's,
  livewire D76), never a case that claims something about the query not yet read. The page
  computes the case in `emptyCase(stale)` and holds it while stale. Browser, demo (120 customers), 1440 px,
  every animation frame after Enter on Clear filters: before "No customers match" 0 ms, "No
  customers yet" from 62 ms, rows at 203 ms; now "No customers match" until the rows at 211 ms.
  After emptying the search box: before "No customers yet" from 210 to 371 ms; now "No customers
  match" until the rows at 372 ms. 390 px, two taps 60, 100, 140 ms apart: before the "New
  customer" dialog opened at 60 and 100 ms and a row's drawer at 140 ms; now nothing opens at 60
  and 100 ms, and from about 140 ms the second tap can open the drawer of the row that arrived
  under it (corrected in review round 2). Mounted test: a MutationObserver records the title after every DOM change, after
  Clear filters and after the box is emptied (fake timers drive the debounce); it fails with the
  hold removed.
- MINOR, Clear filters after a cancelled navigation: one in-flight flag (`clearing`), set before
  the write, cleared in `finally`. Browser, real double click with a 150 ms async `beforeEach`
  added to the demo router: before the chip came back (`?country=DE&sort=name`); now `?sort=name`,
  no chip, 25 rows. Mounted test: two presses in one task end with no facet key in any route that
  lands. The run report's earlier sentence "a second run writes the same keys away and sets the
  same models" was wrong and is corrected below.
- MINOR, a text in SearchTable's debounce survives Clear filters: SearchTable exposes
  `clearSearch()` (card line) and the page calls it instead of assigning the model. Mounted test
  with fake timers: "ab" typed, Clear filters at once, 300 ms later box empty, no `search`, no
  `country`.
- MINOR, Tabs takes a clamp for a user scroll: the position compare is gone. A flag is set by the
  user's own wheel, touchmove, pointerdown or keydown on the strip and cleared by a new active tab;
  the items watch is deep (counts changed in place count) and one ResizeObserver on the strip
  places the tab again unless the flag is set; a strip that does not overflow measures nothing
  (the second review's minor). jsdom has no ResizeObserver: Tabs skips it there, the test brings
  a stand-in.
  Browser, 390 px, `?tab=churned`: counts shrink ("Churned 1", scroll clamped 148 to 124) and grow
  again: before "Churned 16" at 244..365 in a strip 49..341, cut; now 220..341 inside. Portrait,
  landscape, portrait: before 368..489, fully outside, and four live changes left it there; now
  220..341 inside. A strip the user wheeled back to its start stays at 0 through a rotation and four
  live changes. Mounted test (stand-in boxes: strip 150 px, tabs 100 px): mount, new active tab,
  user wheel then new items and a size report (stays), a browser clamp then new items, then a size
  report (placed again); five breaks of `Tabs.vue` each fail it (no wheel flag, no items watch, no
  observe, no reset on a new tab, items ignoring the flag), and the previous position compare fails
  it too. Not changed: the second review's "a new active tab reveals even while the user scrolls" (the tab
  change is the user's own action, or a back and forward navigation; the reviewer agrees).
- MINOR, the successor removed by a live change: the focus target is chosen once the push has
  taken the deleted rows (a `watch` on the row ids, either order of answer and push), by id, else
  the row now at the deleted row's place, else the list; it does nothing when the user has moved
  the focus meanwhile. Mounted test steps: the answer before the push (the server's work delayed),
  the user focusing the search box before the push (focus stays there), the successor removed
  while the delete runs (the row at that place). Browser: row-menu delete of the first row, bulk
  delete of rows 2 and 3, keyboard delete: the row that took the place, with the ring after the
  keyboard. Limit: a live change that removes the focused row later, after the focus was placed,
  drops the focus to the body like any focused row a push removes (todo).
- MINOR, the fallback target had no name: SearchTable's root gets `role="group"` and the page's
  title as `aria-label` beside `tabindex="-1"`; asserted in the delete test.
- MINOR, Enter on a focused row opened and closed the drawer: coordinator cleared `Table.vue`:
  `@keydown.enter.self.prevent`. Browser, ListPage at 1440 px, Enter on the third row: before no
  `item` in the URL and no open drawer, focus back on the row; now `?country=DE&item=cus-078`, the
  drawer open, focus on its Close button. `Table.mounted.test.ts`: Enter runs `row-click` once and
  is default-prevented (fails without `.prevent`). Card line on `Table.md`. The run report's "Enter
  opens it" is true now.
- MINOR, `ListPage.vue` length: no split in this package (it changes what a project copies);
  todo below. The file is 329 lines now (304 before this round): the held empty case, the in-flight
  flag and the focus that waits for the push.
- DESIGN, the pager's arrow pairs on two lines near 320 px: kept; the todo names both ways out.
- DESIGN, the sort row and a disabled Select all above a first run: SearchTable's row; todo.
- Second review, "settled without draining the debounce": the tests that need the debounce run on fake
  timers with `drive()`, which lets the promises run out between 10 ms steps (a router navigation
  takes about 30 promise turns; with too few turns between steps the debounce fired before a
  navigation landed, which a browser never does). Second review, pattern: `building-a-list-page.md` says
  the first run needs a total of 0 for the current query and names the page past the last.
- Second review, claims not taken: "reordering can select the wrong replacement" (the successor is found by
  id; the reviewer checked it); "modelValue reveal while the user scrolls" (above).
- Mutants of `ListPage.vue`, one at a time, 60 s limit each: 27 of 28 fail a test; the survivor
  moves `clearSearch()` before the two model assignments, all in one tick, the same behaviour.
- Screenshots: Tabs, Table, SearchTable, ListPage and SettingsPage rendered with HEAD's files
  (the merged state) and with this round's: byte-identical, light and dark; ListPage's file differs
  from the committed one by the demo bar of the first round and stays modified, the rest restored.
- Phone widths on the merged state, ListPage, touch, both densities: 390, 360 and 320 px wide
  documents, nothing off screen, Select all 49..165, sort select 49..221, pager buttons 44 x 44.
- Gates on the merged state: `just index`, `just ci` green (contrast 192/192, 0 undeclared in 66
  sources, ui-lint clean, template-check, 604 tests in 3.03 s, build); `just touch-probe --all` 61
  demos, 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt; `bun test scripts ui
  pages demo/src` three times in fixed order: 604 pass, 0 fail (2.98, 2.97, 3.04 s); fifteen times
  with `--randomize`: 604 pass, 0 fail every time (2.91 to 3.03 s; seeds 2019357504, 212999689,
  3779263458, 4287222842, 99968463, 3391213032, 1978308143, 3195493389, 4203583306, 211906716,
  635193884, 2012317133, 1492111547, 3507748651, 2220340502). Without this package's three test
  files the merged suite takes 2.58 to 2.63 s: over D69's 2 s either way.
- Lesson: a test of a transition records every frame between the action and the settled state
  (here a MutationObserver), and a "user did it" guard is a flag set by the user's events, never a
  compare of positions the browser also moves.

## Review round 2
Re-review of `cbadf23..c358496`: REJECT, 1 MAJOR, 5 MINOR; all ten findings of round 1 resolved in
code and in the browser.
- MAJOR, the run report named the second review tool six times in a public repository: reworded to
  "a second reviewer" and "the second review", and the journal commit amended (it was the tip), so
  no commit of this branch after the merge adds the name. A grep of this package's commits for
  other tool, product, company or person names and outside paths finds the browser and the test
  driver the repository's own scripts name (Chrome, Playwright) and the cited NN/g, nothing else.
  Two commits of another package that came in with the merge (a run report that added the name and
  the next one that removed it) are on the integration branch already and were not rewritten.
- MINOR, a held Enter on a row: `!$event.repeat && onRowClick?.(row)`. Chrome, Enter held 1 s on a
  focused row (key events every 33 ms): one open (round 1: 15); the repeats then reach the drawer's
  Close button, which takes them as presses, so the drawer ends closed (todo for Sheet). Enter held
  1.3 s on the delete confirm: one delete (31 to 30 customers), no drawer opens, focus on the next
  row (round 1: the next customer's drawer 18 times). `Table.mounted.test.ts`: a repeat leaves
  `row-click` at one; Enter on the row's checkbox is not prevented and runs no `row-click`; three
  breaks (no repeat check, `.prevent.self`, no `.prevent`) each fail it. Card: half a sentence.
- MINOR, D76 in this repository is FileUpload's: the comment at `SearchTable.vue:59`, the slot row
  on `SearchTable.md` and the decision paragraph say "livewire D76" and "not known to be the
  current query's"; the paragraph amends D32 only.
- MINOR, presses that scroll nothing set Tabs' flag: `@pointerdown.self` on both strips, and in a
  nav of links only the arrow, Home and End keys; in a tab list those keys change the tab, so
  `onKeydown` sets nothing. Chrome, 390 px `?tab=churned`: a tap on the active tab, then portrait,
  landscape, portrait: "Churned 16" 220..341, inside (round 1: 368..489). 430 px window: the Tab
  key walked across the strip, then wider and narrower: 260..381 inside the strip 49..381. Tests:
  a tap on a tab and a Tab key leave the next size report free to place the tab, a press on the
  strip itself does not; a second test with a nav of links: Tab is no scroll, ArrowRight is. Ten
  breaks of `Tabs.vue` each fail them (the five of round 1, a `pointerdown` without `.self`, none,
  `touched()` back in `onKeydown`, every key on the nav, no key on the nav). Card sentence.
- MINOR, SearchTable's contract pinned only from the recipe: `SearchTable.mounted.test.ts` now
  asserts the `empty` slot hears `stale` true between a filter change and its first page and false
  after it, and that `clearSearch()` through a template ref empties the box with a text still in
  the debounce and never commits it (fake timers); breaks (`stale` always false, no
  `clearTimeout`, `typed` kept) each fail it.
- MINOR, a guard that refuses Clear filters' navigation: `router.replace`'s failure is read; an
  aborted or cancelled navigation returns before the models change, a duplicated one goes on. The
  `try` starts right after `clearing = true`. Test: a `beforeEach` returning false once leaves
  `country=DE`, the chip, the search and the range as they were; breaks (no check, stopping on any
  failure) fail it. With the check, a second press without the flag no longer brings a key back
  (the first run sees its navigation cancelled), so the double press test now also asserts that no
  navigation is cancelled at all: the flag's own claim; removing the flag fails it.
- Correction of round 1: at 390 px two taps on Clear filters 60 and 100 ms apart open nothing; from
  about 140 ms, once the rows have arrived before the second tap, that tap opens the drawer of the
  row that arrived under the finger (two runs: 140 ms once of two, 170 and 200 ms both times). No
  empty state can prevent a list arriving under a finger.
- Mutants of `ListPage.vue` after this round: 30 of 31 fail a test (the 27 of round 1, the two of
  the failure check, the flag through the cancel count); the survivor is still the equivalent
  reordering of `clearSearch()` and the two model assignments in one tick.
- Gates after round 2: `just index`, `just ci` green (contrast 192/192, 0 undeclared in 66
  sources, ui-lint clean, template-check, 607 tests in 3.02 s, build); `just touch-probe --all` 61
  demos, 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt; fixed order twice: 607
  pass, 0 fail (2.90 s both); `--randomize` ten times: 607 pass, 0 fail every time (2.95 to
  3.04 s; seeds 3546973143, 3652410099, 3373153900, 499149916, 2330922643, 3713750574,
  721003220, 1402862856, 1084483805, 1029242727). No screenshot moves this round (listeners, a
  key check, wording and tests only).

## Handover
decision: new, number assigned by the integration package: **An empty state speaks only for the query it read.** SearchTable's `empty` slot gets `stale`, true while the rows and total on screen are not known to be the current query's (a changed filter, search, sort or page whose first page has not arrived, or a socket that is not open; livewire D76). A page that tells a first run from a filtered list decides only when `stale` is false and the total of the current query is 0, and keeps the case it showed while the list is stale: right after Clear filters the old total is still 0, and a first run shown then would offer a create action while records exist. SearchTable also exposes `clearSearch()`, so a page's Clear filters drops a text still in the search debounce. Amends D32.
journal: 18.11.2026 maintain-collection ux-wp10-listpage - done after two review rounds: first-run and filtered empty states with Clear filters (one awaited URL write, one run at a time, models kept when a guard refuses, no cleared key comes back, no first run claimed while the list is stale), a delete confirm that names its count and keeps it while it leaves, focus after a delete on the next row or the named list once the push removed the rows, searchLabel, the Deleting section of the list-page pattern; the phone overflow fixed at its causes (PageHeader tabs row, Pagination wrap, the demonstrator's main column), Tabs keeps the active tab in view (user scroll as a flag, ResizeObserver), Table consumes Enter on a row once (repeats ignored), SearchTable's empty slot gets stale and exposes clearSearch(); run report 2026-11-18-maintain-collection-ux-wp10-listpage.md
readme: none
todo: ui/Pagination/Pagination.vue (owner): the page group wraps in pairs near 320 px (in the demonstrator at 360 too), so Previous and Next sit on two lines; two ways to keep one line: drop First and Last under a container width (two targets fewer), or a short page text under a container width ("2 / 5" instead of "Page 2 of 5", about 232 px, one line at 320 px with all four buttons), which needs a `ui.*` key
todo: pages/ListPage/ListPage.vue is 329 lines, over the one-screen budget of P2; the honest cut is the create dialog (form state, `create()`) and the delete confirm (`doomed`, `confirming`, `deleting`, the focus after a delete) as sibling files of the recipe, `ListPage.vue` back to composing blocks; it changes what a project copies and the card's Load table, so it is a recipe decision for the owner, not a hardening fix
todo: ui/blocks/SearchTable/SearchTable.vue: on a phone a first run (and any empty list) stands under the sort row: a disabled Select all and a sort select with its direction button that have nothing to act on; no sort row while the total is 0 and the list is not loading
todo: ui/Sheet (DetailDrawer): an Enter held on a row opens the drawer once, then the key's repeats reach the drawer's Close button, which takes them as presses and closes it again (Chrome, Enter held 1 s); the panel could ignore key repeats on its buttons until a key goes down anew after it opened
todo: ui/blocks/SearchTable, ui/Table: a live change that removes the focused row (after ListPage placed the focus there, or any focused row) drops the focus to the body; the list could keep the focus at the row's place
todo: ui/Input/Input.demo.vue: section "Sizes" is 672 px wide on a 390 px phone (and at 320): `.row` is `display: flex` without `flex-wrap`, and its three Inputs do not shrink below their native fields (the last at 450..672); give `.row` `flex-wrap: wrap`, or the Input root `min-width: 0`
todo: ui/Sheet/Sheet.vue: the inline preview Sheet runs the entrance slide (`@starting-style`, `translate` from 100%) although it is `position: static`, so the Sheet demo is 708 px wide on a 390 px phone (568 at 320) during its first 200 ms and a phone's layout viewport keeps that width; no entrance for `[data-inline]`
todo: ui/blocks/RangePicker: at 320 px its demo is 363 px wide: section "Absolute range", the trigger's label `span.ui-range-picker__label` holds a date range of 287 px on one line; let the label wrap or shorten the range under a container width
todo: pages/Dashboard: at 320 px its demo is 337 px wide: `div.dashboard__cards` does not fit the 222 px of content the demonstrator leaves at that width; check its minimum column width
todo: ListPage, SearchTable: a link with `page` and a facet, `t` or `search` opens on page 1: FacetFilter and RangePicker sit in SearchTable's toolbar and read the URL after SearchTable took the page, and SearchTable's first read uses the model's search, which a bound `v-model:search` returns only after the page passed it back; each is a filter change that starts at page 1 (`?page=2`, `?page=2&sort=name` and `?page=2&tab=active` keep page 2); ListPage could seed `clauses` and `range` from the URL before SearchTable mounts and SearchTable could read `fromUrl.search` into its first query; ListPage.md has the gotcha
todo: SearchTable: a page whose rows all leave (deletes, live changes) stays as an empty page past the last one ("101-100 of 100", "Page 5 of 4") instead of stepping back to the last page; ListPage shows "No customers match" there, not the first run
todo: scripts/test/setup.ts: three mounted tests (SettingsPage, ListPage, ApiKeyCreate) carry the same `showModal()` and `close()` shim for jsdom, and two (AgentDock, Tabs) a ResizeObserver stand-in; the harness could provide both
todo: WP15: on the merged state `bun test scripts ui pages demo/src` takes 2.90 to 3.04 s (607 tests), 2.58 to 2.63 s without this package's three test files (measured in round 1), over the D69 budget of 2 s either way; decide between smaller recipe tests and a new budget
keys: none
screenshots: ListPage (the demo bar gained "Without customers" in round 0; the recipe's default state is unchanged); Tabs, Table, SearchTable, SettingsPage, Pagination, PageHeader, Page and AppShell rendered with HEAD's files and the branch's on this machine: byte-identical, not moved
probes: Merged state (53cd426 and after). Frames after Enter on Clear filters (demo, 120 customers, 1440 px): "No customers match" until the rows at 211 ms, no "No customers yet" (before: from 62 ms); after emptying the search box: "No customers match" until the rows at 372 ms (before: "No customers yet" 210 to 371 ms). Two taps on Clear filters at 390 px, 60 and 100 ms apart: nothing opens, URL empty (before: the New customer dialog); from about 140 ms the second tap can open the drawer of the row that arrived under the finger (140 ms once in two runs, 170 and 200 ms both times), which no empty state can prevent. Real double click with a 150 ms async router guard: `?sort=name`, no chip (before: `?country=DE&sort=name`, chip back). Tabs at 390 px `?tab=churned`: counts shrink and grow, "Churned 16" 220..341 inside (before 244..365, cut); portrait, landscape, portrait: inside (before 368..489, outside); a strip the user wheeled to its start stays there through a rotation and four live changes. Enter on a focused row: the drawer opens and stays, focus on its Close (before: opened and closed by the same key press); Enter held 1 s: one open (before 15), the repeats then close it through its Close button (todo); Enter held 1.3 s on the delete confirm: one delete, no drawer (before: the next customer's drawer 18 times). Tabs: a tap on the active tab, then a rotation: "Churned 16" 220..341 inside (before 368..489); the Tab key across the strip in a 430 px window, then wider and narrower: inside. Focus after a delete: row-menu delete of the first row, bulk delete of rows 2 and 3, keyboard delete: the row that took the place. ListPage at 390, 360, 320 px, touch, both densities: as wide as the viewport, nothing off screen, Select all 49..165, sort select 49..221, pager buttons 44 x 44. Demos wider than 390 px after the demonstrator change: Input 672, Sheet 708 (todo lines); at 320 also RangePicker 363, Dashboard 337. Delete confirm with an injected 200 ms exit fade in round 0, and with the real fade by the reviewer: every frame of the exit reads the opening title and count. Touch probe, 61 demos: 0 offenders, 48 known, 14 exempt. Mutants: 30 of 31 of ListPage.vue, 10 of 10 of Tabs.vue, 3 of 3 of Table.vue's Enter handler and 3 of 3 of SearchTable's `stale` and `clearSearch()` fail a test; the survivor is an equivalent reordering in one tick.
