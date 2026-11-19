---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 4 h
groomed: no
---

## Task
UX hardening pass, work package WP05 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): AppShell's
phone navigation reaches everything (`12-A`: four tabs and More with a Sheet), the skip link and
the nav's name are `ui.*` keys (`10-J`), the shell sets `--ui-sticky-top` (`09-N`, shell side),
the rail names its links through Tooltip (`10-C`, rail), ghost Buttons on the top bar read
`--ui-on-chrome`. Decision D92 travels in the handover.

## Measurements
All in one-off Playwright runs against the demo (not committed), Chrome on this machine. Touch
means a context with `hasTouch` and `isMobile`, coarse pointer.
- Phone bar, AppShell demo section 2 (its item count and footer are switchable), 390, 360 and
  320 px, light and dark: 4 items, 4 tabs; 5 items, 5 tabs; 6 and 9 items, and 4, 7 and 9 items
  with a footer: 4 tabs and More. No label clipped (`scrollWidth` within `clientWidth`) at any
  width; every tab at least 44 px wide (320 px: 46.2 to 67.5 by 53) in both densities. With the
  current page (sixth item) behind More, More is painted as the current tab and carries
  `aria-current="true"`; with no current item behind it, it does not.
- More sheet by touch: a tap opens a modal dialog "More" listing items five onward (the current
  one `aria-current="page"`) and then the footer; focus lands on its X. Every target in it is at
  least 44 by 44 px in both densities at 390 and 320 px (links 280 to 350 by 44, the footer link
  85.5 by 44, the X 44 by 44). Escape closes it, focus returns to More.
- Navigation closes the sheet, focus on More each time, the shell stays: a tap on the page it is
  on (a duplicate navigation), a router navigation while it is open (query change), the browser's
  Back while it is open.
- Keyboard at 390 px: Tab runs Dashboard, Customers, Orders, Files, More; Enter on More opens the
  sheet; Tab runs X, the items, the footer link; Enter on Messages navigates to its route. The
  accessibility tree: `navigation "Main"` with four links and `button "More"`; `dialog "More"`
  with heading, `button "Close"`, the links (`link "Reports 3"`) and the footer.
- Press without release: a touch held 300 ms on More moves nothing and opens nothing; the sheet
  opens after the release.
- Double tap on More with the bar at the bottom of the viewport, as in an application: at 60,
  120 and 250 ms between the taps the second tap lands on a link or the footer of the sheet that
  rose under the finger; nothing happens and the sheet stays open, with and without reduced
  motion. Without the guard the same taps navigated to the item under the finger (60 to 250 ms).
  At 400 ms (past Chromium's double-tap time) the second tap is a tap of its own and opens the
  item under it. In the demo frame, where the bar sits mid-screen, the second tap lands on the
  backdrop and Chromium's own light dismiss (`closedby="any"`) closes the sheet (handover).
- Held Enter on More (one keydown and seven repeats): the sheet stays open. Without the guard it
  went open, closed, open, closed with every repeat (the repeat reached the sheet's X, focus came
  back to More, the next repeat opened it again). A held Enter on a link in the sheet navigates
  once, and until review round 1 its repeats then opened the sheet again on the new page.
- Rail at 900 px, fine pointer, light and dark: link names "Dashboard", "Customers 12", "Orders",
  "Files", "Settings", no `title`; hover shows the tooltip after the delay (none at 300 ms,
  "Customers" at 700 ms), placed at the inline end (panel left 336, link right 332); Tab shows it
  at once, Escape hides it. Touch at 900 px (the rail interval matches): a tap shows nothing
  800 ms later.
- Ghost Buttons on the top bar, 1280 px: light at rest `--ui-on-chrome` on `--ui-chrome`
  rgb(250 250 250) on rgb(24 24 27), 16.97:1 (base commit: rgb(63 63 70), 1.70:1); hover
  rgb(24 24 27) on rgb(244 244 245), 16.12:1; dark rest 16.97:1, hover 14.27:1. The ghost "Sign
  out" inside the account Popover placed in `actions` keeps `--ui-ink-2` on the panel: light
  rgb(63 63 70) on white, dark rgb(212 212 216) on rgb(24 24 27). With an extra Button rest rule
  injected after ours at (0,5,0) and with Button's rest rule at (0,0,0) the readings are the same,
  so the rule does not hang on Button's selectors.
- Sticky header, section 3 (the frame is the scroll container), 1280 and 1440 px: scrolled 300
  and 700 px, the header's top edge is at 421, the top bar's bottom edge (365 to 421). At 900 px
  the Table is cards (its own box under 48rem), no header.
- Nested sticky: a Sheet (60rem) opened from the page: at scroll 0 the header sits at 132 instead
  of 77, 56 px below where it belongs, over the first rows, and stays there; rows scroll above it.
  A Dialog: `lg` is at most 48rem, so a Table in a Dialog is always cards and shows no header;
  forced to 70rem the header sits 56 px too low the same way. Injecting the handover lines: with
  `0px` the header stops at the body's padding edge (20 px in Sheet, 16 px in Dialog) and rows
  show in that band; with minus the body's top padding it sits flush at the body's top (Sheet 56
  at 56, Dialog 77 at 77).
- A sticky ActionBar inside the shell at 390 px: while the page scrolls, the ActionBar (718 to
  787) covers the bottom bar (733 to 787); the point at its centre is its Save button (handover).
- The More sheet over a collapsed dock strip at 390 px: the sheet is above the strip (the point
  on the strip hits the sheet) and the dock is inert while the sheet is modal.
- Layout against the base commit, section 1 at 320, 390, 768, 900 and 1440 px, light and dark,
  pixel difference: changed rows only in the top bar (the Search button, the ghost colours, the
  title cut to "Ac..." at 320 px) and, at 768 px and below, in the bottom bar (More instead of
  Settings, because section 1 has a footer). Page width: `scrollWidth` equals the viewport at
  320, 360, 390, 768, 900 and 1440 px, also with the sheet open.
- Phone bar focus ring: the bar's `overflow: auto` cut the outer ring to its side segments; inset
  by 2px it is whole. Ring against the current tab's ground (inner edge) 4.24 to 6.50:1, except
  neutral dark 2.82:1; against the bar (outer edge) 4.82 to 7.88:1 (handover).
- Rail links on a touch tablet (900 px, both densities): 39 by 44 px, on the base commit too
  (handover).
- Screenshots of AgentDock and LoginPage (both use AppShell), rendered on the branch: byte-
  identical to renders of the base commit on this machine; left as committed.
- `just touch-probe --only=AppShell`: 0 offenders. `--all`: 61 demos, 0 offenders, 0 smaller than
  known, 0 stale, 48 known, 14 exempt.
- Tests: `ui/AppShell/AppShell.mounted.test.ts`, 10 cases. 30 single reverts of `AppShell.vue`
  (thresholds, `data-overflow`, the sheet's slice, closing on navigation, a route watch in place
  of `afterEach`, `aria-expanded`, the current mark, both footer places, the rail's tooltips and
  its listener, `title`, each part of the repeat guard, the four `ui.*` names): each fails at
  least one test.
- `bun test --randomize scripts ui pages demo/src`: the first five runs 547 pass, 0 fail each
  (seeds 3335470813, 2536463582, 1881330499, 1768257321, 2395196683); the five after the last
  edits 4 green and 1 with 546 pass, 1 fail (seed 2726340133): CommandPalette's "an ended
  connection shows no recent pick" expects an empty `localStorage` and finds `ui.theme`, which
  `useTheme` writes when SettingsPage's mounted test ran first. Not this package's: the base commit
  fails the same way (seed 2353181446, 1 in 15 runs without AppShell's test file). AppShell's
  cases never failed in any order. 2.58 to 2.80 s a run.

## What went wrong on first try
- The double tap in the demo frame closed the sheet although the click guard stopped the second
  click -> I took Sheet's script backdrop close for the cause and switched to
  `stopImmediatePropagation` -> it was Chromium's own light dismiss (`closedby="any"`); at the
  target, `stopPropagation` in the capture pass already skips the bubble pass, so it is back to
  `stopPropagation`, and the mounted case covers the script path only.
- The demo's footer link pointed at the demo's own path with a query -> RouterLink ignores the
  query, so it was marked `aria-current="page"` -> it leads to the Changelog recipe.
- The sticky fixture with the sidebar showed the Table as cards at 1280 px (its own box under
  48rem) -> the fixture's shell is `bare`.
- The Dialog and Sheet of the fixture first sat outside the shell -> they did not inherit the
  token, so the nested check measured nothing -> inside the Page, as a page's own dialog is.
- The first revert run passed with the three names written as literals -> the English messages
  equal the literals -> the test switches the locale to German.

## Instructions that were wrong or missing
- plan WP05 step 4: "Under 48rem `[data-overflow]` and the footer are hidden" and the sheet
  renders "then the `navFooter` slot" / both together render the footer twice (two component
  instances, doubled ids and `data-action`): built as one copy, in the sheet on phones and in the
  nav elsewhere, through a second media query (fixed now: no, the plan is not this package's
  file; deviation below).
- plan WP05 step 5a: the rule's form relies on the specificity of Button's rules / the brief asks
  for a form that does not: built through the token Button reads (fixed now: no; deviation).
- plan WP05 step 6: the sticky fixture "with a `Table sticky-header` of 30 rows" / in a shell with
  the sidebar the Table is cards below about 1440 px, and a Table in a Dialog is always cards
  (`lg` is 48rem): the fixture is `bare` (fixed now: no; deviation).
- `ui/Table/Table.md` Gotchas: "a scroll box that is not the page sets `--ui-sticky-top: 0px` on
  itself" / in a padded box the header then stops at the padding edge with rows showing above
  it; minus the top padding puts it flush (fixed now: no, WP09's card; handover).
- The WP09 handover asked for `0px` on Dialog, Sheet and DetailDrawer / measured: the flush values
  below.

## Questions I had to ask the human
- none

## Pieces that did not fit
- Sheet and Dialog: a held Enter on the opener reaches their X and closes them; the second click
  of a double click can land in the panel that just opened. AppShell guards its own sheet; the
  general fix belongs in Sheet and Dialog (handover).
- ActionBar: sticks to the bottom like the phone bar and covers it while the page scrolls; no
  token carries the bar's height (handover).
- The demonstrator's router has no in-place routes, so the demo's nav leads to other demos and the
  in-place navigation checks use the current item, a router call and Back.

## Deviations from the plan (for the as-built note of WP05)
- Step 5a: `--ui-ink-2: var(--ui-on-chrome)` set on the ghost Button (same selector with
  `:where(:not([popover] *, dialog *))`) instead of `color` at (0,4,0): Button's ghost resting
  colour reads `--ui-ink-2`, its hover colour `--ui-ink`, so order and specificity of Button's
  rules do not matter. The dependency is that pair of tokens (handover, for WP15 after WP04 and
  WP16).
- Step 4: the footer exists once (`phone` follows `matchMedia('(max-width: 48rem)')` beside
  `rail`). A navigation closes the sheet through `router.afterEach`, so a tap on the page it is
  on and Back close it too. More is marked current (`aria-current="true"`, the active ground)
  when the current item sits behind it (RouterLink's `router-link-active` on the hidden item
  decides). A double tap and a held Enter act once (a capture guard on the sheet: clicks with
  `detail` 2 or more, repeated Enter).
- Step 3: the count is hidden like the label (visually only) in the rail and in the phone bar, so
  a link's name is "Customers 12" at every width; before, the count was `display: none` there.
- Not in the steps, from the brief: `--ui-sticky-top: 0px` on the nav and the dock; the title cuts
  with an ellipsis (`min-width: 0` on the title too, which a flex child needs); the phone bar's
  focus ring is inset by 2px.
- Step 6: section 1 keeps its footer, so its phone bar shows four tabs and More; section 2 has an
  item count select (4, 5, 6, 7, 9, default 7) and a footer checkbox; the nav items lead to real
  demo routes (the old ones led nowhere); section 3 is `bare` and holds a Dialog and a Sheet
  (60rem) with sticky tables for the nested check.
- Step 7: 10 mounted cases instead of the two behaviours named (20 after review round 1).
- `AppShell.vue` was 216 lines, over the about 200 of stage 02. Review round 1 moved the More
  tab's behaviour into the sibling module `ui/AppShell/more.ts` (`useMore`), a file in the
  package's own directory, as the review proposed: `AppShell.vue` 210 lines, `more.ts` 78.

## Gate friction
- `bun test scripts ui pages demo/src` takes 2.5 s on the base of this package already (2.66 s
  with these 10 cases), over the 2 s of plan section 10 (handover).
- The touch probe measures what is visible on load, so the sheet's targets were measured in a
  one-off run with the same selector and rule.
- The screenshots of AgentDock and LoginPage come out modified on this machine without a change
  (the committed files were rendered elsewhere); restored.
- The fifth randomized run of the final gate failed in CommandPalette's suite: an order-dependent
  case on the base commit too (Measurements, handover).

## Time sinks
- Where the second tap of a double tap lands depends on where the bar is: mid-screen in the demo
  frame (backdrop), at the bottom of the viewport in an application (the sheet's content). The
  probe had to scroll the frame's bottom to the viewport's bottom to see the real case.

## Suggested improvements (for grooming)
- script: `scripts/touch-probe.ts` could open an overlay of a demo through a per-demo hint (a list
  of selectors to press before measuring), so a sheet's or menu's targets are probed, not only
  what shows on load.
- workbook `maintain-collection` stage 04: a control that opens an overlay gets the double click
  and held key check in a browser, with the opener where an application puts it.
- demo: a catch-all child route that renders the same demo, so a navigation demo can move in
  place and show its current item and its closing behaviour.
- Workbook prompts: no convention was unclear (Popover's and Sheet's demos were the pattern); no
  gate failed without a reason; the demo needed nothing from `demo/src/fake/`.

## Review round 1 (18.11.2026)
The review rejected the package with 2 MAJOR, 1 DESIGN and 9 MINOR findings. Before the fixes the
integration branch was merged into this branch (no conflict; the test harness now resets focus,
storage and views after every test). Every finding is fixed in this package's files or handed
over below; the More tab's behaviour moved into a sibling module, `ui/AppShell/more.ts`
(`useMore`), so `AppShell.vue` stays at 210 lines (it would have been 266).
- MAJOR guards for the sheet's whole life (finding 1): the guard now ends with the press that
  opened the sheet. More's click arms it; in the sheet it drops a click with `detail` 2 or more
  and a repeated keydown only while armed; the first event that is not part of that press (a
  click with `detail` 1, a fresh keydown, any keyup) disarms it. One boolean, no timer, no
  document listener: a closed sheet receives nothing and More arms it again on every open, so
  closing, a route change and unmount need no step of their own. It holds as long as the click
  count of the opening press keeps rising, the platform's double-click time. Measured in a
  full-viewport scratch fixture at 390 px, touch, with and without reduced motion: a double tap on
  More at 60, 120, 250, 350 and 400 ms leaves the sheet open and the route unchanged; sheet open
  2 s, a double tap on a footer button counts 2, five taps 150 ms apart count 5, a Switch tapped
  twice ends off; More, 400 ms, then a double tap on the footer button counts 2; with a mouse the
  same (2, off); a held `a` in a footer field types every repeat; a held Enter on a footer button
  repeats as it does in the desktop nav (9 for 8 repeats).
- MINOR held Enter on the X or a link (finding 2): More cancels a repeated Enter on itself
  (stateless). Held Enter on More: open, focus on the X; held on the X: closed, focus on More;
  held on a link: navigated once, closed, focus on More.
- MAJOR crossing 48rem with the sheet open (finding 3): a watcher on the 48rem query closes the
  sheet and, when focus was in the nav, hands it on after the render: to the element itself when
  it is still shown (it moved with the footer), else to the first shown of More, the current
  link, the first link. Chromium blurs a tab that a resize hides before the media query reports
  the change (measured: blur and focusout, then the change event, `activeElement` the body), so a
  focusout without a `relatedTarget` from an element that is no longer shown takes the same way.
  A closed dialog counts as gone, because a closing sheet keeps its box while it slides out (the
  first try left focus on the body for exactly that reason). Measured: sheet open at 390 px,
  widened to 844 px: closed, focus on the footer field, its text kept; on a sheet link or the X
  (to 844 and 1100): closed, focus on the current link "Reports"; More focused with the sheet
  closed, to 844 or to the rail at 900: focus on "Reports"; at 1024 focus on the footer field,
  to 390: More; on item 7: More; on item 2: stays; focus in the page: stays.
- MINOR the footer remounted (finding 4): one footer node in a `Teleport` into the sheet on
  phones, in the nav elsewhere. Measured over four crossings: the same node, an uncontrolled
  field and a `v-model` field keep their text, one footer, no duplicate id. An open Popover in the
  footer is hidden by the platform when its node moves, without a toggle event, so its trigger
  kept `aria-expanded="true"` (measured before the fix); the watcher now closes the footer's open
  popovers first: after the crossing `aria-expanded="false"`, and one click opens it again in the
  sheet and back at 1024 px.
- MINOR ring on the current phone tab (finding 5): `outline-color: var(--ui-on-accent-soft)` on
  the current tab and on a marked More. Measured on the current More tab, six preset and theme
  pairs: 8.49 to 10.34:1 against the tab, 10.36 to 14.52:1 against the bar (reverted: 2.82 to
  6.50 and 4.82 to 7.88). The pair `--ui-on-accent-soft` on `--ui-accent-soft` is declared in
  `scripts/contrast.ts` at 4.5, so no hand-over.
- MINOR rail links on touch (finding 6): `padding-inline: var(--ui-space-2)` on the rail. Measured
  at 769, 800, 900 and 1024 px, touch, both densities: 47 by 44 px (before 39 by 44), no sideways
  overflow; with a mouse at 900 px 47 by 40, the tooltip 4 px beside the link.
- MINOR `--ui-ink-2` leaks into a top-bar ghost Button (finding 7): kept, with a card gotcha; the
  clean form is a property Button owns, in the handover (`--ui-button-ghost-ink`).
- MINOR focus ring on the chrome (finding 8): `outline-color: var(--ui-on-chrome)` for every ring
  in the top bar outside a popover or dialog. Measured on the top bar's Search button: 16.97
  (neutral), 7.88 (paper), 17.06:1 (slate), light and dark (reverted: paper light 1.00, slate light
  3.17, neutral light 3.43). The pair `--ui-on-chrome` on `--ui-chrome` is declared at 4.5.
- MINOR stale More mark (finding 9): the mark is also taken after every render of the shell.
  Measured: five items with the fifth current, a footer appears: More `aria-current="true"` and
  painted at once.
- MINOR eight reverts passed (finding 10): 20 mounted cases now (10 before). 47 single reverts of
  `AppShell.vue` and `more.ts` (the reviewer's eight among them: the hook remover, the 48rem
  query, the mark after a nav change, the tooltip's kind, placement and text, `v-model` on the
  sheet, the count in the sheet) each fail at least one case. The file fakes the layout jsdom
  lacks (`getClientRects` from the CSS rules: an item past the fourth hidden on phones, More
  elsewhere; a closed dialog keeps its box, as while it slides out) and restores it after.
- MINOR hand-over lines (finding 11): corrected below (`--ui-sticky-bottom` with a height token,
  `bare` and the dock strip; both guard lines "only for the press that opened it"); the sentence
  on a held Enter on a link above is corrected by finding 2.
- DESIGN phone tabs sized to their label (finding 12): `min-width: 0` on a tab, `flex: none;
  max-width: 100%` on its label. Measured with the root font at 100, 112.5, 125, 150 and 200
  percent at 390, 360 and 320 px: five equal tabs (78, 72, 64 px), the bar never scrolls, More
  ends at the screen's edge, long labels end in an ellipsis, names whole (reverted, 200 percent:
  the bar scrolls 19 px at 390 and 89 px at 320, More ends at 409).
- Not changed: the placeholder names in the demo ("Acme" is on the base and in the starter,
  `.example` is a reserved domain), as the review concluded.
- Phone states again after the round (full-viewport fixture, 390, 360, 320 px, light and dark,
  both densities, 4, 5, 6 and 9 items and 4, 5, 9 with a footer, 84 states): tab count right,
  every tab at least 44 by 44, no label cut at the default size, no page overflow, More marked
  when the current item is behind it, every target the shell puts in the sheet at least 44 by 44,
  no duplicate id (the fixture's own unstyled field, 183 by 30, is the only smaller target).
- A second press within about 40 ms of More (a scripted double click at 0 and 40 ms) reaches the
  backdrop before the sheet is painted, and Chromium's light dismiss (`closedby="any"`) closes it;
  no human double click is that fast (60 ms and slower: stays open). Cancelling the dialog's
  `cancel` while armed would stop that, and would also swallow a back gesture right after the
  opening press until the next click or key in the sheet, so it is not built; the Sheet line in
  the handover names it.
- Gates on the merged state: `just index && just ci` green (vue-tsc, index current, 192/192 pairs,
  0 undeclared in 66 sources, ui-lint clean, template-check, 617 tests, build). `bun test scripts
  ui pages demo/src` twice in fixed order: 617 pass, 0 fail, 2.95 s each. `bun test --randomize`
  fifteen times: 617 pass, 0 fail each (2.96 to 3.06 s); the seed that showed CommandPalette's
  order dependence in round 1 (2726340133) passes too, the harness clears storage now. Without
  AppShell's test file the suite takes 2.66 s. `just touch-probe --all`: 61 demos, 0 offenders, 0
  smaller than known, 46 known, 14 exempt, and 1 stale entry, so it exits 1: the AgentDock demo's
  bar items. That demo forces the dock to `position: static`, which on phones gives the shell the
  columns `0px 0px 340px` (top bar and page 0 px wide, on the base too); its tabs overflowed a
  0 px bar at 39.5 px and now shrink with it to 0, so the probe no longer counts them. The entry
  is in `scripts/touch-probe.ts` and the demo is the AgentDock package's: handover.
- Screenshots: AppShell rendered, both looked at; byte-identical in size to round 1 and nothing
  visible moved at 1280 px (the fixes act on phones, the rail, focus and resizes).

What went wrong on first try in the round:
- The first hand-over after a crossing kept focus on a link of the closing sheet -> the sheet keeps
  its box while it slides out, so "has a box" said shown -> a closed dialog counts as gone.
- The first door was chosen from the 48rem query's ref -> Chromium blurs the hidden More before
  the query reports, so the ref was stale at the blur -> the door is the first shown of More, the
  current link, the first link.
- The first revert of "never disarmed" removed a line the `else` hung on -> a syntax error, not a
  revert -> the condition is emptied instead.

Instructions that were wrong or missing:
- The review's "fresh press anywhere" ends the guard / a pointerdown cannot end it, because the
  second tap of the double tap is a fresh pointerdown too: the guard ends on a click whose
  `detail` is 1 (fixed now: no, a review file; built so, said here).
- this report, Measurements: "A held Enter on a link in the sheet navigates once" / it also
  opened the sheet again on the new page before finding 2 (fixed now: yes, above).

Suggested improvements (for grooming):
- script: `scripts/touch-probe.ts` could take a per-demo viewport list, so the rail (769 to 1024
  px) is probed too; finding 6 was invisible to it.
- workbook `maintain-collection` stage 04: a guard on a press gets the question "what ends it", and
  a probe where the user presses twice on purpose later, as the review did.

## Closing round (19.11.2026)
Review round 2 approved the package with five MINOR findings; this round closes them. First the
integration branch was merged into this branch (no conflict; it brings the ListPage and Button
packages). Browser measurements in Chromium, one-off Playwright runs against the demo and a
full-viewport scratch fixture with in-place routes and a Dialog in the footer (not committed).
- Finding 1, a Dialog the footer renders itself, open while 48rem is crossed: it moved with the
  footer, stayed `open` with its model true and was no longer modal (a side effect of the
  `Teleport` of round 1). The watcher now closes the footer's open dialogs in the loop that hides
  its open popovers. It tells them apart by `:popover-open`, not by the element's class, so a
  `<dialog popover>` shown as a popover is hidden rather than given a `close()` that leaves it
  showing. Measured per animation frame: 1440 to 390 px by mouse and 1280 to 390 px by touch: from
  the first frame after the resize `open` false, not modal, model false; settled, focus on More;
  More and the footer's button open it modal again in the sheet (390 by 111 to 115 px). 390 to
  1440 px by touch and 390 to 1280 px by mouse, sheet open: the same, focus on the current link
  "Customers 12"; the footer's button in the sidebar opens it modal again (512 by 112 to 116). The
  round 2 code on the same probe: open, not modal, model true, 0 by 0 in the closed sheet or 255 by
  112 to 116 in the sidebar, and its button then closed it instead of opening it.
- Finding 3, Shift released while Enter still repeats on More: any key coming up ended the guard.
  Only Enter coming up ends it now, and an event that is not a repeat is never dropped (the tried
  form also cancelled and stopped a Shift keyup while armed, which a key listener in the footer
  would miss). The `keydown` test on a repeat went with it: a keyup never repeats. Measured at
  390 px by touch and by mouse, with and without reduced motion: Shift and Enter held on More,
  Shift released after four repeats, four more: open with focus on the X in every one of 44 frames
  and settled (round 2 code: open for 12 to 13 frames, then closed with focus on More); Tab then
  moves on. A plain held Enter on More: open, focus on the X. A held `a` in a footer field types 10
  of 10. Shift and Enter held, Enter released first: open, focus on the X, Shift+Tab acts.
- Finding 2, the click guard relies on the browser counting taps in `detail`: no code change. One
  sentence on the card and in D92; the double tap on More on an iPhone is a todo line for the
  owner's manual checks (plan section 12 is WP15's). The time-and-point fallback the review tried
  stays unbuilt until a phone shows the need; the todo line names it.
- Finding 4, tests: 23 mounted cases (20 before). New: a Popover and a Dialog open in the footer
  are closed when crossing 48rem in either direction; focus on More on a page no item leads to goes
  to the first link when crossing up; Shift coming up keeps the guard and is not dropped itself,
  Enter coming up ends it. jsdom parses `:popover-open` but matches nothing, so the file models it
  with an attribute its `showPopover` and `hidePopover` stubs set, and restores all of it after.
  The header says what the layout fake writes out and that the hand-over after a real resize is a
  browser check. Single reverts, each failing the case named: no closing loop, the loop on popovers
  only (the round 2 line), on dialogs only, the popover branch never taken: the footer case; any
  key coming up ending the guard, a Shift keyup swallowed while armed: the Shift case; the first
  link dropped from the doors: the first-link case. Nine single reverts of `swallowRepeat` (a key's
  repeat, `detail`, always swallowing, no `preventDefault`, no `stopPropagation`, never disarming,
  no key coming up ending it) each fail one to four cases.
- Finding 5, the stale touch-probe entry: the AgentDock demo set the dock `position: static`, which
  under 64rem put it into a grid track the shell does not define: at 390 px the columns were `0px
  0px 340px` (bar items 0 px wide), at 900 px `64px 146px 0px 384px` (the page 146 px wide). The
  demo now makes its frame `position: relative` and the dock `position: absolute` under 64rem, so
  the dock lies over the frame as it lies over the viewport in an application (`position: fixed`
  would have laid it over the demo page). Measured in both densities: 390 px touch, columns `340px`
  (`356px` compact), tabs 113.3 by 53 (118.7 by 53), the dock 340 by 582 inside the frame; with the
  dock closed the bar sits inside the frame and each tab is hit at its centre; 900 px touch,
  `64px 530px`, rail links 47 by 44, the dock inside the frame; 1440 px unchanged (`256px 494px
  384px`, dock static). The heading and the Stream button above the frame are hit where they are,
  with the frame in view and scrolled to the heading; no page overflow. The 1280 px screenshot
  renders pixel-identical with the old and the new demo. The `known` entry and its `TODO.md` line
  are removed (this round was cleared for those two files and the demo).
- Gates after the merge: `just index`, then `just ci` exit 0 (192/192 pairs, 0 undeclared in 66
  sources, ui-lint clean twice, template check, 646 tests, build). `bun test --randomize scripts ui
  pages demo/src` ten times: 646 pass, 0 fail each, 3.33 to 3.43 s. `just touch-probe --all`: 61
  demos, 2 densities: 0 offenders, 0 smaller than known, 0 stale entries, 46 known, 14 exempt, exit
  0. Screenshots: AppShell rendered and looked at; AgentDock's committed files left as they are
  (every render here, with the old demo or the new, is 52 px taller than them; WP15 renders all).

What went wrong on first try in the round:
- The first hit test of the AgentDock demo at 390 px ran with the page at the top, where the
  section is below the fold -> both points "off screen" -> scrolled to the heading.
- Shift+Tab from the sheet's X reported focus on the body -> Chromium does that from the first
  control of any modal dialog (the page's own Dialog the same), the next Shift+Tab wraps inside ->
  not the shell's.

Instructions that were wrong or missing:
- the tried fix for finding 3 / its `else if (opening)` branch also cancelled and stopped a key
  coming up that is not Enter while armed: built so that only repeats are dropped (fixed now: no,
  a review file; said here).
- the tried fix for finding 1 / `instanceof HTMLDialogElement` picks `close()` for a `<dialog
  popover>` shown as a popover: built on `:popover-open` (fixed now: no, a review file).

## Handover
decision: D92, changed: **Phone navigation reaches everything.** Under 48rem, with more than five items or a `navFooter`, the bar shows the first four items and a More tab that opens a Sheet with the rest and the footer (WCAG 2.2 SC 1.4.10: no content or function is lost when the layout reflows). The tabs share the bar equally and a long or enlarged label ends in an ellipsis, so More never leaves the screen. More is marked when the current page sits behind it; any navigation closes the sheet and focus returns to More. A double tap or a held Enter on More acts once: the rest of the press that opened the sheet (the second click, the key's repeats) does nothing in it, and the first click or key that is not part of that press ends the guard; of the keys coming up only Enter does. A second tap counts as part of that press where the browser counts taps in the click's `detail` (Chrome does; a phone's Safari is not verified). Crossing 48rem closes the sheet and a Popover or Dialog open in the footer; the footer is one node that moves between the nav and the sheet, keeping what is typed in it, and focus on something the crossing hides goes to More on phones, else to the current link, else the first. The skip link and the nav's name are `ui.*` keys (D44). The shell sets `--ui-sticky-top` to the top bar's height; a scroll box that is not the page sets it again (the nav and the dock `0px`, a padded box minus its top padding). The rail hides label and count from the screen only, shows the name through Tooltip and keeps its links 44 px wide on touch; the phone bar hides the count the same way. Ghost Buttons in the `actions` slot read `--ui-on-chrome` through `--ui-ink-2`, the token their resting colour reads, so the rule does not depend on Button's selectors; a focus ring on the top bar is `--ui-on-chrome`, on the current phone tab `--ui-on-accent-soft`. The title gives way to a crowded `actions` slot with an ellipsis.
journal: 18.11.2026 maintain-collection ux-wp05-shell - done after two review rounds and a closing round: phone bar with four equal tabs and More (Sheet with the rest and the footer, current page marked, closes on any navigation and when crossing 48rem with the footer's open Popover or Dialog, focus handed on, double tap and held Enter act once and end with that press, one footer node moved), rail tooltips and 44 px rail links on touch, ui.* names, --ui-sticky-top on the shell, chrome ghost Buttons through --ui-ink-2, focus rings on the chrome and the current tab, title ellipsis, 23 mounted cases (D92); run report journal/runs/2026-11-18-maintain-collection-ux-wp05-shell.md
readme: none
todo: Sheet: `.ui-sheet__body { --ui-sticky-top: calc(-1 * var(--ui-card-p)); }` (its body is the scroll box and pads `--ui-card-p`); today a sticky Table header in a Sheet inside AppShell sits 56 px too low from the start, over the first rows; measured in the AppShell demo's sticky fixture (Sheet 60rem, 1440 px, scrolled 300 px): header at 132 (compact 128) under a body at 56, with this line at 56 in both densities; with `0px` it stops 20 px low with rows in the band above it
todo: Dialog: `.ui-dialog__body { --ui-sticky-top: calc(-1 * var(--ui-space-4)); }` (its body pads `--ui-space-4` at the top); today invisible, because `lg` is at most 48rem and a Table in a Dialog is always cards; a Dialog widened to 70rem shows the header at 149 under a body at 77 (compact 143.5 under 71.5), with this line flush in both densities
todo: DetailDrawer: nothing of its own once Sheet's line lands (its content is Sheet's body); if Sheet does not take it, `.ui-detail-drawer { --ui-sticky-top: calc(-1 * var(--ui-card-p)); }` on its root, the Sheet's dialog
todo: Table.md Gotchas: "a scroll box that is not the page sets `--ui-sticky-top: 0px` on itself" becomes "sets it on itself: `0px`, or minus its top padding, else the header stops at the padding edge and rows show in the band above it"
todo: the phone bar's height as a token, read by what sticks to the bottom: a new `--ui-tabbar-h: 3.375rem` (the bar measures 54 px today and grows with the text, 67.25 px at 125 percent, so the bar takes `height: var(--ui-tabbar-h)` under 48rem and both agree at any text size); AppShell sets `--ui-sticky-bottom: var(--ui-tabbar-h)` under 48rem except with `bare` (no bar: stays `0px`, the default in tokens.css); ActionBar reads `bottom: var(--ui-sticky-bottom, 0px)` (today a sticky ActionBar covers the bar while the page scrolls: ActionBar 718 to 787 over the bar 733 to 787 at 390 px, the point at its centre is its button); the collapsed dock strip's bottom inset reads it instead of `--ui-touch-min` (today the strip ends 10 px inside every tab: strip 752 to 800 over the bar 790 to 844, both densities; 23 px at 125 percent text); a scroll box that is not the page sets it to `0px` as for `--ui-sticky-top`; files tokens.css, ActionBar.vue, AppShell.vue
todo: Sheet and Dialog: a held Enter on the control that opened them reaches their X and closes them, and the opener opens them again with the next repeat; drop the repeats of a held key inside an open dialog only for the press that opened it (until the first key event that is not a repeat), as AppShell's More does since review round 1; then AppShell's key guard in the sheet can go
todo: Sheet and Dialog: the second click of a double click on an opener lands in the panel that just opened (on More before its guard, double taps at 60 to 250 ms opened the item under the finger); ignore clicks with `detail` 2 or more in the dialog only for the press that opened it (until the first click with `detail` 1 or any key), as AppShell's More does; a second press within about 40 ms, before the panel is painted, lands on the backdrop and Chromium's light dismiss (`closedby="any"`) closes it; then AppShell's click guard can go
todo: Button and AppShell, the ghost ink on the top bar as a property Button owns: Button.vue `.ui-button[data-variant="ghost"] { color: var(--ui-button-ghost-ink, var(--ui-ink-2)); }`; AppShell.vue replaces `.ui-app-shell__actions :deep(.ui-button[data-variant="ghost"]:where(...)) { --ui-ink-2: var(--ui-on-chrome); }` with `.ui-app-shell__actions { --ui-button-ghost-ink: var(--ui-on-chrome); }` and `.ui-app-shell__actions :deep(:is([popover], dialog)) { --ui-button-ghost-ink: initial; }`; today `--ui-ink-2` is redefined for everything inside such a Button (a neutral Badge in it is 1.02 to 1.11:1 in light themes, measured in review round 1); then the card's gotcha about it goes; judged sound in review round 2 by injection on the merged tree: rest and hover unchanged in all six preset and theme pairs, "Sign out" in the Popover and a ghost Button in the nav footer keep `--ui-ink-2`, a neutral Badge in a top-bar ghost Button goes from 1.02 to 1.11:1 to 7.41 to 10.08:1; it is the first custom property a piece offers to its surroundings, so `--ui-button-ghost-ink` needs a row on Button's card and a decision number of its own
todo: WP15 after WP04 and WP16 merged: the top-bar ghost rule depends on Button's ghost variant painting its resting text with `--ui-ink-2` and its hover text with `--ui-ink`; re-check in the AppShell demo, light and dark: rest `--ui-on-chrome` on `--ui-chrome`, hover `--ui-ink` on `--ui-surface-2`, the account Popover's "Sign out" keeps `--ui-ink-2`
todo: WP16: a pressed ghost Button must set its text colour (`--ui-ink`) with `--ui-surface-3`, else a pressed ghost Button on the top bar keeps `--ui-on-chrome` (light) on a light ground
todo: `knowledge/laws-of-ux/millers-law.md` line 19 and `serial-position-effect.md` line 18 say AppShell shows "the first five" nav items as phone tabs; since WP05: up to five, else the first four and More
todo: AppShell: a nav item's count shows in the sidebar only; the rail and the phone bar keep it for screen readers (since WP05) but show none; a badge on the icon is a design decision
todo: plan section 12, owner's manual checks: a double tap on More on an iPhone opens the sheet once and opens nothing under the finger; More's click guard relies on the browser counting taps in the click's `detail` (Chrome does, within its double-tap time and about 20 px); if Safari reports every tap as `detail` 1, More's click records time and point and a click within 400 ms and 20 px of it counts as the same press (`ui/AppShell/more.ts`; three mounted cases then need click coordinates)
todo: AgentDock demo: the `on-chrome` class on the Assistant ghost Button and its rule do nothing since WP05 (the shell paints the button `--ui-on-chrome`; measured at 1440 px: rgb(250 250 250) with and without the class, light and dark); remove both, AgentDock.demo.vue
todo: plan section 10: `bun test scripts ui pages demo/src` takes 2.66 s on the merged integration branch without AppShell's test file and 2.95 to 3.06 s with its 20 cases; after the closing round's merge (ListPage and Button packages in, 646 tests) 3.33 to 3.43 s, over the 2 s budget
keys: none
screenshots: AppShell (nothing visible moved at 1280 px in review round 1)
probes: Chrome, one-off Playwright runs (not committed) against the AppShell demo and a full-viewport scratch fixture with in-place routes. Round 1: phone bar at 390, 360, 320 px, light and dark, touch, 4 and 5 items as tabs, 6 and 9 items and 4, 7, 9 with a footer as four tabs and More; current page behind More marks it; sheet targets at least 44 by 44 in both densities; Escape, X, backdrop, a link, a tap on the current page, Back and a router push close it, focus to More; keyboard reaches More and everything in the sheet; a press held 300 ms moves nothing. Rail at 900 px: names "Customers 12", no `title`, tooltip at the inline end after the delay, at once on Tab, nothing on touch. Top-bar ghost Buttons, light: rest 16.97:1 (base 1.70:1), hover 16.12:1; dark 16.97:1 and 14.27:1; the Popover's ghost keeps `--ui-ink-2`; unchanged with Button's rest rule injected at (0,5,0) after ours and at (0,0,0). Sticky fixture at 1280 and 1440 px: header top equals the top bar's bottom after 300 and 700 px. Layout against the base commit: changes only in the top bar and, at 768 px and below, the bottom bar; no horizontal overflow at 320 to 1440 px. Review round 1, full-viewport fixture: 84 phone states (390, 360, 320 px, light and dark, both densities, 4, 5, 6, 9 items, with and without footers): tabs right, at least 44 by 44, none cut, no overflow, More marked, every target the shell puts in the sheet at least 44 by 44, no duplicate id. Double tap on More at 60 to 400 ms, touch, with and without reduced motion: sheet stays open, route unchanged; a scripted mouse double click at 0 and 40 ms reaches the backdrop and light dismiss closes the sheet, at 80 ms and slower it stays. Sheet open 2 s: a double tap on a footer button counts 2, five taps 150 ms apart 5, a Switch tapped twice ends off, a mouse double click 2 and off; More then a double tap on the footer button 400 ms later counts 2; a held `a` in a footer field types every repeat. Held Enter on More: open, focus on X; on X: closed, focus on More; on a link: navigated once, closed, focus on More. Crossing 48rem: sheet open with focus on the footer field, 390 to 844: closed, focus and text kept on the same node; on a sheet link or the X (to 844, 1100): focus on the current link; More focused, sheet closed, to 844 or 900: current link; at 1024 focus on the footer field or item 7, to 390: More; on item 2 or in the page: stays; four crossings keep the uncontrolled and the `v-model` field's text, one footer. Footer Popover open, crossing: closed with `aria-expanded="false"` (before the fix "true"), one click opens it again in the sheet and at 1024. Focus rings, six preset and theme pairs: current phone tab 8.49 to 10.34:1 on the tab and 10.36 to 14.52:1 on the bar (reverted 2.82 to 6.50), top bar 7.88 to 17.06:1 on the chrome (reverted paper light 1.00). Rail links on touch at 769, 800, 900, 1024 px, both densities: 47 by 44 (before 39 by 44), no overflow, tooltip 4 px beside. Text at 100 to 200 percent at 390, 360, 320 px: five equal tabs, the bar never scrolls, More at the screen's edge, labels cut with an ellipsis (reverted at 200 percent: bar scrolls 19 and 89 px, More ends at 409). A footer appearing while item 5 is current marks More at once. Nested sticky lines confirmed in both densities (numbers in the todo lines); dock strip and ActionBar measured (numbers in the todo line). Touch probe: `--only=AppShell` 0 offenders; `--all` 0 offenders, 0 smaller than known, 46 known, 14 exempt, 1 stale (the AgentDock entry, todo above). Tests: 20 mounted cases, 47 single reverts each fail one; fixed order twice 617 pass; `bun test --randomize` fifteen runs 617 pass, 0 fail. Closing round, after merging the integration branch: a Dialog open in the footer while 48rem is crossed (1440 and 1280 to 390, 390 to 1440 and 1280, touch and mouse): closed, not modal, model false from the first frame after the resize, focus on More or the current link, its button opens it modal again (before: open, not modal, model true); Shift and Enter held on More, Shift released while Enter repeats, 390 px touch and mouse, with and without reduced motion: open with focus on the X in all 44 frames (before: closed after 12 to 13 frames); AgentDock demo at 390 px: columns `340px`, tabs 113.3 by 53, the dock inside its frame, the page above it not covered, 900 px `64px 530px`, 1440 px unchanged; touch probe `--all` 0 offenders, 0 stale, exit 0; 23 mounted cases, every new one fails on its single revert; `just ci` 646 tests; ten randomized runs 646 pass, 0 fail
