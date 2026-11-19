---
date: 18.11.2026
workbook: maintain-collection
project: govengers/ui
outcome: done
duration: about 90 min, review round 1 about 150 min, round 2 about 60 min
groomed: no
---

## Task
UX hardening pass, work package WP03 (plan `docs/plan/impl/govengers-ui-ux-overhaul.md`): the new
primitive `Tooltip` (`10-C`, the piece; the rail is WP05) and Popover's placement moved into
`ui/Popover/place.ts` with an `end` side. Decision D90 travels in the handover.

## Measurements
- Popover after the move: both screenshots are byte-identical to a render of the base
  `Popover.vue` on the same machine and browser, and the whole test suite stays green. Popover's
  users (Menu, FacetFilter, RangePicker, ColumnsPicker, NotificationInbox) have no mounted suites;
  their directories hold helper tests only, so the suite says nothing about their placement
  (corrected in review round 1, which measured it: see below).
- `bun test ui/Tooltip`: 12 cases. Each guarded branch was reverted on a copy once (touch check,
  the panel's `pointerover`, `claim`, Escape's `preventDefault`, `describe`, the inside-form
  lookup, the re-bind after a render): every revert fails one case. The review found five reverts
  that passed; round 1 closes them.
- Browser check (one-off Playwright run, not committed, Chromium, 1280 by 900): see `probes` in
  the handover. Before round 1 the gap crossing held at 60 px/s and was lost at 30 px/s (a 4 px
  gap and 100 ms of grace need 40 px/s); round 1 adds a bridge that removes the floor.
- `just touch-probe --only=Tooltip`: 0 offenders. `just touch-probe --all`: 0 offenders, 0
  smaller than known, 0 stale entries, 48 known, 14 exempt (as after WP02).
- `just index` (left unstaged), `just ci`: green on the first run, 192/192 contrast pairs, 0
  undeclared pairs in 65 style sources, 428 tests.

## What went wrong on first try
- The first gap probe read the page between 1 px steps -> each step took about 32 ms, so 4 px
  took about 130 ms, over the 100 ms grace, and every crossing "failed" -> frame sampling inside
  the page and no wait between steps (about 16 ms per step); the slower runs stay as the
  measured floor.
- The first check of the card's name gotcha used a toolbar button with `aria-label` -> the label
  wins over the content, so the name never changed -> the probe removed the label and added a
  text node, and the name became "Strong Bold".
- The first Escape check in the dialog ran after a slow crossing had already lost the tooltip ->
  the first Escape closed the dialog -> rerun after a crossing that kept it: the first Escape
  hides the tooltip only.

## Instructions that were wrong or missing
- plan WP03 step 4: "the panel's id is appended to the trigger's `aria-describedby` while
  mounted", with a panel rendered only while shown / ambiguous: built as "while the panel
  exists", so the reference never points to a missing element (fixed now: yes, the plan's "As
  built" note).
- plan WP03 step 2: the inside form takes "the element the Tooltip sits in" / put into a piece's
  slot (Button's default slot) that is the piece's inner element, which keyboard focus never
  reaches (fixed now: yes, a gotcha on `Tooltip.md`).
- plan WP03 step 5: "a static open example" / Tooltip has no open prop and `screenshots.ts` does
  not hover: the demo focuses its trigger on mount (fixed now: yes, the plan's "As built" note).
- plan WP03: no word on Escape inside a modal dialog / without `preventDefault` one Escape hides
  the tooltip and closes the dialog too (fixed now: yes, built, D90 in the handover).

## Questions I had to ask the human
- none

## Pieces that did not fit
- Popover: the anchor is the trigger slot's first element. A Tooltip wrapped around that element
  is `display: contents` and has no box, so the Popover's panel lands in the corner of the page.
  Card gotcha on `Tooltip.md` (round 1 replaced it: `place()` looks through such an element).
- Button: the default slot sits in `ui-button__label`, so a Tooltip put there gets hover but not
  focus. WP04 renders it in Button's root, which is right.

## Gate friction
- `screenshots/Popover.dark.png` came out modified although Popover's look did not move: the
  committed file predates WP01's border shade. A byte compare against a render of the base
  `Popover.vue` settled it. Left unstaged (plan 7.1).

## Time sinks
- The gap-crossing probe: Playwright's move round trip (about 16 ms) is the slowest clean step it
  can take, and separating probe overhead from tooltip behaviour needed sampling inside the page.

## Suggested improvements (for grooming)
- Tooltip: a hover bridge (the panel's hit area reaching over the gap, by `data-placement`) would
  remove the 40 px/s floor of the grace (built in review round 1).
- script: `screenshots.ts` could take a per-demo focus or hover hint, so an overlay without an
  open prop needs no focus on mount in its demo.
- Popover: `place()` could anchor on the first descendant that has a box, so a Tooltip may wrap
  a Popover's trigger (built in review round 1).
- workbook `maintain-collection` stage 03: say that the card's body sections are the ones that
  apply (Button and Tooltip have no Events).
- Workbook prompts: no convention was unclear (Popover's `display: contents` root was the
  pattern); no gate failed without a reason; the demo needed nothing from `demo/src/fake/`.

## Review round 1 (18.11.2026)
The review rejected the package with 4 MAJOR, 2 DESIGN and 9 MINOR findings, all on Tooltip; the
Popover move was measured clean. Every MAJOR and MINOR is fixed in this round; the two DESIGN
findings are owner and WP16 matters and go into the handover as TODO lines.
- MAJOR hoverable: 4 px between trigger and panel belonged to neither, so a pointer slower than
  44 px/s lost the panel. The panel now carries a bridge, a `::before` on the trigger's side
  (`data-placement` decides which), as deep as the gap plus the border. Measured with paced mouse
  events and frame sampling in the page: kept every frame at 2, 15 and 60 px/s in the wrapper
  form below and above, the inside form, `end` and inside a modal dialog. The bridge lives as long
  as the panel, and a press on it hides the panel; that one press does not reach what lies under
  it. That it covers the gap only held at a 16 px root font size only, see review round 2.
- MAJOR press by key: only `pointerdown` hid it, so on a Popover without `autofocus` the first
  Escape went to a tooltip hidden under the open panel. A `click` on the trigger hides it now
  (Enter and Space), and after a pointer press hover shows nothing until the pointer left the
  trigger. Measured on the reviewer's scratch demo: Enter opens the popover with no tooltip and
  one Escape closes it; after a mouse click and a 14 px move inside the trigger nothing shows over
  the open panel for 700 ms; after the pointer left and came back the tooltip shows again.
- MAJOR modal dialogs: the focus `showModal()` moves to the X counted as the user reaching it.
  `modalOpening` in `tooltip.ts` skips focus that arrives in an open modal dialog from outside it
  or from nowhere. Measured on a copy with WP04's planned Button line: a Dialog and a Sheet opened
  by Enter show no tooltip on the X and close with one Escape; Tab and Shift+Tab back to the X
  show "Close", then Escape hides it and a second Escape closes the dialog.
- MAJOR persistent: a tooltip shown by focus hid when the pointer passed over the trigger and
  left. A `focused` flag holds it until blur or Escape. Measured: Tab to Duplicate, the pointer
  over the button and away, 400 ms later the tooltip is still shown and the button still matches
  `:focus-visible`; Escape hides it.
- MINOR gotcha into guard, the name: the inside form's panel is `aria-hidden` for `description`
  too. Chromium's accessibility tree: name "Strong", description "Bold" (before: "Strong Bold").
- MINOR gotcha into guard, the anchors: `place()` looks through a `display: contents` anchor to
  its first element with a box (`boxed`), and the wrapper form takes its trigger the same way.
  Measured: a Tooltip around a whole Popover and one around the element in a Popover's `trigger`
  slot both put the tooltip 4 px under the trigger and the Popover's panel under it, and
  `aria-describedby` lands on the button.
- MINOR frame loop: focus, blur and focus in one task started two loops. `show()` stops a running
  loop first. Measured: 30 callbacks per 500 ms after that sequence, 0 after blur, 0 after a route
  change unmounted the demo.
- MINOR `end` at the edge: it takes the inline start (`data-placement="start"`) where only that
  has room. Measured at the right edge: the panel ends 4 px before its trigger and the element at
  the trigger's centre is the trigger.
- MINOR `kind` changed while shown: the panel's id leaves `aria-describedby` on hide whatever
  `kind` is then.
- MINOR long token: `overflow-wrap: anywhere`; a 100-character URL wraps (`scrollWidth` 254 in a
  `clientWidth` of 254).
- MINOR Escape stopped on its way up: the listener runs in the capture phase. The card and D90
  now say what is true: the key's default is cancelled, so a native dialog or popover under the
  tooltip stays; a piece that reads Escape in script still gets the key.
- MINOR card silent: gotchas for a disabled trigger, attributes on `<Tooltip>`, a text field
  showing it on every focus; `end` at the edge is fixed in code.
- MINOR tests: `ui/Popover/place.test.ts` (9 cases, every branch, `end` in both writing
  directions and its flip, the `display: contents` anchor) and 14 new mounted cases (26 in all):
  a spy on `showPopover`, a focus that is not `:focus-visible`, a move between children of the
  trigger, unmount and the frame loop counted through a `requestAnimationFrame` spy, plus one per
  fix above. 29 single reverts on a copy (every guard of this round and the five the review found
  passing): each fails at least one test (review round 2 found two more guards that no test
  pinned). The false sentence about mounted suites of Popover's users is corrected above.
- Placement parity after `boxed`: 2,400,000 random rectangles through the old function and
  `place.ts` give the same styles, and 392 real placements in Chromium (the review's probe: the six
  Popover users, 1440 px fine and 390 px touch, both writing directions, seven anchor positions,
  after a scroll and a resize) are identical to 7ffdd4c.
- Findings of an independent second review that the review did not take over stay as they are (a slotted component that replaces
  its own root, a reactive `aria-describedby` on the trigger, `maxHeight` kept when `placement`
  changes at run time): no piece does any of them.

What went wrong on first try in the round:
- The first frame-loop check after a route change read 30 callbacks per 500 ms -> the route was
  Popover's demo, whose open-on-load panel follows its trigger every frame -> a route without an
  open overlay (Badge): 0.
- The first 60 px/s runs reached 30 px/s -> two CDP moves per pixel cost a frame each -> one move
  per pixel: about 55 px/s, the fastest the paced loop gives.

Instructions that were wrong or missing:
- plan WP03 step 3: hide "on `pointerdown` on the trigger" / any press hides, a key press is a
  click (fixed now: yes, the plan's "As built" note).
- plan WP03 step 3: "show at once on `focusin`" / not for the focus a modal dialog moves in while
  it opens (fixed now: yes, the plan's "As built" note).
- this report, Measurements: "the mounted suites of Popover's users stay green" / there are none
  (fixed now: yes).

Suggested improvements (for grooming):
- workbook `maintain-collection` stage 02: an overlay piece gets a check of WCAG 2.2 SC 1.4.13 at
  a slow pointer speed (a few px/s), not only at the speed a probe moves by default.
- workbook `maintain-collection` stage 04: a claim about other pieces' suites names the files.

## Review round 2 (18.11.2026)
The re-review approved the package; four MINOR findings were fixed before the merge, because
Button and Shell build on this piece next.
- MINOR bridge depth: the bridge was `--ui-space-1` (rem) deep while the gap is the script's 4 px,
  so they matched at a 16 px root font size only (a seam at 12 px, the trigger's last rows covered
  at 20 and 24 px). The panel now gets `--ui-tooltip-gap` inline from the same `gap` constant that
  `place()` gets, and the four `::before` rules read it. Measured with the browser's default text
  size set to 12, 16, 20 and 24 px: the gap is 4.00 px at every size, and the panel is kept every
  frame at 2 px/s in the wrapper form below and above, the inside form, `end` and inside a modal
  dialog (20 of 20). The last pixel row wholly inside the trigger is the trigger at every size, and
  a click there reaches the button while the tooltip shows (rows 149, 200, 250, 300). Where the
  trigger's bottom edge falls inside a pixel row (12, 20 and 24 px: at 150.875, 251.25, 301.75)
  that one shared row hits the panel: Chrome counts a point as on an element up to 1 px before
  its edge (at 16 px, 200.00 is the trigger and 200.25 the panel, with the edge at 201), and the
  panel is on top.
- MINOR the tooltip over its own open menu: hovering the trigger again while its menu or popover
  was open showed the tooltip over the first item, and the first Escape went to it. `show()` and
  the focus path now return while the trigger has `aria-haspopup` and `aria-expanded="true"`.
  Popover hands both attributes to its trigger slot as `expanded`, and every user in the
  collection binds them on the slot's element (Menu's own kebab Button, ColumnsPicker,
  RangePicker, NotificationInbox, FacetFilter, the demos); `boxed()` takes the Tooltip around a
  whole Popover to that same element. Measured on a copy with WP04's planned Button line: the
  Menu's kebab, a Popover with a Tooltip inside its trigger, a Tooltip around a whole Popover and
  one around the element in a Popover's trigger slot: click, move into the panel and back, 800 ms:
  no tooltip; one Escape closes the panel; out and back on the closed trigger shows the tooltip.
  The same run without the guard shows the tooltip over all four panels and needs two Escapes.
  As a side effect the tooltip no longer reappears when a menu closes by Escape and focus returns
  to its trigger (the attribute is still "true" when that focus lands).
- MINOR two guards without a test: the `:modal` check (the dialog case now first expects the
  panel for focus from outside into an open dialog that is not modal) and the reset of `pressed`
  when the slot swaps its element (a new case). Two more cases: a Popover open around its trigger
  and around the whole Popover (hover and focus show nothing, closed again hover shows it and the
  earlier focus holds nothing), and an expanded disclosure without `aria-haspopup` that still
  shows it. 35 single reverts on a copy, the 29 of round 1 and six of this round: each fails at
  least one test.
- MINOR run report: the sentence on the trigger's last pixel row is corrected above and measured
  here; the name of the second review's tool is gone.

What went wrong on first try in the round:
- The probe of the last pixel row used `elementFromPoint` at half pixels -> at every size the row
  read as the panel -> a mouse sits on whole CSS px at a device pixel ratio of 1, and Chrome counts
  a point as on an element up to 1 px before its edge: the rows are measured at whole pixels.
- The probe of a Tooltip around a Popover clicked a trigger below the viewport -> nothing opened
  -> `scrollIntoViewIfNeeded()` first.
- The first version of the popover case focused the trigger after closing it, which shows the
  tooltip by focus and holds it -> the focus moves in while the popover is open.

Suggested improvements (for grooming):
- Tooltip: the shared row at fractional sizes could go to the trigger by placing the bridge's edge
  on the next whole pixel; not built, it is one row and part trigger, part gap.

## Handover
decision: D90, changed: **Tooltip is the one hint on hover and focus.** `ui/Tooltip` shows one plain sentence: after `tooltipDelay` on a hovering mouse or pen, at once on keyboard focus. Shown by focus it stays until blur or Escape; shown by hover it stays while the pointer is on the trigger or the panel, the gap between them counting as the panel, and leaves `tooltipGrace` after the pointer left both; any press on the trigger, by pointer or by key, hides it (WCAG 2.2 SC 1.4.13, APG Tooltip pattern). Nothing shows while the trigger's own menu or popover is open (`aria-haspopup` with `aria-expanded="true"`). Escape cancels the key's default, so a modal dialog or a popover under the tooltip stays for the next Escape. The focus a modal dialog moves to its first control while it opens shows nothing, so a dialog opened by keyboard closes with one Escape. It is `popover="manual"`: `hint` is not widely available and `auto` would close an open menu. Two forms: around one element, or as a child of its trigger. Touch shows nothing, so a tooltip never carries what the user needs. The placement code is `ui/Popover/place.ts`, shared with Popover; it looks through a `display: contents` anchor, and `end` takes the inline start where only that has room. The native `title` attribute is not used for names. Amends D51.
journal: 18.11.2026 maintain-collection ux-wp03-tooltip-and-placement - done after two review rounds: Tooltip in two forms (description and label, 500 ms delay, 100 ms grace, a bridge over the gap, focus tooltips persist, any press hides, nothing over its own open menu, a modal dialog's opening focus shows nothing, Escape closes one layer, one at a time), Popover's placement in place.ts with an end side and display: contents anchors, 29 mounted and 9 placement tests, browser checks of SC 1.4.13 at 2 to 60 px/s and root font sizes 12 to 24 px (D90); run report journal/runs/2026-11-18-maintain-collection-ux-wp03-tooltip-and-placement.md
readme: Tooltip (primitive row, after Popover)
todo: `knowledge/laws-of-ux/paradox-of-the-active-user.md`, `law-of-proximity.md`: `applies` does not list Tooltip, whose card names both laws
todo: Tooltip, owner decision (review DESIGN): every tooltip waits the full `tooltipDelay`, also right after its neighbour showed, so reading a toolbar or the AppShell rail costs half a second per icon; a show within about 300 ms of the last hide could skip the delay
todo: Tooltip, for WP16 (review DESIGN): the panel paints `--ui-surface`, the ground of the Dialog, Card and Table it mostly sits on (1.04 to 1.14:1 against the page, border 1.22 to 1.91:1, no visible shadow in dark themes); when overlays move to `--ui-surface-raised`, weigh the inverted pair (`--ui-ink` ground, `--ui-surface` text) with its pair declared in `scripts/contrast.ts`
keys: none
screenshots: Tooltip (both themes looked at; review round 1 moved nothing visible: at most 1 of 255 in 21 light and 949 dark pixels against the earlier render; round 2 byte-identical to round 1). Popover's look did not move (both files byte-identical to a render of the base `Popover.vue`, before and after round 1); its dark file differs from the committed one through WP01's border shade
probes: Chromium, one-off Playwright runs (not committed) against the Tooltip demo and the review's scratch demo, 1440 by 900. Hoverable: from 3 px inside the trigger to 3 px inside the panel at 2, 15 and 60 px/s (paced CDP moves, about 55 px/s real at the top), sampled every frame: kept in the wrapper form below and above, the inside form, `end` and inside a `showModal()` dialog, 15 of 15 (before round 1: lost below 44 px/s). Root font sizes 12, 16, 20 and 24 px (the browser's default text size): gap 4.00 px at each, kept every frame at 2 px/s in the same five places, 20 of 20; the last pixel row wholly inside the trigger is the trigger and a click there reaches the button while the tooltip shows; where the trigger's edge cuts a pixel row (12, 20, 24 px) that one row hits the panel, because Chrome counts a point as on an element up to 1 px before its edge. A press on the bridge hides the panel and leaves the page under the point. Press: Enter on a Popover trigger without autofocus opens it with no tooltip and one Escape closes it; after a mouse click and a 14 px move inside the trigger nothing shows over the open panel for 700 ms. Own popup open, on a copy with WP04's planned Button line: the Menu's kebab, a Popover with a Tooltip inside its trigger, a Tooltip around a whole Popover and one around the element in a Popover's trigger slot: click, into the panel and back onto the trigger, 800 ms: no tooltip, one Escape closes the panel, out and back on the closed trigger shows the tooltip (without the guard: the tooltip over all four panels, two Escapes). Dialogs, on a copy with WP04's planned Button line: Dialog and Sheet opened by Enter show no tooltip on the X and close with one Escape; Tab and Shift+Tab back to the X show "Close", Escape hides it, a second closes the dialog. Persistent: Tab to Duplicate, the pointer over the button and away, 400 ms later still shown and still `:focus-visible`; Escape hides it. Name: a `description` Tooltip inside a text button gives name "Strong", description "Bold". Anchors: a Tooltip around a Popover and one around the element in its `trigger` slot put the tooltip 4 px under the trigger and the Popover's panel under it, with `aria-describedby` on the button. `end` at the right edge: `data-placement="start"`, the panel ends 4 px before the trigger and the trigger's centre is the trigger. A long URL wraps (`scrollWidth` 254, `clientWidth` 254). Frame loop: 30 callbacks per 500 ms after focus, blur and focus in one task, 0 after blur, 0 after a route change unmounted the demo. Touch (390 by 844): taps on Export, Bold and Customers show nothing. Placement parity with the code before the move: 2,400,000 random rectangles and 392 real placements in the six Popover users identical. Touch probe: `--only=Tooltip` 0 offenders; `--all` 0 offenders, 0 smaller than known, 0 stale, 48 known, 14 exempt
